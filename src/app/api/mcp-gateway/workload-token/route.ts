import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPgPool, isDatabaseConfigured } from "@/db";
import { authorizeInternalRequest } from "@/lib/security/policy";
import {
  capabilityAllows,
  hashWorkloadToken,
  issueWorkloadToken,
  parseCapabilitySet,
} from "@/lib/elitze-secure/mcp-gateway";
import { hashWorkloadToken as hashToken } from "@/lib/elitze-secure/workload-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pool = { connect: () => getPgPool().connect() };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  if (
    !isDatabaseConfigured() ||
    !process.env.ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET
  ) {
    return json(
      {
        ok: false,
        error: "WORKLOAD_IDENTITY_BLOCKED",
        reason: "critical_dependency_unconfigured",
      },
      503,
    );
  }

  if (
    !authorizeInternalRequest(
      request.headers.get("x-elitze-api-key"),
      process.env.ELITZE_INTERNAL_API_KEY,
    )
  ) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const body = (await request.json().catch(() => null)) as {
    tenantId?: string;
    humanOwnerId?: string;
    applicationId?: string;
    agentIdentityId?: string;
    gatewayServerId?: string;
    delegationSource?: string;
    purpose?: string;
    requestedCapability?: string;
    approvalAuthorityId?: string;
    toolId?: string;
    toolName?: string;
    resourceType?: string;
    resourceId?: string;
    credentialRef?: string;
    ttlSeconds?: number;
  } | null;

  if (
    !body?.tenantId ||
    !body.humanOwnerId ||
    !body.applicationId ||
    !body.agentIdentityId ||
    !body.gatewayServerId ||
    !body.delegationSource ||
    !body.purpose ||
    !body.requestedCapability
  ) {
    return json({ ok: false, error: "identity_chain_fields_required" }, 400);
  }

  const capabilitySet = parseCapabilitySet(body.requestedCapability);
  if (!capabilitySet.length || body.requestedCapability.trim() === "*") {
    return json(
      { ok: false, error: "explicit_tool_capabilities_required" },
      400,
    );
  }

  if (
    body.toolName &&
    !capabilityAllows(body.requestedCapability, body.toolName)
  ) {
    return json(
      { ok: false, error: "tool_outside_requested_capability" },
      400,
    );
  }

  const requestedTtl = Number(body.ttlSeconds ?? 300);
  if (!Number.isFinite(requestedTtl)) {
    return json({ ok: false, error: "invalid_ttl" }, 400);
  }
  const ttlSeconds = Math.max(30, Math.min(900, Math.trunc(requestedTtl)));

  const client = await pool.connect();

  try {
    const server = await client.query(
      `SELECT id, agent_identity_id, active
         FROM mcp_gateway_servers
        WHERE id = $1 AND tenant_id = $2
        LIMIT 1`,
      [body.gatewayServerId, body.tenantId],
    );

    if (
      server.rowCount !== 1 ||
      !server.rows[0].active ||
      String(server.rows[0].agent_identity_id) !== body.agentIdentityId
    ) {
      return json({ ok: false, error: "mcp_server_identity_mismatch" }, 403);
    }

    const agent = await client.query(
      `SELECT id, active
         FROM agent_identities
        WHERE id = $1 AND tenant_id = $2 AND kind = 'AGENT'
        LIMIT 1`,
      [body.agentIdentityId, body.tenantId],
    );

    if (agent.rowCount !== 1 || !agent.rows[0].active) {
      return json({ ok: false, error: "agent_identity_not_active" }, 403);
    }

    const sessionId = crypto.randomUUID();
    const token = issueWorkloadToken(
      {
        sub: sessionId,
        tenantId: body.tenantId,
        humanOwnerId: body.humanOwnerId,
        applicationId: body.applicationId,
        agentIdentityId: body.agentIdentityId,
        workloadSessionId: sessionId,
        gatewayServerId: body.gatewayServerId,
        delegationSource: body.delegationSource,
        purpose: body.purpose,
        requestedCapability: capabilitySet.join(","),
        approvalAuthorityId: body.approvalAuthorityId,
      },
      ttlSeconds,
    );

    const tokenHash = hashToken(token);
    const tokenKid = "current";
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await client.query("BEGIN");

    await client.query(
      `INSERT INTO workload_sessions
        (id, tenant_id, human_owner_id, application_id, agent_identity_id,
         gateway_server_id, delegation_source, purpose, requested_capability,
         approval_authority_id, token_hash, token_kid, expires_at)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        sessionId,
        body.tenantId,
        body.humanOwnerId,
        body.applicationId,
        body.agentIdentityId,
        body.gatewayServerId,
        body.delegationSource,
        body.purpose,
        capabilitySet.join(","),
        body.approvalAuthorityId ?? null,
        tokenHash,
        tokenKid,
        expiresAt,
      ],
    );

    await client.query(
      `INSERT INTO workload_delegations
        (tenant_id, workload_session_id, human_owner_id, delegation_source,
         purpose, requested_capability, tool_id, tool_name, resource_type,
         resource_id, credential_ref, approval_authority_id, expires_at)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        body.tenantId,
        sessionId,
        body.humanOwnerId,
        body.delegationSource,
        body.purpose,
        capabilitySet.join(","),
        body.toolId ?? null,
        body.toolName?.trim().toLowerCase() || null,
        body.resourceType ?? null,
        body.resourceId ?? null,
        body.credentialRef ?? null,
        body.approvalAuthorityId ?? null,
        expiresAt,
      ],
    );

    await client.query("COMMIT");

    return json(
      {
        ok: true,
        token,
        tokenType: "Bearer",
        workloadSessionId: sessionId,
        gatewayServerId: body.gatewayServerId,
        capabilities: capabilitySet,
        expiresAt: expiresAt.toISOString(),
        ttlSeconds,
        credentialsInAgentContext: false,
      },
      201,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("ELITZE workload token issuance failed", error);
    return json(
      { ok: false, error: "workload_token_issuance_failed" },
      500,
    );
  } finally {
    client.release();
  }
}
