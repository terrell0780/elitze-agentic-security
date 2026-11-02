/**
 * Tenant-scoped persistence for the agent workforce and patch gauntlet.
 *
 * Fail-closed rules: EVERY operation — reads included — runs inside a
 * transaction whose app.tenant_id is set transaction-locally (same pattern as
 * rag.ts). The workforce tables enforce FORCE ROW LEVEL SECURITY on that
 * setting, so pooled queries without tenant context would silently return no
 * rows or be rejected on write. Missing configuration, missing tenant context
 * or any query error aborts immediately — errors are rethrown to the route
 * layer for a 503 and a server log line, never swallowed into a fabricated
 * success.
 */

import type { PoolClient } from "pg";
import { getPgPool } from "@/db";
import {
  evaluateGauntlet,
  generateAgentIdentity,
  inferSpecialty,
  truncateLogExcerpt,
  type GauntletGateResult,
  type WorkforceAgent,
} from "./agent-workforce";

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

type AgentRow = Record<string, unknown>;

function rowToAgent(row: AgentRow): WorkforceAgent {
  return {
    agentId: String(row.agentId),
    name: String(row.name),
    avatarUrl: String(row.avatarUrl),
    specialty: String(row.specialty),
    systemPrompt: String(row.systemPrompt),
    status: String(row.status),
    hiredReason: row.hiredReason === null || row.hiredReason === undefined ? null : String(row.hiredReason),
    createdAt: new Date(row.createdAt as string | Date).toISOString(),
  };
}

const AGENT_SELECT = `agent_id AS "agentId", name, avatar_url AS "avatarUrl", specialty,
  system_prompt AS "systemPrompt", status, hired_reason AS "hiredReason", created_at AS "createdAt"`;

/** Hire (or return the already-active) specialized agent for a brief. */
export async function hireAgent(tenantId: string, brief: string, reason?: string): Promise<{ created: boolean; agent: WorkforceAgent }> {
  const specialty = inferSpecialty(brief);
  return withTenantClient(tenantId, async (client) => {
    // Serialize concurrent hiring decisions for the same tenant+specialty so a
    // race cannot register duplicate specialists.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${tenantId}:${specialty}`]);

    const existing = await client.query(
      `SELECT ${AGENT_SELECT}
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
       RETURNING ${AGENT_SELECT}`,
      [tenantId, identity.agentId, identity.name, identity.avatarUrl, identity.specialty, identity.systemPrompt, truncateLogExcerpt(reason ?? "") || null],
    );
    return { created: true, agent: rowToAgent(inserted.rows[0]) };
  });
}

export async function listWorkforce(tenantId: string): Promise<WorkforceAgent[]> {
  return withTenantClient(tenantId, async (client) => {
    const result = await client.query(
      `SELECT ${AGENT_SELECT}
       FROM agent_workforce
       WHERE tenant_id = $1
       ORDER BY created_at DESC LIMIT 200`,
      [tenantId],
    );
    return result.rows.map(rowToAgent);
  });
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

type GauntletRow = Record<string, unknown>;

function rowToGauntlet(row: GauntletRow): GauntletRecord {
  return {
    id: Number(row.id),
    agentId: String(row.agentId),
    patchRef: String(row.patchRef),
    status: row.status as GauntletRecord["status"],
    failingGate: row.failingGate === null || row.failingGate === undefined ? null : String(row.failingGate),
    logExcerpt: row.logExcerpt === null || row.logExcerpt === undefined ? null : String(row.logExcerpt),
    createdAt: new Date(row.createdAt as string | Date).toISOString(),
  };
}

/** Record a gauntlet run. PASSED is derived only from recorded exit codes. */
export async function recordGauntletRun(
  tenantId: string,
  agentId: string,
  patchRef: string,
  gates: GauntletGateResult[],
): Promise<GauntletRecord> {
  const evaluation = evaluateGauntlet(gates);
  const storedGates = gates.map((gate) => ({ ...gate, logExcerpt: truncateLogExcerpt(gate.logExcerpt ?? "") }));
  return withTenantClient(tenantId, async (client) => {
    const result = await client.query(
      `INSERT INTO agent_patch_gauntlets (tenant_id, agent_id, patch_ref, gates, status, failing_gate, log_excerpt)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)
       RETURNING id, agent_id AS "agentId", patch_ref AS "patchRef", status,
                 failing_gate AS "failingGate", log_excerpt AS "logExcerpt", created_at AS "createdAt"`,
      [tenantId, agentId, patchRef, JSON.stringify(storedGates), evaluation.status, evaluation.failingGate, evaluation.logExcerpt],
    );
    return rowToGauntlet(result.rows[0]);
  });
}

export async function listGauntletRuns(tenantId: string, agentId?: string): Promise<GauntletRecord[]> {
  return withTenantClient(tenantId, async (client) => {
    const result = agentId
      ? await client.query(
          `SELECT id, agent_id AS "agentId", patch_ref AS "patchRef", status,
                  failing_gate AS "failingGate", log_excerpt AS "logExcerpt", created_at AS "createdAt"
           FROM agent_patch_gauntlets
           WHERE tenant_id = $1 AND agent_id = $2
           ORDER BY created_at DESC LIMIT 100`,
          [tenantId, agentId],
        )
      : await client.query(
          `SELECT id, agent_id AS "agentId", patch_ref AS "patchRef", status,
                  failing_gate AS "failingGate", log_excerpt AS "logExcerpt", created_at AS "createdAt"
           FROM agent_patch_gauntlets
           WHERE tenant_id = $1
           ORDER BY created_at DESC LIMIT 100`,
          [tenantId],
        );
    return result.rows.map(rowToGauntlet);
  });
}
