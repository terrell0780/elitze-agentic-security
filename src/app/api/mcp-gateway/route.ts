import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Pool } from "pg";
import { evaluateMcpCall, signGatewayEvidence } from "@/lib/elitze-secure/mcp-gateway";
import { hashWorkloadToken, verifyWorkloadToken } from "@/lib/elitze-secure/workload-identity";
import { evaluatePolicies, type PolicyDocument } from "@/lib/elitze-secure/deterministic-policy";

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
function requestBodyId(body: any): string | undefined {
  return typeof body?.id === "string" || typeof body?.id === "number" ? String(body.id) : undefined;
}
function capabilityAllows(requestedCapability: string, toolName: string) {
  const capability = requestedCapability.trim().toLowerCase();
  const tool = toolName.trim().toLowerCase();
  return capability === "*" || capability === tool || capability.split(/[,\s]+/).includes(tool);
}
function mapDecision(decision: string): "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "ALLOW_WITH_CONSTRAINTS" {
  if (decision === "ALLOW" || decision === "DENY" || decision === "REQUIRE_APPROVAL" || decision === "ALLOW_WITH_CONSTRAINTS") return decision;
  throw new Error(`invalid_gateway_decision:${decision}`);
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL || !process.env.ELITZE_EVIDENCE_SIGNING_SECRET || !process.env.ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET) {
    return json({ error: "MCP_GATEWAY_BLOCKED", reason: "critical_dependency_unconfigured" }, 503);
  }
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return json({ error: "UNAUTHENTICATED_WORKLOAD" }, 401);

  let claims;
  try { claims = verifyWorkloadToken(token); }
  catch (error) { return json({ error: "INVALID_WORKLOAD_TOKEN", reason: error instanceof Error ? error.message : "verification_failed" }, 401); }

  let body: any;
  try { body = await request.json(); }
  catch { return json({ error: "INVALID_JSON" }, 400); }

  const method = typeof body?.method === "string" ? body.method : "";
  const requestId = requestBodyId(body) ?? crypto.randomUUID();
  const client = await pool.connect();

  try {
    const session = await client.query(
      `SELECT ws.id, ws.tenant_id, ws.human_owner_id, ws.application_id, ws.agent_identity_id,
              ws.delegation_source, ws.purpose, ws.requested_capability, ws.approval_authority_id,
              ws.expires_at, ws.revoked_at, ai.name AS agent_name,
              wd.tool_id, wd.resource_type, wd.resource_id, wd.credential_ref
       FROM workload_sessions ws
       JOIN agent_identities ai ON ai.id = ws.agent_identity_id
       LEFT JOIN LATERAL (
         SELECT tool_id, resource_type, resource_id, credential_ref
         FROM workload_delegations
         WHERE workload_session_id = ws.id
         ORDER BY created_at DESC
         LIMIT 1
       ) wd ON true
       WHERE ws.id = $1 AND ws.tenant_id = $2 AND ws.agent_identity_id = $3
         AND ws.token_hash = $4 AND ws.revoked_at IS NULL AND ws.expires_at > now()
       LIMIT 1`,
      [claims.workloadSessionId, claims.tenantId, claims.agentIdentityId, hashWorkloadToken(token)],
    );
    if (session.rowCount !== 1) return json({ error: "WORKLOAD_SESSION_INVALID_OR_EXPIRED" }, 401);

    const chain = session.rows[0];
    if (chain.human_owner_id !== claims.humanOwnerId || chain.application_id !== claims.applicationId || chain.delegation_source !== claims.delegationSource) {
      return json({ error: "WORKLOAD_IDENTITY_CHAIN_MISMATCH" }, 401);
    }

    const servers = await client.query(
      `SELECT id, name, endpoint_url, credential_env, active
       FROM mcp_gateway_servers WHERE tenant_id = $1 AND active = true ORDER BY name`,
      [chain.tenant_id],
    );
    if (servers.rowCount === 0) return json({ error: "MCP_GATEWAY_BLOCKED", reason: "no_registered_server" }, 503);

    if (method === "tools/list") {
      const merged = [];
      for (const server of servers.rows) {
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (server.credential_env) {
          const credential = process.env[server.credential_env];
          if (!credential) return json({ error: "MCP_GATEWAY_BLOCKED", reason: "gateway_credential_unconfigured" }, 503);
          headers.authorization = `Bearer ${credential}`;
        }
        let response: Response;
        try { response = await fetch(server.endpoint_url, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" }); }
        catch { return json({ error: "MCP_UPSTREAM_UNAVAILABLE", failClosed: true }, 503); }
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
    if (!capabilityAllows(String(chain.requested_capability), toolName)) return json({ error: "DELEGATED_CAPABILITY_EXCEEDED", requestedCapability: chain.requested_capability, toolName }, 403);

    const classification = /secret|credential|password|token|private/i.test(toolName) ? "RESTRICTED" : /slack|message|send/i.test(toolName) ? "CONFIDENTIAL" : (body?.params?.dataClassification ?? "PUBLIC");
    const resource = typeof body?.params?.resource === "string" ? body.params.resource : (chain.resource_id ? String(chain.resource_id) : undefined);
    const environment = typeof body?.params?.environment === "string" ? body.params.environment : undefined;
    const purpose = typeof body?.params?.purpose === "string" ? body.params.purpose : String(chain.purpose);
    const impactLevel = typeof body?.params?.impactLevel === "string" ? body.params.impactLevel : undefined;

    const policiesResult = await client.query(
      `SELECT id, name, version, definition FROM security_policies WHERE tenant_id = $1 AND active = true AND (expires_at IS NULL OR expires_at > now()) ORDER BY created_at ASC`,
      [chain.tenant_id],
    );
    const policies = policiesResult.rows.map((row: any) => ({ ...(row.definition as PolicyDocument), id: String(row.id), name: String(row.name), version: String(row.version), active: true }));
    const policyMatch = evaluatePolicies(policies, {
      agentIdentityId: String(chain.agent_identity_id),
      agentName: String(chain.agent_name),
      humanOwnerId: String(chain.human_owner_id),
      tool: toolName,
      action: toolName,
      resource,
      environment,
      dataClassification: classification,
      purpose,
      impactLevel: impactLevel as any,
      now: new Date(),
    });

    const fallback = evaluateMcpCall({
      tenantId: String(chain.tenant_id), agentIdentityId: String(chain.agent_identity_id), gatewayServerId: String(server.id),
      toolName, action: toolName, dataClassification: classification, arguments: body?.params?.arguments, purpose, requestId,
    });
    const decision = mapDecision(policyMatch?.decision ?? fallback.decision);
    const reasons = policyMatch ? policyMatch.reasons : fallback.reasons;
    const policyVersion = policyMatch?.policyVersion ?? fallback.policyVersion;
    const policyId = policyMatch?.policyId ?? null;
    const constraints: Record<string, unknown> = {
      ...fallback.constraints,
      ...(policyMatch?.approverRole ? { approvalRole: policyMatch.approverRole } : {}),
      ...(policyMatch?.approvalExpiresAt ? { approvalExpiresAt: policyMatch.approvalExpiresAt } : {}),
    };

    const baseEvent = {
      decisionId: requestId,
      tenantId: String(chain.tenant_id),
      humanOwnerId: String(chain.human_owner_id),
      applicationId: String(chain.application_id),
      agentId: String(chain.agent_identity_id),
      workloadSessionId: String(chain.id),
      delegationSource: String(chain.delegation_source),
      purpose,
      requestedCapability: String(chain.requested_capability),
      tool: toolName,
      action: toolName,
      resource: resource ?? null,
      environment: environment ?? null,
      dataClassification: classification,
      impactLevel: impactLevel ?? null,
      gatewayServerId: String(server.id),
      decision,
      policyId,
      policyVersion,
      requestedAt: new Date().toISOString(),
      evidenceSource: "mcp-gateway",
      evidenceState: "OBSERVED",
      sourceRef: request.headers.get("x-request-id") ?? requestId,
      freshnessAt: new Date().toISOString(),
      reasons,
      constraints,
    };

    const previous = await client.query(`SELECT evidence_hash FROM mcp_gateway_decisions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1`, [chain.tenant_id]);
    const previousHash = previous.rows[0]?.evidence_hash ?? null;
    const approvalReference = decision === "REQUIRE_APPROVAL" ? crypto.randomUUID() : null;

    if (decision !== "ALLOW" && decision !== "ALLOW_WITH_CONSTRAINTS") {
      const signed = signGatewayEvidence({ ...baseEvent, approvalReference }, previousHash);
      const inserted = await client.query(
        `INSERT INTO mcp_gateway_decisions
          (tenant_id, request_id, agent_identity_id, gateway_server_id, tool_name, action, decision, policy_version, constraints, approval_reference, evidence_hash, evidence_signature, previous_evidence_hash, workload_session_id, human_owner_id, application_id, delegation_source, purpose, requested_capability, resource_type, resource_id, credential_ref, approval_authority_id, expires_at, policy_id, evidence_source, evidence_state, source_ref, freshness_at, observed_at, evidence_event)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
         RETURNING decision_ref`,
        [chain.tenant_id, requestId, chain.agent_identity_id, server.id, toolName, toolName, decision, policyVersion, constraints, approvalReference, signed.evidenceHash, signed.signature, previousHash, chain.id, chain.human_owner_id, chain.application_id, chain.delegation_source, purpose, chain.requested_capability, chain.resource_type ?? null, resource ?? null, chain.credential_ref ?? null, chain.approval_authority_id ?? null, chain.expires_at, policyId, "mcp-gateway", "OBSERVED", baseEvent.sourceRef, baseEvent.freshnessAt, baseEvent.requestedAt, JSON.stringify({ ...baseEvent, recordHash: signed.evidenceHash, signature: signed.signature, previousRecordHash: previousHash })],
      );
      return json({ jsonrpc: "2.0", id: body.id ?? null, error: { code: -32001, message: decision, data: { reasons, decisionId: inserted.rows[0]?.decision_ref, approvalReference, evidenceHash: signed.evidenceHash, signature: signed.signature } } }, 403);
    }

    const credential = server.credential_env ? process.env[server.credential_env] : undefined;
    if (server.credential_env && !credential) return json({ error: "MCP_GATEWAY_BLOCKED", reason: "upstream_credential_missing", failClosed: true }, 503);
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (credential) headers.authorization = `Bearer ${credential}`;

    let upstream: Response;
    try { upstream = await fetch(server.endpoint_url, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" }); }
    catch { return json({ error: "MCP_UPSTREAM_UNAVAILABLE", failClosed: true }, 503); }

    const raw = await upstream.text();
    const upstreamResultHash = crypto.createHash("sha256").update(raw).digest("hex");
    const signed = signGatewayEvidence({ ...baseEvent, upstreamStatus: upstream.status, upstreamResultHash }, previousHash);
    const inserted = await client.query(
      `INSERT INTO mcp_gateway_decisions
        (tenant_id, request_id, agent_identity_id, gateway_server_id, tool_name, action, decision, policy_version, constraints, upstream_status, upstream_result_hash, evidence_hash, evidence_signature, previous_evidence_hash, workload_session_id, human_owner_id, application_id, delegation_source, purpose, requested_capability, resource_type, resource_id, credential_ref, approval_authority_id, expires_at, policy_id, evidence_source, evidence_state, source_ref, freshness_at, observed_at, evidence_event)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
       RETURNING decision_ref`,
      [chain.tenant_id, requestId, chain.agent_identity_id, server.id, toolName, toolName, decision, policyVersion, constraints, upstream.status, upstreamResultHash, signed.evidenceHash, signed.signature, previousHash, chain.id, chain.human_owner_id, chain.application_id, chain.delegation_source, purpose, chain.requested_capability, chain.resource_type ?? null, resource ?? null, chain.credential_ref ?? null, chain.approval_authority_id ?? null, chain.expires_at, policyId, "mcp-gateway", "OBSERVED", baseEvent.sourceRef, baseEvent.freshnessAt, baseEvent.requestedAt, JSON.stringify({ ...baseEvent, upstreamStatus: upstream.status, upstreamResultHash, recordHash: signed.evidenceHash, signature: signed.signature, previousRecordHash: previousHash })],
    );

    return new NextResponse(raw, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json", "cache-control": "no-store", "x-elitze-decision-id": inserted.rows[0]?.decision_ref ?? requestId, "x-elitze-evidence-hash": signed.evidenceHash },
    });
  } finally {
    client.release();
  }
}
