import { NextRequest, NextResponse } from "next/server";
import https from "node:https";
import crypto from "node:crypto";
import { createApproval } from "@/lib/elitze-secure/approval-workflow";
import { getPgPool, isDatabaseConfigured } from "@/db";
import {
  capabilityAllows,
  createPinnedLookup,
  evaluateMcpCall,
  maxUpstreamResponseBytes,
  moreRestrictiveDecision,
  parseCapabilitySet,
  signGatewayEvidence,
  validateMcpUpstreamUrl,
} from "@/lib/elitze-secure/mcp-gateway";
import {
  hashWorkloadToken,
  verifyWorkloadToken,
} from "@/lib/elitze-secure/workload-identity";
import {
  evaluatePolicies,
  type PolicyDocument,
} from "@/lib/elitze-secure/deterministic-policy";
import { persistObservedTool } from "@/lib/elitze-secure/mcp-observation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pool = { connect: () => getPgPool().connect() };
const MAX_REQUEST_BYTES = 256 * 1024;
const RATE_WINDOW_SECONDS = 60;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function requestBodyId(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const id = (body as Record<string, unknown>).id;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

function mapDecision(
  decision: string,
): "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "ALLOW_WITH_CONSTRAINTS" {
  if (
    decision === "ALLOW" ||
    decision === "DENY" ||
    decision === "REQUIRE_APPROVAL" ||
    decision === "ALLOW_WITH_CONSTRAINTS"
  ) {
    return decision;
  }
  return "DENY";
}

function allowedCredentialEnv(name: string): boolean {
  if (name === "ELITZE_MCP_GATEWAY_CREDENTIAL") return true;

  const allowlist = (process.env.ELITZE_MCP_CREDENTIAL_ENV_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return allowlist.includes(name);
}

async function consumeMcpRateLimit(
  client: import("pg").PoolClient,
  tenantId: string,
  workloadSessionId: string,
  method: string,
) {
  const maxAttempts = method === "tools/list" ? 30 : 60;
  const bucket = crypto
    .createHash("sha256")
    .update(`mcp:${tenantId}:${workloadSessionId}:${method}`)
    .digest("hex");

  const result = await client.query(
    `INSERT INTO mcp_gateway_rate_limits
      (bucket, tenant_id, workload_session_id, attempts, window_started_at)
     VALUES ($1,$2,$3,1,now())
     ON CONFLICT (bucket) DO UPDATE SET
       attempts = CASE
         WHEN mcp_gateway_rate_limits.window_started_at <= now() - make_interval(secs => $4::double precision)
         THEN 1
         ELSE mcp_gateway_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN mcp_gateway_rate_limits.window_started_at <= now() - make_interval(secs => $4::double precision)
         THEN now()
         ELSE mcp_gateway_rate_limits.window_started_at
       END
     RETURNING attempts`,
    [bucket, tenantId, workloadSessionId, RATE_WINDOW_SECONDS],
  );

  return Number(result.rows[0]?.attempts ?? maxAttempts + 1) <= maxAttempts;
}

async function reserveRequestId(
  client: import("pg").PoolClient,
  tenantId: string,
  workloadSessionId: string,
  requestId: string,
  jti: string,
  expiresAt: number,
) {
  const inserted = await client.query(
    `INSERT INTO mcp_gateway_request_nonces
      (tenant_id, workload_session_id, request_id, token_jti, expires_at)
     VALUES ($1,$2,$3,$4,to_timestamp($5))
     ON CONFLICT (tenant_id, workload_session_id, request_id) DO NOTHING
     RETURNING id`,
    [tenantId, workloadSessionId, requestId, jti, expiresAt],
  );
  if (inserted.rowCount === 1) return true;

  const existing = await client.query(
    `SELECT token_jti, consumed_at, expires_at
       FROM mcp_gateway_request_nonces
      WHERE tenant_id=$1 AND workload_session_id=$2 AND request_id=$3
      LIMIT 1`,
    [tenantId, workloadSessionId, requestId],
  );
  if (existing.rowCount !== 1) return false;
  return String(existing.rows[0].token_jti) === jti &&
    !existing.rows[0].consumed_at &&
    new Date(existing.rows[0].expires_at).getTime() > Date.now();
}

async function consumeRequestId(
  client: import("pg").PoolClient,
  tenantId: string,
  workloadSessionId: string,
  requestId: string,
) {
  const consumed = await client.query(
    `UPDATE mcp_gateway_request_nonces
        SET consumed_at=now()
      WHERE tenant_id=$1 AND workload_session_id=$2 AND request_id=$3
        AND consumed_at IS NULL AND expires_at > now()
      RETURNING id`,
    [tenantId, workloadSessionId, requestId],
  );
  return consumed.rowCount === 1;
}

async function callMcpUpstream(
  endpoint: string,
  credentialEnv: string | null,
  bodyText: string,
) {
  const validated = await validateMcpUpstreamUrl(endpoint);
  const url = validated.url;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "accept-encoding": "identity",
  };

  if (credentialEnv) {
    if (!allowedCredentialEnv(credentialEnv)) {
      throw new Error("mcp_upstream_credential_env_not_allowed");
    }
    const credential = process.env[credentialEnv];
    if (!credential) throw new Error("mcp_upstream_credential_missing");
    headers.authorization = `Bearer ${credential}`;
  }

  type UpstreamResponse = {
    ok: boolean;
    status: number;
    headers: { get(name: string): string | null };
  };

  return await new Promise<{ response: UpstreamResponse; raw: string }>((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const upstreamRequest = https.request(
      url,
      {
        method: "POST",
        headers,
        lookup: createPinnedLookup(validated.addresses),
        servername: url.hostname,
        rejectUnauthorized: true,
        timeout: 30_000,
      },
      (upstreamResponse) => {
        const status = upstreamResponse.statusCode ?? 502;
        if (status >= 300 && status < 400) {
          upstreamResponse.resume();
          fail(new Error("mcp_upstream_redirect_blocked"));
          return;
        }

        const contentLength = Number(upstreamResponse.headers["content-length"] ?? 0);
        if (contentLength > maxUpstreamResponseBytes()) {
          upstreamResponse.destroy();
          fail(new Error("mcp_upstream_response_too_large"));
          return;
        }

        const encoding = String(upstreamResponse.headers["content-encoding"] ?? "identity").toLowerCase();
        if (encoding !== "identity") {
          upstreamResponse.destroy();
          fail(new Error("mcp_upstream_content_encoding_unsupported"));
          return;
        }

        const chunks: Buffer[] = [];
        let totalBytes = 0;
        upstreamResponse.on("data", (chunk: Buffer | string) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          totalBytes += buffer.byteLength;
          if (totalBytes > maxUpstreamResponseBytes()) {
            upstreamResponse.destroy();
            upstreamRequest.destroy();
            fail(new Error("mcp_upstream_response_too_large"));
            return;
          }
          chunks.push(buffer);
        });

        upstreamResponse.on("end", () => {
          if (settled) return;
          settled = true;
          const raw = Buffer.concat(chunks).toString("utf8");
          resolve({
            response: {
              ok: status >= 200 && status < 300,
              status,
              headers: {
                get(name: string) {
                  const value = upstreamResponse.headers[name.toLowerCase()];
                  if (Array.isArray(value)) return value.join(", ");
                  return value ?? null;
                },
              },
            },
            raw,
          });
        });

        upstreamResponse.on("error", fail);
      },
    );

    upstreamRequest.on("error", fail);
    upstreamRequest.on("timeout", () => {
      upstreamRequest.destroy(new Error("mcp_upstream_timeout"));
    });
    upstreamRequest.end(bodyText);
  });
}

async function appendDecision(
  client: import("pg").PoolClient,
  input: {
    tenantId: string;
    workloadSessionId: string;
    agentIdentityId: string;
    gatewayServerId: string;
    humanOwnerId: string;
    applicationId: string;
    delegationSource: string;
    purpose: string;
    requestedCapability: string;
    approvalAuthorityId: string | null;
    toolName: string;
    action: string;
    decision: "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "ALLOW_WITH_CONSTRAINTS";
    policyVersion: string;
    policyId: string | null;
    constraints: Record<string, unknown>;
    approvalReference: string | null;
    upstreamStatus?: number;
    upstreamResultHash?: string;
    requestId: string;
    event: Record<string, unknown>;
  },
) {
  await client.query("BEGIN");
  try {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`elitze:mcp:evidence:${input.tenantId}`],
    );

    const previous = await client.query(
      `SELECT evidence_hash
         FROM mcp_gateway_decisions
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [input.tenantId],
    );
    const previousHash = previous.rows[0]?.evidence_hash ?? null;
    const signed = signGatewayEvidence(
      {
        ...input.event,
        approvalReference: input.approvalReference,
        upstreamStatus: input.upstreamStatus,
        upstreamResultHash: input.upstreamResultHash,
      },
      previousHash,
    );

    const inserted = await client.query(
      `INSERT INTO mcp_gateway_decisions
        (tenant_id,request_id,workload_session_id,agent_identity_id,gateway_server_id,
         human_owner_id,application_id,delegation_source,purpose,requested_capability,
         approval_authority_id,tool_name,action,decision,policy_version,policy_id,
         resource_type,resource_id,constraints,approval_reference,upstream_status,
         upstream_result_hash,evidence_hash,evidence_signature,previous_evidence_hash,
         observed_at,created_at)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
         $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
       RETURNING decision_ref`,
      [
        input.tenantId,
        input.requestId,
        input.workloadSessionId,
        input.agentIdentityId,
        input.gatewayServerId,
        input.humanOwnerId,
        input.applicationId,
        input.delegationSource,
        input.purpose,
        input.requestedCapability,
        input.approvalAuthorityId,
        input.toolName,
        input.action,
        input.decision,
        input.policyVersion,
        input.policyId,
        null,
        null,
        input.constraints,
        input.approvalReference,
        input.upstreamStatus ?? null,
        input.upstreamResultHash ?? null,
        signed.evidenceHash,
        signed.signature,
        previousHash,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    );

    await client.query("COMMIT");
    return {
      decisionRef: String(inserted.rows[0]?.decision_ref ?? input.requestId),
      evidenceHash: signed.evidenceHash,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function approvalIsValid(
  client: import("pg").PoolClient,
  input: {
    tenantId: string;
    approvalReference: string;
    humanOwnerId: string;
    agentIdentityId: string;
    toolName: string;
    target: string;
  },
) {
  const result = await client.query(
    `SELECT approval_id
       FROM security_approvals
      WHERE tenant_id = $1
        AND approval_id = $2
        AND requested_by = $3
        AND agent_id = $4
        AND action = $5
        AND target = $6
        AND status = 'APPROVED'
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1`,
    [
      input.tenantId,
      input.approvalReference,
      input.humanOwnerId,
      input.agentIdentityId,
      input.toolName,
      input.target,
    ],
  );
  return result.rowCount === 1;
}

export async function POST(request: NextRequest) {
  if (process.env.ELITZE_MCP_GATEWAY_ENABLED === "false") {
    return json(
      { error: "MCP_GATEWAY_DISABLED", failClosed: true },
      503,
    );
  }

  if (
    !isDatabaseConfigured() ||
    !process.env.ELITZE_EVIDENCE_SIGNING_SECRET ||
    !process.env.ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET
  ) {
    return json(
      {
        error: "MCP_GATEWAY_BLOCKED",
        reason: "critical_dependency_unconfigured",
        failClosed: true,
      },
      503,
    );
  }

  const authorization =
    request.headers.get("Authorization") ??
    request.headers.get("authorization") ??
    "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) return json({ error: "UNAUTHENTICATED_WORKLOAD" }, 401);

  let claims;
  try {
    claims = verifyWorkloadToken(token);
  } catch {
    return json({ error: "INVALID_WORKLOAD_TOKEN" }, 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "MCP_REQUEST_TOO_LARGE" }, 413);
  }

  const rawBody = await request.text().catch(() => "");
  if (!rawBody || Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
    return json({ error: "INVALID_OR_OVERSIZED_JSON" }, rawBody ? 413 : 400);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  if (claims.sub !== claims.workloadSessionId) {
    return json({ error: "WORKLOAD_IDENTITY_MISMATCH" }, 401);
  }

  const method = typeof body.method === "string" ? body.method : "";
  if (method === "tools/call" && process.env.ELITZE_MCP_GATEWAY_EXECUTION_ENABLED !== "true") {
    return json(
      { error: "MCP_TOOL_EXECUTION_DISABLED", failClosed: true },
      503,
    );
  }
  const requestId = requestBodyId(body) ?? crypto.randomUUID();
  const client = await pool.connect();

  try {
    const session = await client.query(
      `SELECT
         ws.id,
         ws.tenant_id,
         ws.human_owner_id,
         ws.application_id,
         ws.agent_identity_id,
         ws.gateway_server_id,
         ws.delegation_source,
         ws.purpose,
         ws.requested_capability,
         ws.approval_authority_id,
         ws.expires_at,
         ws.revoked_at,
         ai.name AS agent_name,
         wd.tool_id,
         wd.tool_name,
         wd.resource_type,
         wd.resource_id,
         wd.credential_ref
       FROM workload_sessions ws
       JOIN agent_identities ai ON ai.id = ws.agent_identity_id
       LEFT JOIN LATERAL (
         SELECT tool_id, tool_name, resource_type, resource_id, credential_ref
           FROM workload_delegations
          WHERE workload_session_id = ws.id
          ORDER BY created_at DESC
          LIMIT 1
       ) wd ON true
      WHERE ws.id = $1
        AND ws.tenant_id = $2
        AND ws.agent_identity_id = $3
        AND ws.gateway_server_id = $4
        AND ws.token_hash = $5
        AND ws.revoked_at IS NULL
        AND ws.expires_at > now()
      LIMIT 1`,
      [
        claims.workloadSessionId,
        claims.tenantId,
        claims.agentIdentityId,
        claims.gatewayServerId,
        hashWorkloadToken(token),
      ],
    );

    if (session.rowCount !== 1) {
      return json({ error: "WORKLOAD_SESSION_INVALID_OR_EXPIRED" }, 401);
    }

    const chain = session.rows[0];

    if (
      chain.human_owner_id !== claims.humanOwnerId ||
      chain.application_id !== claims.applicationId ||
      chain.delegation_source !== claims.delegationSource ||
      chain.gateway_server_id !== claims.gatewayServerId
    ) {
      return json({ error: "WORKLOAD_IDENTITY_MISMATCH" }, 401);
    }

    const rateAllowed = await consumeMcpRateLimit(
      client,
      String(chain.tenant_id),
      String(chain.id),
      method,
    );
    if (!rateAllowed) {
      return json({ error: "MCP_RATE_LIMITED", retryAfterSeconds: RATE_WINDOW_SECONDS }, 429);
    }

    if (method === "tools/list") {
      const server = await client.query(
        `SELECT id,name,endpoint_url,credential_env,active
           FROM mcp_gateway_servers
          WHERE id=$1 AND tenant_id=$2 AND agent_identity_id=$3 AND active=true
          LIMIT 1`,
        [chain.gateway_server_id, chain.tenant_id, chain.agent_identity_id],
      );

      if (server.rowCount !== 1) {
        return json({ error: "MCP_GATEWAY_BLOCKED", reason: "server_not_authorized" }, 403);
      }

      const upstream = await callMcpUpstream(
        String(server.rows[0].endpoint_url),
        server.rows[0].credential_env ? String(server.rows[0].credential_env) : null,
        rawBody,
      );

      if (!upstream.response.ok) {
        return json({ error: "MCP_UPSTREAM_UNAVAILABLE" }, 502);
      }

      let result: Record<string, unknown>;
      try {
        result = JSON.parse(upstream.raw) as Record<string, unknown>;
      } catch {
        return json({ error: "MCP_UPSTREAM_INVALID_RESPONSE" }, 502);
      }

      const tools = Array.isArray((result as any)?.result?.tools)
        ? (result as any).result.tools
        : [];

      const capabilities = parseCapabilitySet(String(chain.requested_capability));
      const delegatedToolName = chain.tool_name
        ? String(chain.tool_name).trim().toLowerCase()
        : null;

      const authorizedTools = tools.filter((tool: unknown) => {
        const name = tool && typeof tool === "object" && typeof (tool as any).name === "string"
          ? String((tool as any).name).trim().toLowerCase()
          : "";
        if (!name) return false;
        if (delegatedToolName) return name === delegatedToolName;
        return capabilities.includes(name);
      });

      for (const tool of tools) {
        await persistObservedTool(client, {
          tenantId: String(chain.tenant_id),
          serverId: String(server.rows[0].id),
          serverName: String(server.rows[0].name),
          tool: tool && typeof tool === "object" ? tool as any : {},
          sourceRef: `mcp-gateway:${String(server.rows[0].id)}:tools/list`,
          observedAt: new Date(),
        });
      }

      return json({
        jsonrpc: "2.0",
        id: body.id ?? null,
        result: { tools: authorizedTools },
      });
    }

    if (method !== "tools/call") {
      return json({ error: "MCP_METHOD_NOT_SUPPORTED" }, 400);
    }

    if (process.env.ELITZE_MCP_GATEWAY_EXECUTION_ENABLED === "false") {
      return json({ error: "MCP_EXECUTION_DISABLED", failClosed: true }, 503);
    }

    const toolName =
      typeof (body.params as any)?.name === "string"
        ? String((body.params as any).name).trim()
        : "";

    const serverName =
      typeof (body.params as any)?.server === "string"
        ? String((body.params as any).server).trim()
        : undefined;

    if (!toolName) return json({ error: "MCP_TOOL_ROUTE_NOT_FOUND" }, 404);

    if (
      chain.tool_name &&
      String(chain.tool_name).trim().toLowerCase() !== toolName.toLowerCase()
    ) {
      return json({ error: "DELEGATED_TOOL_SCOPE_EXCEEDED" }, 403);
    }

    if (!capabilityAllows(String(chain.requested_capability), toolName)) {
      return json({ error: "DELEGATED_CAPABILITY_EXCEEDED" }, 403);
    }

    const server = await client.query(
      `SELECT id,name,endpoint_url,credential_env,active
         FROM mcp_gateway_servers
        WHERE id=$1 AND tenant_id=$2 AND agent_identity_id=$3
          AND active=true
        LIMIT 1`,
      [chain.gateway_server_id, chain.tenant_id, chain.agent_identity_id],
    );

    if (
      server.rowCount !== 1 ||
      (serverName && String(server.rows[0].name) !== serverName)
    ) {
      return json({ error: "MCP_TOOL_ROUTE_NOT_FOUND" }, 404);
    }

    const params =
      body.params && typeof body.params === "object"
        ? (body.params as Record<string, unknown>)
        : {};

    const classification =
      /secret|credential|password|token|private/i.test(toolName)
        ? "RESTRICTED"
        : /slack|message|send|webhook/i.test(toolName)
          ? "CONFIDENTIAL"
          : String(params.dataClassification ?? "STANDARD").toUpperCase();

    const resource =
      typeof params.resource === "string"
        ? params.resource.trim()
        : chain.resource_id
          ? String(chain.resource_id)
          : undefined;

    const environment =
      typeof params.environment === "string"
        ? params.environment.trim()
        : undefined;

    const purpose =
      typeof params.purpose === "string"
        ? params.purpose.trim()
        : String(chain.purpose);

    const impactLevel =
      typeof params.impactLevel === "string"
        ? params.impactLevel.toUpperCase()
        : undefined;

    const policiesResult = await client.query(
      `SELECT id,name,version,definition
         FROM security_policies
        WHERE tenant_id=$1
          AND active=true
          AND (expires_at IS NULL OR expires_at>now())
        ORDER BY priority DESC`,
      [chain.tenant_id],
    );

    const policies = policiesResult.rows.map((row: any) => ({
      ...(row.definition as PolicyDocument),
      id: String(row.id),
      name: String(row.name),
      version: String(row.version),
      active: true,
    }));

    const policyMatch = evaluatePolicies(policies, {
      agentIdentityId: String(chain.agent_identity_id),
      agentName: String(chain.agent_name),
      humanOwnerId: String(chain.human_owner_id),
      tool: toolName,
      action: toolName,
      dataClassification:
        classification === "STANDARD" ? undefined : classification as any,
      resource,
      environment,
      purpose,
      impactLevel: impactLevel as any,
    });

    const fallback = evaluateMcpCall({
      tenantId: String(chain.tenant_id),
      agentIdentityId: String(chain.agent_identity_id),
      gatewayServerId: String(server.rows[0].id),
      toolName,
      action: toolName,
      dataClassification:
        classification === "STANDARD" ? undefined : classification as any,
      requestedCapability: String(chain.requested_capability),
      resource,
      environment,
      purpose,
      arguments: params.arguments,
      requestId,
      impactLevel,
    });

    const policyDecision = policyMatch
      ? mapDecision(policyMatch.decision)
      : "DENY";

    const baseDecision = moreRestrictiveDecision(
      policyDecision,
      fallback.decision,
    );

    const policyReasons = policyMatch?.reasons ?? [];
    const fallbackReasons = fallback.reasons;
    const reasons = [...policyReasons, ...fallbackReasons];
    const policyVersion =
      policyMatch?.policyVersion ?? fallback.policyVersion;
    const policyId = policyMatch?.policyId ?? null;
    const constraints: Record<string, unknown> = {
      ...fallback.constraints,
      ...(policyMatch?.approverRole
        ? { approvalRole: policyMatch.approverRole }
        : {}),
      ...(policyMatch?.approvalExpiresAt
        ? { approvalExpiresAt: policyMatch.approvalExpiresAt }
        : {}),
    };

    const requestedAt = new Date().toISOString();
    const baseEvent = {
      decisionId: requestId,
      tenantId: String(chain.tenant_id),
      workloadSessionId: String(chain.id),
      workloadTokenJti: claims.jti,
      humanOwnerId: String(chain.human_owner_id),
      applicationId: String(chain.application_id),
      agentId: String(chain.agent_identity_id),
      agentName: String(chain.agent_name),
      gatewayServerId: String(server.rows[0].id),
      toolName,
      delegationSource: String(chain.delegation_source),
      requestedCapability: String(chain.requested_capability),
      approvalAuthorityId: chain.approval_authority_id
        ? String(chain.approval_authority_id)
        : null,
      resource,
      environment,
      purpose,
      requestedAt,
    };

    if (!(await reserveRequestId(
      client,
      String(chain.tenant_id),
      String(chain.id),
      requestId,
      claims.jti,
      claims.exp,
    ))) {
      return json({ error: "MCP_REQUEST_REPLAY_DETECTED" }, 409);
    }

    const approvalReference =
      typeof params.approvalReference === "string"
        ? params.approvalReference.trim()
        : "";

    let decision = baseDecision;

    if (baseDecision === "REQUIRE_APPROVAL") {
      const target = `${String(server.rows[0].name)}:${toolName}:${resource ?? "*"}`;

      if (approvalReference) {
        const valid = await approvalIsValid(client, {
          tenantId: String(chain.tenant_id),
          approvalReference,
          humanOwnerId: String(chain.human_owner_id),
          agentIdentityId: String(chain.agent_identity_id),
          toolName,
          target,
        });

        if (!valid) {
          const recorded = await appendDecision(client, {
            tenantId: String(chain.tenant_id),
            workloadSessionId: String(chain.id),
            agentIdentityId: String(chain.agent_identity_id),
            gatewayServerId: String(server.rows[0].id),
            humanOwnerId: String(chain.human_owner_id),
            applicationId: String(chain.application_id),
            delegationSource: String(chain.delegation_source),
            purpose,
            requestedCapability: String(chain.requested_capability),
            approvalAuthorityId: chain.approval_authority_id
              ? String(chain.approval_authority_id)
              : null,
            toolName,
            action: toolName,
            decision: "DENY",
            policyVersion,
            policyId,
            constraints,
            approvalReference,
            requestId,
            event: { ...baseEvent, reasons: [...reasons, "approval_invalid"] },
          });
          return json(
            {
              jsonrpc: "2.0",
              id: body.id ?? null,
              error: {
                code: -32001,
                message: "APPROVAL_REQUIRED",
                data: {
                  decisionId: recorded.decisionRef,
                  approvalReference,
                  evidenceHash: recorded.evidenceHash,
                },
              },
            },
            403,
          );
        }
        decision = "ALLOW";
      } else {
        const risk =
          classification === "RESTRICTED" || impactLevel === "CRITICAL"
            ? "CRITICAL"
            : impactLevel === "HIGH" || classification === "CONFIDENTIAL"
              ? "HIGH"
              : "MEDIUM";

        const approval = await createApproval({
          tenantId: String(chain.tenant_id),
          requestedBy: String(chain.human_owner_id),
          agentId: String(chain.agent_identity_id),
          action: toolName,
          target,
          risk,
          rationale: purpose,
          ttlMinutes: 30,
        });

        const recorded = await appendDecision(client, {
          tenantId: String(chain.tenant_id),
          workloadSessionId: String(chain.id),
          agentIdentityId: String(chain.agent_identity_id),
          gatewayServerId: String(server.rows[0].id),
          humanOwnerId: String(chain.human_owner_id),
          applicationId: String(chain.application_id),
          delegationSource: String(chain.delegation_source),
          purpose,
          requestedCapability: String(chain.requested_capability),
          approvalAuthorityId: chain.approval_authority_id
            ? String(chain.approval_authority_id)
            : null,
          toolName,
          action: toolName,
          decision: "REQUIRE_APPROVAL",
          policyVersion,
          policyId,
          constraints,
          approvalReference: approval.approvalId,
          requestId,
          event: {
            ...baseEvent,
            reasons: [...reasons, "approval_created"],
          },
        });

        return json(
          {
            jsonrpc: "2.0",
            id: body.id ?? null,
            error: {
              code: -32001,
              message: "APPROVAL_REQUIRED",
              data: {
                decisionId: recorded.decisionRef,
                approvalReference: approval.approvalId,
                evidenceHash: recorded.evidenceHash,
              },
            },
          },
          403,
        );
      }
    }

    if (decision === "DENY") {
      const recorded = await appendDecision(client, {
        tenantId: String(chain.tenant_id),
        workloadSessionId: String(chain.id),
        agentIdentityId: String(chain.agent_identity_id),
        gatewayServerId: String(server.rows[0].id),
        humanOwnerId: String(chain.human_owner_id),
        applicationId: String(chain.application_id),
        delegationSource: String(chain.delegation_source),
        purpose,
        requestedCapability: String(chain.requested_capability),
        approvalAuthorityId: chain.approval_authority_id
          ? String(chain.approval_authority_id)
          : null,
        toolName,
        action: toolName,
        decision,
        policyVersion,
        policyId,
        constraints,
        approvalReference: approvalReference || null,
        requestId,
        event: { ...baseEvent, reasons },
      });

      return json(
        {
          jsonrpc: "2.0",
          id: body.id ?? null,
          error: {
            code: -32001,
            message: decision,
            data: {
              reasons,
              decisionId: recorded.decisionRef,
              evidenceHash: recorded.evidenceHash,
            },
          },
        },
        403,
      );
    }

    if (!(await consumeRequestId(
      client,
      String(chain.tenant_id),
      String(chain.id),
      requestId,
    ))) {
      return json({ error: "MCP_REQUEST_REPLAY_DETECTED" }, 409);
    }

    const upstream = await callMcpUpstream(
      String(server.rows[0].endpoint_url),
      server.rows[0].credential_env
        ? String(server.rows[0].credential_env)
        : null,
      rawBody,
    );

    const upstreamResultHash = crypto
      .createHash("sha256")
      .update(upstream.raw)
      .digest("hex");

    const recorded = await appendDecision(client, {
      tenantId: String(chain.tenant_id),
      workloadSessionId: String(chain.id),
      agentIdentityId: String(chain.agent_identity_id),
      gatewayServerId: String(server.rows[0].id),
      humanOwnerId: String(chain.human_owner_id),
      applicationId: String(chain.application_id),
      delegationSource: String(chain.delegation_source),
      purpose,
      requestedCapability: String(chain.requested_capability),
      approvalAuthorityId: chain.approval_authority_id
        ? String(chain.approval_authority_id)
        : null,
      toolName,
      action: toolName,
      decision,
      policyVersion,
      policyId,
      constraints,
      approvalReference: approvalReference || null,
      upstreamStatus: upstream.response.status,
      upstreamResultHash,
      requestId,
      event: baseEvent,
    });

    return new NextResponse(upstream.raw, {
      status: upstream.response.status,
      headers: {
        "content-type":
          upstream.response.headers.get("content-type") ??
          "application/json",
        "cache-control": "no-store",
        "x-elitze-decision-ref": recorded.decisionRef,
      },
    });
  } catch (error) {
    console.error("ELITZE MCP gateway request failed", error);
    return json(
      { error: "MCP_GATEWAY_REQUEST_FAILED" },
      503,
    );
  } finally {
    client.release();
  }
}
