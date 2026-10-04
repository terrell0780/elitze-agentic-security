import { createHash, randomUUID } from "node:crypto";
import { getPgPool } from "@/db";
import { createApproval } from "@/lib/elitze-secure/approval-workflow";
import { getSecuritySkill } from "@/lib/security-skills";

export type WorkflowTrigger = "MANUAL" | "SCHEDULED" | "EVENT";
export type WorkflowAutonomy = "READ_ONLY" | "APPROVAL_GATED" | "AUTONOMOUS";
export type WorkflowRunStatus =
  | "PLANNED"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED";

const HIGH_IMPACT_ACTIONS = [
  "delete",
  "disable",
  "isolate",
  "rotate",
  "revoke",
  "shutdown",
  "quarantine",
  "block",
  "publish",
  "send",
  "purchase",
  "production",
  "permission",
];

function clean(value: string, max: number) {
  const result = value.trim();
  if (!result || result.length > max) throw new Error("invalid_workflow_input");
  return result;
}

function contentHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function requiresApproval(action: string | null | undefined, autonomy: WorkflowAutonomy) {
  if (autonomy !== "AUTONOMOUS") return true;
  const normalized = (action ?? "").toLowerCase();
  return HIGH_IMPACT_ACTIONS.some((term) => normalized.includes(term));
}

function validateSkills(skillIds: string[]) {
  const unique = [...new Set(skillIds.map((id) => clean(id, 120)))];
  for (const skillId of unique) {
    if (!getSecuritySkill(skillId)) throw new Error("unknown_security_skill");
  }
  return unique;
}

export async function createAgentWorkflow(input: {
  tenantId: string;
  createdBy: string;
  workflowKey: string;
  name: string;
  description: string;
  triggerKind: WorkflowTrigger;
  schedule?: string | null;
  timezone?: string | null;
  enabled?: boolean;
  autonomyMode?: WorkflowAutonomy;
  allowedSkillIds?: string[];
  allowedChannels?: string[];
  maxDelegationDepth?: number;
  definition?: Record<string, unknown>;
}) {
  const tenantId = clean(input.tenantId, 200);
  const createdBy = clean(input.createdBy, 200);
  const workflowKey = clean(input.workflowKey, 200);
  const name = clean(input.name, 300);
  const description = clean(input.description, 5000);
  const allowedSkillIds = validateSkills(input.allowedSkillIds ?? []);
  const allowedChannels = [...new Set((input.allowedChannels ?? []).map((channel) => clean(channel, 40)))];
  const validChannels = new Set(["LLM", "MCP", "A2A", "API", "BROWSER", "SAAS"]);
  if (allowedChannels.some((channel) => !validChannels.has(channel))) throw new Error("invalid_workflow_channel");
  if (!["MANUAL", "SCHEDULED", "EVENT"].includes(input.triggerKind)) throw new Error("invalid_workflow_trigger");
  if (input.triggerKind === "SCHEDULED" && !input.schedule?.trim()) throw new Error("scheduled_workflow_requires_schedule");
  if (!["READ_ONLY", "APPROVAL_GATED", "AUTONOMOUS"].includes(input.autonomyMode ?? "APPROVAL_GATED")) throw new Error("invalid_workflow_autonomy");
  const maxDelegationDepth = Math.min(Math.max(Math.trunc(input.maxDelegationDepth ?? 1), 0), 8);
  const definition = input.definition ?? {};

  const result = await getPgPool().query(
    `INSERT INTO agent_workflows
      (tenant_id,workflow_key,name,description,trigger_kind,schedule,timezone,enabled,autonomy_mode,
       allowed_skill_ids,allowed_channels,max_delegation_depth,definition,created_by,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)
     RETURNING id,tenant_id,workflow_key,name,description,trigger_kind,schedule,timezone,enabled,
       autonomy_mode,allowed_skill_ids,allowed_channels,max_delegation_depth,definition,created_by,created_at,updated_at`,
    [
      tenantId,
      workflowKey,
      name,
      description,
      input.triggerKind,
      input.schedule ?? null,
      input.timezone ?? "UTC",
      Boolean(input.enabled),
      input.autonomyMode ?? "APPROVAL_GATED",
      allowedSkillIds,
      allowedChannels,
      maxDelegationDepth,
      JSON.stringify(definition),
      createdBy,
      new Date(),
    ],
  );
  return result.rows[0];
}

export async function createAgentWorkflowRun(input: {
  tenantId: string;
  workflowId: string;
  agentId: string;
  objective: string;
  requestedAction?: string | null;
  triggerKind?: WorkflowTrigger;
  parentRunId?: string | null;
}) {
  const tenantId = clean(input.tenantId, 200);
  const workflowId = clean(input.workflowId, 100);
  const agentId = clean(input.agentId, 100);
  const objective = clean(input.objective, 8000);

  const workflow = await getPgPool().query(
    `SELECT id,trigger_kind AS "triggerKind",autonomy_mode AS "autonomyMode",enabled
       FROM agent_workflows WHERE id=$1::uuid AND tenant_id=$2 LIMIT 1`,
    [workflowId, tenantId],
  );
  if (!workflow.rows[0]) throw new Error("workflow_not_found");
  if (!workflow.rows[0].enabled) throw new Error("workflow_disabled");

  const agent = await getPgPool().query(
    `SELECT id,active FROM agent_identities WHERE id=$1::uuid AND tenant_id=$2::uuid AND kind='AGENT' LIMIT 1`,
    [agentId, tenantId],
  );
  if (!agent.rows[0]?.active) throw new Error("agent_identity_unavailable");

  const triggerKind = input.triggerKind ?? workflow.rows[0].triggerKind;
  const approvalNeeded = requiresApproval(input.requestedAction, workflow.rows[0].autonomyMode);
  let approvalId: string | null = null;

  if (approvalNeeded && input.requestedAction) {
    const approval = await createApproval({
      tenantId,
      requestedBy: agentId,
      agentId,
      action: clean(input.requestedAction, 500),
      target: "workflow",
      risk: "HIGH",
      rationale: objective,
      evidenceIds: [],
      ttlMinutes: 30,
    });
    approvalId = String(approval.approvalId);
  }

  const status: WorkflowRunStatus = approvalId ? "WAITING_APPROVAL" : "PLANNED";
  const result = await getPgPool().query(
    `INSERT INTO agent_workflow_runs
      (tenant_id,workflow_id,agent_id,trigger_kind,status,evidence_state,objective,requested_action,approval_id,parent_run_id)
     VALUES ($1,$2::uuid,$3::uuid,$4,$5,'UNMEASURABLE',$6,$7,$8,$9)
     RETURNING id,tenant_id,workflow_id,agent_id,trigger_kind,status,evidence_state,objective,requested_action,
       approval_id,parent_run_id,current_step,started_at,completed_at,retest_status,result_summary,created_at`,
    [tenantId, workflowId, agentId, triggerKind, status, objective, input.requestedAction ?? null, approvalId, input.parentRunId ?? null],
  );

  return result.rows[0];
}

export async function claimAgentWorkflowRun(tenantId: string, runId: string) {
  const result = await getPgPool().query(
    `UPDATE agent_workflow_runs r
       SET status='RUNNING', started_at=COALESCE(started_at,now())
     WHERE r.id=$1::uuid AND r.tenant_id=$2
       AND r.status='PLANNED'
       AND (
         r.approval_id IS NULL
         OR EXISTS (
           SELECT 1 FROM security_approvals a
            WHERE a.approval_id=r.approval_id AND a.tenant_id=r.tenant_id
              AND a.status='APPROVED'
              AND (a.expires_at IS NULL OR a.expires_at>now())
         )
       )
     RETURNING r.*`,
    [clean(runId, 100), clean(tenantId, 200)],
  );
  return result.rows[0] ?? null;
}

export async function completeAgentWorkflowRun(input: {
  tenantId: string;
  runId: string;
  status: Exclude<WorkflowRunStatus, "PLANNED" | "RUNNING" | "WAITING_APPROVAL">;
  evidenceState: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  retestStatus?: "NOT_RUN" | "PENDING" | "PASSED" | "FAILED" | "UNMEASURABLE";
  resultSummary?: Record<string, unknown>;
}) {
  const result = await getPgPool().query(
    `UPDATE agent_workflow_runs
       SET status=$3,evidence_state=$4,retest_status=$5,result_summary=$6::jsonb,completed_at=now()
     WHERE id=$1::uuid AND tenant_id=$2 AND status='RUNNING'
     RETURNING *`,
    [
      clean(input.runId, 100),
      clean(input.tenantId, 200),
      input.status,
      input.evidenceState,
      input.retestStatus ?? "NOT_RUN",
      JSON.stringify(input.resultSummary ?? {}),
    ],
  );
  return result.rows[0] ?? null;
}

export async function recordAgentMemory(input: {
  tenantId: string;
  agentId: string;
  memoryKey: string;
  content: string;
  sourceRefs?: string[];
  evidenceIds?: string[];
  expiresAt?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const tenantId = clean(input.tenantId, 200);
  const agentId = clean(input.agentId, 100);
  const memoryKey = clean(input.memoryKey, 240);
  const content = clean(input.content, 100_000);

  const agent = await getPgPool().query(
    `SELECT id FROM agent_identities WHERE id=$1::uuid AND tenant_id=$2::uuid AND kind='AGENT' AND active=true LIMIT 1`,
    [agentId, tenantId],
  );
  if (!agent.rows[0]) throw new Error("agent_identity_unavailable");

  const result = await getPgPool().query(
    `INSERT INTO agent_memory_records
      (tenant_id,agent_id,memory_key,content,content_hash,trust_state,source_refs,evidence_ids,expires_at,metadata,updated_at)
     VALUES ($1,$2::uuid,$3,$4,$5,'UNTRUSTED',$6,$7,$8,$9::jsonb,now())
     ON CONFLICT (tenant_id,agent_id,memory_key) DO UPDATE SET
       content=EXCLUDED.content,
       content_hash=EXCLUDED.content_hash,
       trust_state='UNTRUSTED',
       source_refs=EXCLUDED.source_refs,
       evidence_ids=EXCLUDED.evidence_ids,
       expires_at=EXCLUDED.expires_at,
       metadata=EXCLUDED.metadata,
       updated_at=now()
     RETURNING id,tenant_id,agent_id,memory_key,content_hash,trust_state,source_refs,evidence_ids,expires_at,metadata,created_at,updated_at`,
    [
      tenantId,
      agentId,
      memoryKey,
      content,
      contentHash(content),
      input.sourceRefs ?? [],
      input.evidenceIds ?? [],
      input.expiresAt ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return result.rows[0];
}

export async function delegateAgent(input: {
  tenantId: string;
  sourceAgentId: string;
  targetAgentId: string;
  purpose: string;
  scope?: Record<string, unknown>;
  workflowId?: string | null;
  maxDepth?: number;
  expiresAt: string;
  createdBy: string;
}) {
  const tenantId = clean(input.tenantId, 200);
  const sourceAgentId = clean(input.sourceAgentId, 100);
  const targetAgentId = clean(input.targetAgentId, 100);
  if (sourceAgentId === targetAgentId) throw new Error("self_delegation_forbidden");

  const agents = await getPgPool().query(
    `SELECT id FROM agent_identities
       WHERE tenant_id=$1::uuid AND id IN ($2::uuid,$3::uuid) AND kind='AGENT' AND active=true`,
    [tenantId, sourceAgentId, targetAgentId],
  );
  if (agents.rows.length !== 2) throw new Error("delegation_agent_identity_unavailable");

  const maxDepth = Math.min(Math.max(Math.trunc(input.maxDepth ?? 1), 1), 8);
  const expiresAt = new Date(input.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw new Error("delegation_expiry_invalid");
  }

  const result = await getPgPool().query(
    `INSERT INTO agent_delegations
      (tenant_id,source_agent_id,target_agent_id,workflow_id,scope,purpose,max_depth,expires_at,created_by)
     VALUES ($1,$2::uuid,$3::uuid,$4::uuid,$5::jsonb,$6,$7,$8,$9)
     RETURNING *`,
    [
      tenantId,
      sourceAgentId,
      targetAgentId,
      input.workflowId ?? null,
      JSON.stringify(input.scope ?? {}),
      clean(input.purpose, 2000),
      maxDepth,
      expiresAt,
      clean(input.createdBy, 200),
    ],
  );
  return result.rows[0];
}

export async function listAgentWorkflowState(tenantId: string, agentId?: string) {
  const cleanTenant = clean(tenantId, 200);
  const agentFilter = agentId ? " AND agent_id=$2::uuid" : "";
  const args = agentId ? [cleanTenant, clean(agentId, 100)] : [cleanTenant];

  const [workflows, runs, memories, delegations, routines] = await Promise.all([
    getPgPool().query(`SELECT * FROM agent_workflows WHERE tenant_id=$1 ORDER BY updated_at DESC`, args),
    getPgPool().query(`SELECT * FROM agent_workflow_runs WHERE tenant_id=$1${agentFilter} ORDER BY created_at DESC LIMIT 50`, args),
    getPgPool().query(`SELECT id,agent_id,memory_key,content_hash,trust_state,source_refs,evidence_ids,expires_at,metadata,created_at,updated_at FROM agent_memory_records WHERE tenant_id=$1${agentFilter} ORDER BY updated_at DESC LIMIT 100`, args),
    getPgPool().query(`SELECT * FROM agent_delegations WHERE tenant_id=$1 AND status='ACTIVE' AND expires_at>now()`, [cleanTenant]),
    getPgPool().query(`SELECT * FROM agent_routines WHERE tenant_id=$1 ORDER BY updated_at DESC`, [cleanTenant]),
  ]);
  return { workflows: workflows.rows, runs: runs.rows, memories: memories.rows, delegations: delegations.rows, routines: routines.rows };
}
