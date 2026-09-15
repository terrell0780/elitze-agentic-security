import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Pool } from "pg";
import { evaluateMcpCall, signGatewayEvidence } from "@/lib/elitze-secure/mcp-gateway";

export const runtime = "nodejs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30000),
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 10000),
});

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function requestBodyId(body: any): string | undefined {
  return typeof body?.id === "string" || typeof body?.id === "number" ? String(body.id) : undefined;
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL || !process.env.ELITZE_EVIDENCE_SIGNING_SECRET) {
    return json({ error: "MCP_GATEWAY_BLOCKED", reason: "critical_dependency_unconfigured" }, 503);
  }

  const token = request.headers.get("x-elitze-agent-token");
  if (!token) return json({ error: "UNAUTHENTICATED_AGENT" }, 401);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const method = typeof body?.method === "string" ? body.method : "";
  const requestId = requestBodyId(body) ?? crypto.randomUUID();

  const client = await pool.connect();
  try {
    const identity = await client.query(
      `SELECT id, tenant_id, name, kind, active
       FROM agent_identities
       WHERE token_hash = $1 AND active = true
       LIMIT 1`,
      [hashToken(token)],
    );
    if (identity.rowCount !== 1) return json({ error: "INVALID_AGENT_CREDENTIAL" }, 401);

    const agent = identity.rows[0];
    const servers = await client.query(
      `SELECT id, name, endpoint_url, credential_env, active
       FROM mcp_gateway_servers
       WHERE tenant_id = $1 AND active = true
       ORDER BY name`,
      [agent.tenant_id],
    );

    if (servers.rowCount === 0) return json({ error: "MCP_GATEWAY_BLOCKED", reason: "no_registered_server" }, 503);

    if (method === "tools/list") {
      const merged = [];
      for (const server of servers.rows) {
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (server.credential_env) {
          const credential = process.env[server.credential_env];
          if (!credential) return json({ error: "MCP_GATEWAY_BLOCKED", reason: `missing_gateway_credential:${server.credential_env}` }, 503);
          headers.authorization = `Bearer ${credential}`;
        }
        const response = await fetch(server.endpoint_url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          cache: "no-store",
        });
        if (!response.ok) return json({ error: "MCP_UPSTREAM_UNAVAILABLE", server: server.name, status: response.status }, 502);
        const result = await response.json();
        if (Array.isArray(result?.result?.tools)) merged.push(...result.result.tools.map((tool: any) => ({ ...tool, _server: server.name })));
      }
      return json({ jsonrpc: "2.0", id: body.id ?? null, result: { tools: merged } });
    }

    if (method !== "tools/call") return json({ error: "MCP_METHOD_NOT_SUPPORTED", method }, 400);

    const toolName = typeof body?.params?.name === "string" ? body.params.name : "";
    const serverName = typeof body?.params?.server === "string" ? body.params.server : undefined;
    const server = servers.rows.find((candidate: any) => !serverName || candidate.name === serverName);
    if (!server || !toolName) return json({ error: "MCP_TOOL_ROUTE_NOT_FOUND" }, 404);

    const classification = /secret|credential|password|token|private/i.test(toolName) ? "RESTRICTED" : /slack|message|send/i.test(toolName) ? "CONFIDENTIAL" : "PUBLIC";
    const evaluation = evaluateMcpCall({
      tenantId: String(agent.tenant_id),
      agentIdentityId: String(agent.id),
      gatewayServerId: String(server.id),
      toolName,
      action: toolName,
      dataClassification: classification,
      arguments: body?.params?.arguments,
      requestId,
    });

    const baseEvent = {
      requestId,
      tenantId: String(agent.tenant_id),
      agentIdentityId: String(agent.id),
      gatewayServerId: String(server.id),
      toolName,
      action: toolName,
      decision: evaluation.decision,
      policyVersion: evaluation.policyVersion,
      constraints: evaluation.constraints,
      createdAt: new Date().toISOString(),
    };

    const previous = await client.query(
      `SELECT evidence_hash FROM mcp_gateway_decisions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [agent.tenant_id],
    );
    const previousHash = previous.rows[0]?.evidence_hash ?? null;

    if (evaluation.decision !== "ALLOW" && evaluation.decision !== "ALLOW_WITH_CONSTRAINTS") {
      const signed = signGatewayEvidence(baseEvent, previousHash);
      await client.query(
        `INSERT INTO mcp_gateway_decisions
          (tenant_id, request_id, agent_identity_id, gateway_server_id, tool_name, action, decision, policy_version, constraints, approval_reference, evidence_hash, evidence_signature, previous_evidence_hash)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [agent.tenant_id, requestId, agent.id, server.id, toolName, toolName, evaluation.decision, evaluation.policyVersion, evaluation.constraints, null, signed.evidenceHash, signed.signature, previousHash],
      );
      return json({ jsonrpc: "2.0", id: body.id ?? null, error: { code: -32001, message: evaluation.decision, data: { reasons: evaluation.reasons, evidenceHash: signed.evidenceHash, signature: signed.signature } } }, evaluation.decision === "REQUIRE_APPROVAL" ? 403 : 403);
    }

    const credential = server.credential_env ? process.env[server.credential_env] : undefined;
    if (server.credential_env && !credential) return json({ error: "MCP_GATEWAY_BLOCKED", reason: "upstream_credential_missing" }, 503);

    const headers: Record<string, string> = { "content-type": "application/json" };
    if (credential) headers.authorization = `Bearer ${credential}`;

    let upstream: Response;
    try {
      upstream = await fetch(server.endpoint_url, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });
    } catch {
      return json({ error: "MCP_UPSTREAM_UNAVAILABLE", failClosed: true }, 503);
    }

    const raw = await upstream.text();
    const upstreamResultHash = crypto.createHash("sha256").update(raw).digest("hex");
    const signed = signGatewayEvidence({ ...baseEvent, upstreamStatus: upstream.status, upstreamResultHash }, previousHash);
    await client.query(
      `INSERT INTO mcp_gateway_decisions
        (tenant_id, request_id, agent_identity_id, gateway_server_id, tool_name, action, decision, policy_version, constraints, upstream_status, upstream_result_hash, evidence_hash, evidence_signature, previous_evidence_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [agent.tenant_id, requestId, agent.id, server.id, toolName, toolName, evaluation.decision, evaluation.policyVersion, evaluation.constraints, upstream.status, upstreamResultHash, signed.evidenceHash, signed.signature, previousHash],
    );

    return new NextResponse(raw, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", "cache-control": "no-store", "x-elitze-evidence-hash": signed.evidenceHash },
    });
  } finally {
    client.release();
  }
}
