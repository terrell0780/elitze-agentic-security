import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getPgPool } from "@/db";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";
import { EnforcementPoint } from "@/lib/elitze-secure/runtime-enforcement";
import { DEFAULT_SECURITY_POLICIES, PolicyEngine } from "@/lib/elitze-secure/policy-engine";
import type { EvidenceState } from "@/lib/elitze-secure/decision";

export type IdentityKind = "AGENT" | "MODEL" | "MCP_SERVER" | "TOOL";
export type ResourceType = "TOOL" | "MCP_SERVER" | "API" | "SECRET" | "DATA";
export type AccessMode = "READ" | "WRITE" | "EXECUTE" | "ADMIN";

type JsonRecord = Record<string, unknown>;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(48).toString("base64url");

export class AgentMcpControlPlane {
  private readonly audit = new AuditLedger();
  private readonly enforcement = new EnforcementPoint(
    new PolicyEngine(DEFAULT_SECURITY_POLICIES),
    this.audit,
  );

  async registerIdentity(args: {
    tenantId: string;
    name: string;
    kind: IdentityKind;
    metadata?: JsonRecord;
  }) {
    const tenantId = args.tenantId.trim();
    const name = args.name.trim();
    if (!tenantId || !name) throw new Error("tenant_and_name_required");

    const secret = token();
    const fingerprint = digest(`${tenantId}:${args.kind}:${name}:${randomUUID()}`);
    const prefix = secret.slice(0, 12);
    const result = await getPgPool().query(
      `INSERT INTO agent_identities
        (tenant_id,name,kind,identity_fingerprint,token_hash,token_prefix,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
       RETURNING id, tenant_id, name, kind, identity_fingerprint, token_prefix, active, created_at`,
      [tenantId, name, args.kind, fingerprint, digest(secret), prefix, JSON.stringify(args.metadata ?? {})],
    );

    const row = result.rows[0];
    await this.audit.append(tenantId, "control_plane.identity_registered", {
      identityId: row.id,
      kind: row.kind,
      identityFingerprint: row.identity_fingerprint,
      tokenPrefix: row.token_prefix,
    });

    return { ...row, token: secret };
  }

  async recordReachability(args: {
    tenantId: string;
    agentId: string;
    resources: Array<{
      resourceType: ResourceType;
      resourceId: string;
      resourceName: string;
      accessMode: AccessMode;
      evidenceState: EvidenceState;
      source: string;
      metadata?: JsonRecord;
    }>;
  }) {
    const client = await getPgPool().connect();
    try {
      await client.query("BEGIN");
      for (const resource of args.resources) {
        await client.query(
          `INSERT INTO agent_reachability
            (tenant_id,agent_id,resource_type,resource_id,resource_name,access_mode,evidence_state,source,metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
           ON CONFLICT (tenant_id,agent_id,resource_type,resource_id,access_mode)
           DO UPDATE SET resource_name=EXCLUDED.resource_name,
                         evidence_state=EXCLUDED.evidence_state,
                         source=EXCLUDED.source,
                         metadata=EXCLUDED.metadata,
                         observed_at=now()`,
          [args.tenantId, args.agentId, resource.resourceType, resource.resourceId, resource.resourceName, resource.accessMode, resource.evidenceState, resource.source, JSON.stringify(resource.metadata ?? {})],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const event = await this.audit.append(args.tenantId, "control_plane.reachability_observed", {
      agentId: args.agentId,
      count: args.resources.length,
    });
    return { accepted: args.resources.length, auditEventId: event.id };
  }

  async evaluateAction(args: {
    tenantId: string;
    agentId: string;
    action: string;
    mcpServerId?: string;
    toolId?: string;
    modelId?: string;
    providerId?: string;
    dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
    constraint?: JsonRecord;
  }) {
    const decision = await this.enforcement.evaluate(
      {
        tenantId: args.tenantId,
        subjectId: args.agentId,
        action: args.action,
        modelId: args.modelId,
        providerId: args.providerId,
        toolId: args.toolId,
        mcpServerId: args.mcpServerId,
        dataClassification: args.dataClassification,
      },
      args.mcpServerId ? "MCP_CALL" : args.toolId ? "TOOL_CALL" : "AGENT_ACTION",
    );

    const approvalRequired = decision.decision === "REVIEW" || decision.decision === "QUEUE";
    const result = await getPgPool().query(
      `INSERT INTO runtime_action_requests
        (tenant_id,agent_id,mcp_server_id,tool_id,action,data_classification,decision,approval_required,constraint_json,evidence_state,audit_event_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::uuid)
       RETURNING id, decision, approval_required, constraint_json, evidence_state, requested_at`,
      [args.tenantId, args.agentId, args.mcpServerId ?? null, args.toolId ?? null, args.action, args.dataClassification ?? null, decision.decision, approvalRequired, JSON.stringify(args.constraint ?? {}), decision.evidenceState, decision.auditEventId],
    );

    return { ...decision, actionRequestId: result.rows[0]?.id ?? null, approvalRequired };
  }

  async recordResult(args: {
    tenantId: string;
    actionRequestId: string;
    status: "EXECUTED" | "DENIED" | "FAILED" | "CONSTRAINED";
    summary?: string;
  }) {
    const result = await getPgPool().query(
      `UPDATE runtime_action_requests
       SET result_status=$1,
           result_summary=$2,
           completed_at=now(),
           retest_status=CASE WHEN $1 IN ('DENIED','FAILED') THEN 'PENDING' ELSE 'PENDING' END
       WHERE id=$3 AND tenant_id=$4
       RETURNING id, result_status, result_summary, completed_at, retest_status`,
      [args.status, args.summary ?? null, args.actionRequestId, args.tenantId],
    );
    if (result.rowCount !== 1) throw new Error("action_request_not_found");
    await this.audit.append(args.tenantId, "control_plane.runtime_result", {
      actionRequestId: args.actionRequestId,
      status: args.status,
      summary: args.summary ?? null,
    });
    return result.rows[0];
  }

  async retest(args: { tenantId: string; actionRequestId: string; passed: boolean; reason?: string }) {
    const status = args.passed ? "PASSED" : "FAILED";
    const result = await getPgPool().query(
      `UPDATE runtime_action_requests
       SET retest_status=$1
       WHERE id=$2 AND tenant_id=$3
       RETURNING id, retest_status`,
      [status, args.actionRequestId, args.tenantId],
    );
    if (result.rowCount !== 1) throw new Error("action_request_not_found");
    await this.audit.append(args.tenantId, "control_plane.retest", {
      actionRequestId: args.actionRequestId,
      status,
      reason: args.reason ?? null,
    });
    return result.rows[0];
  }

  async snapshot(tenantId: string) {
    const db = getPgPool();
    const [identities, reachability, actions] = await Promise.all([
      db.query(`SELECT id,name,kind,identity_fingerprint,token_prefix,active,created_at FROM agent_identities WHERE tenant_id=$1 ORDER BY created_at DESC`, [tenantId]),
      db.query(`SELECT id,agent_id,resource_type,resource_id,resource_name,access_mode,evidence_state,source,observed_at FROM agent_reachability WHERE tenant_id=$1 ORDER BY observed_at DESC`, [tenantId]),
      db.query(`SELECT id,agent_id,action,decision,approval_required,result_status,evidence_state,requested_at,completed_at,retest_status FROM runtime_action_requests WHERE tenant_id=$1 ORDER BY requested_at DESC LIMIT 100`, [tenantId]),
    ]);
    return { identities: identities.rows, reachability: reachability.rows, actions: actions.rows };
  }
}
