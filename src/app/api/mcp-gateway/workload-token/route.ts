import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Pool } from "pg";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { hashWorkloadToken, issueWorkloadToken } from "@/lib/elitze-secure/workload-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30000),
  connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 10000),
});

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL || !process.env.ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET) {
    return json({ ok: false, error: "WORKLOAD_IDENTITY_BLOCKED", reason: "critical_dependency_unconfigured" }, 503);
  }
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const body = await request.json().catch(() => null) as {
    tenantId?: string;
    humanOwnerId?: string;
    applicationId?: string;
    agentIdentityId?: string;
    delegationSource?: string;
    purpose?: string;
    requestedCapability?: string;
    approvalAuthorityId?: string;
    toolId?: string;
    resourceType?: string;
    resourceId?: string;
    credentialRef?: string;
    ttlSeconds?: number;
  } | null;

  if (!body?.tenantId || !body.humanOwnerId || !body.applicationId || !body.agentIdentityId || !body.delegationSource || !body.purpose || !body.requestedCapability) {
    return json({ ok: false, error: "identity_chain_fields_required" }, 400);
  }

  const ttlSeconds = Math.max(30, Math.min(900, Number(body.ttlSeconds ?? 300)));
  const client = await pool.connect();
  try {
    const agent = await client.query(
      `SELECT id, tenant_id, active FROM agent_identities WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [body.agentIdentityId, body.tenantId],
    );
    if (agent.rowCount !== 1 || !agent.rows[0].active) return json({ ok: false, error: "agent_identity_not_active" }, 403);

    const sessionId = crypto.randomUUID();
    const token = issueWorkloadToken({
      sub: sessionId,
      tenantId: body.tenantId,
      humanOwnerId: body.humanOwnerId,
      applicationId: body.applicationId,
      agentIdentityId: body.agentIdentityId,
      workloadSessionId: sessionId,
      delegationSource: body.delegationSource,
      purpose: body.purpose,
      requestedCapability: body.requestedCapability,
      approvalAuthorityId: body.approvalAuthorityId,
    }, ttlSeconds);
    const tokenHash = hashWorkloadToken(token);
    const tokenKid = "current";
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO workload_sessions
        (id, tenant_id, human_owner_id, application_id, agent_identity_id, delegation_source, purpose, requested_capability, approval_authority_id, token_hash, token_kid, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [sessionId, body.tenantId, body.humanOwnerId, body.applicationId, body.agentIdentityId, body.delegationSource, body.purpose, body.requestedCapability, body.approvalAuthorityId ?? null, tokenHash, tokenKid, expiresAt],
    );
    await client.query(
      `INSERT INTO workload_delegations
        (tenant_id, workload_session_id, human_owner_id, delegation_source, purpose, requested_capability, tool_id, resource_type, resource_id, credential_ref, approval_authority_id, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [body.tenantId, sessionId, body.humanOwnerId, body.delegationSource, body.purpose, body.requestedCapability, body.toolId ?? null, body.resourceType ?? null, body.resourceId ?? null, body.credentialRef ?? null, body.approvalAuthorityId ?? null, expiresAt],
    );
    await client.query("COMMIT");

    return json({
      ok: true,
      token,
      tokenType: "Bearer",
      workloadSessionId: sessionId,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds,
      credentialsInAgentContext: false,
    }, 201);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return json({ ok: false, error: error instanceof Error ? error.message : "workload_token_issuance_failed" }, 500);
  } finally {
    client.release();
  }
}
