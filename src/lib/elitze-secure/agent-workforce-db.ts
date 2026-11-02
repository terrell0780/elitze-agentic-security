/**
 * Tenant-scoped persistence for the agent workforce and patch gauntlet.
 *
 * Fail-closed rules: every operation runs inside a transaction whose
 * app.tenant_id is set transaction-locally (same pattern as rag.ts). Missing
 * configuration, missing tenant context or any query error aborts the loop
 * immediately — errors are rethrown to the route layer for a 503 and a server
 * log line, never swallowed into a fabricated success.
 */

import { and, desc, eq } from "drizzle-orm";
import type { PoolClient } from "pg";
import { getDb, getPgPool } from "@/db";
import { agentPatchGauntlets, agentWorkforce } from "@/db/schema";
import {
  evaluateGauntlet,
  generateAgentIdentity,
  inferSpecialty,
  truncateLogExcerpt,
  type GauntletGateResult,
  type WorkforceAgent,
} from "./agent-workforce";

export type HireOutcome = { created: boolean; agent: WorkforceAgent };

async function withTenantClient<T>(tenantId: string, action: (client: PoolClient) => Promise<T>): Promise<T> {
  const normalizedTenantId = String(tenantId ?? "").trim();
  if (!normalizedTenantId) throw new Error("tenant_context_required");
  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [normalizedTenantId]);
    const result = await action(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function rowToAgent(row: Record<string, unknown>): WorkforceAgent {
  return {
    agentId: String(row.agent_id),
    name: String(row.name),
    avatarUrl: String(row.avatar_url),
    specialty: String(row.specialty),
    systemPrompt: String(row.system_prompt),
    status: String(row.status),
    hiredReason: row.hired_reason === null || row.hired_reason === undefined ? null : String(row.hired_reason),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

/** Hire (or return the already-active) specialized agent for a brief. */
export async function hireAgent(tenantId: string, brief: string, reason?: string): Promise<HireOutcome> {
  const specialty = inferSpecialty(brief);
  return withTenantClient(tenantId, async (client) => {
    const existing = await client.query(
      `SELECT agent_id AS "agentId", name, avatar_url AS "avatarUrl", specialty, system_prompt AS "systemPrompt",
              status, hired_reason AS "hiredReason", created_at AS "createdAt"
       FROM agent_workforce
       WHERE tenant_id = $1 AND specialty = $2 AND status = 'active'
       ORDER BY created_at ASC LIMIT 1`,
      [tenantId, specialty],
    );
    if (existing.rows[0]) return { created: false, agent: rowToAgent(existing.rows[0]) };

    const identity = generateAgentIdentity(specialty, `${tenantId}:${specialty}:${Date.now()}:${Math.random()}`);
    const inserted = await client.query(
      `INSERT INTO agent_workforce (tenant_id, agent_id, name, avatar_url, specialty, system_prompt, status, hired_reason)
       VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
       RETURNING agent_id AS "agentId", name, avatar_url AS "avatarUrl", specialty, system_prompt AS "systemPrompt",
                 status, hired_reason AS "hiredReason", created_at AS "createdAt"`,
      [tenantId, identity.agentId, identity.name, identity.avatarUrl, identity.specialty, identity.systemPrompt, truncateLogExcerpt(reason ?? "") || null],
    );
    return { created: true, agent: rowToAgent(inserted.rows[0]) };
  });
}

export async function listWorkforce(tenantId: string): Promise<WorkforceAgent[]> {
  const db = getDb();
  const rows = await db
    .select({
      agentId: agentWorkforce.agentId,
      name: agentWorkforce.name,
      avatarUrl: agentWorkforce.avatarUrl,
      specialty: agentWorkforce.specialty,
      systemPrompt: agentWorkforce.systemPrompt,
      status: agentWorkforce.status,
      hiredReason: agentWorkforce.hiredReason,
      createdAt: agentWorkforce.createdAt,
    })
    .from(agentWorkforce)
    .where(eq(agentWorkforce.tenantId, tenantId))
    .orderBy(desc(agentWorkforce.createdAt))
    .limit(200);
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export type GauntletRecord = {
  id: number;
  agentId: string;
  patchRef: string;
  status: "PASSED" | "FAILED";
  failingGate: string | null;
  logExcerpt: string | null;
  createdAt: string;
};

/** Record a gauntlet run. PASSED is derived only from recorded exit codes. */
export async function recordGauntletRun(
  tenantId: string,
  agentId: string,
  patchRef: string,
  gates: GauntletGateResult[],
): Promise<GauntletRecord> {
  const evaluation = evaluateGauntlet(gates);
  const db = getDb();
  const [row] = await db
    .insert(agentPatchGauntlets)
    .values({
      tenantId,
      agentId,
      patchRef,
      gates,
      status: evaluation.status,
      failingGate: evaluation.failingGate,
      logExcerpt: evaluation.logExcerpt,
    })
    .returning({
      id: agentPatchGauntlets.id,
      agentId: agentPatchGauntlets.agentId,
      patchRef: agentPatchGauntlets.patchRef,
      status: agentPatchGauntlets.status,
      failingGate: agentPatchGauntlets.failingGate,
      logExcerpt: agentPatchGauntlets.logExcerpt,
      createdAt: agentPatchGauntlets.createdAt,
    });
  return { ...row, status: row.status as GauntletRecord["status"], createdAt: row.createdAt.toISOString() };
}

export async function listGauntletRuns(tenantId: string, agentId?: string): Promise<GauntletRecord[]> {
  const db = getDb();
  const where = agentId
    ? and(eq(agentPatchGauntlets.tenantId, tenantId), eq(agentPatchGauntlets.agentId, agentId))
    : eq(agentPatchGauntlets.tenantId, tenantId);
  const rows = await db
    .select({
      id: agentPatchGauntlets.id,
      agentId: agentPatchGauntlets.agentId,
      patchRef: agentPatchGauntlets.patchRef,
      status: agentPatchGauntlets.status,
      failingGate: agentPatchGauntlets.failingGate,
      logExcerpt: agentPatchGauntlets.logExcerpt,
      createdAt: agentPatchGauntlets.createdAt,
    })
    .from(agentPatchGauntlets)
    .where(where)
    .orderBy(desc(agentPatchGauntlets.createdAt))
    .limit(100);
  return rows.map((row) => ({ ...row, status: row.status as GauntletRecord["status"], createdAt: row.createdAt.toISOString() }));
}
