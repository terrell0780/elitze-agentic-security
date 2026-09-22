import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { applyRemediationEvent, type RemediationEvent, type RemediationRecord, type RemediationTransition } from "@/lib/elitze-secure/remediation-state-machine";

export interface RemediationStore {
  create(record: RemediationRecord, context?: Record<string, unknown>): Promise<void>;
  transition(record: RemediationRecord, event: RemediationEvent, context?: Record<string, unknown>): Promise<{ record: RemediationRecord; transition: RemediationTransition }>;
}

export class PostgresRemediationStore implements RemediationStore {
  async create(record: RemediationRecord, context: Record<string, unknown> = {}): Promise<void> {
    if (!record.remediationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) throw new Error("remediation_id_must_be_uuid_for_persistence");
    await getDb().execute(sql`INSERT INTO remediation_workflows (id, tenant_id, finding_id, asset_id, current_state, state_version, context, created_at, updated_at) VALUES (${record.remediationId}::uuid, ${record.tenantId}, ${record.findingId}, ${record.assetId ?? null}, ${record.state}, ${record.version}, ${JSON.stringify(context)}::jsonb, ${record.createdAt}::timestamptz, ${record.updatedAt}::timestamptz)`);
  }

  async transition(record: RemediationRecord, event: RemediationEvent, context: Record<string, unknown> = {}) {
    return getDb().transaction(async (tx) => {
      const currentResult = await tx.execute(sql`SELECT current_state, state_version FROM remediation_workflows WHERE id = ${record.remediationId}::uuid AND tenant_id = ${record.tenantId} FOR UPDATE`);
      const current = (currentResult as unknown as { rows: Array<{ current_state: string; state_version: number | string }> }).rows[0];
      if (!current) throw new Error("remediation_not_found");
      if (current.current_state !== record.state || Number(current.state_version) !== record.version) throw new Error("remediation_state_conflict");
      const result = applyRemediationEvent(record, event);
      const sequenceResult = await tx.execute(sql`SELECT COALESCE(MAX(sequence), 0) + 1 AS next_sequence FROM remediation_transitions WHERE remediation_id = ${record.remediationId}::uuid`);
      const nextSequence = Number((sequenceResult as unknown as { rows: Array<{ next_sequence: string | number }> }).rows[0]?.next_sequence ?? 1);
      await tx.execute(sql`INSERT INTO remediation_transitions (remediation_id, tenant_id, sequence, previous_state, state, event, allowed, reason, evidence, context) VALUES (${record.remediationId}::uuid, ${record.tenantId}, ${nextSequence}, ${result.transition.previousState}, ${result.transition.state}, ${event}, ${result.transition.allowed}, ${result.transition.reason}, '[]'::jsonb, ${JSON.stringify(context)}::jsonb)`);
      if (result.transition.allowed) await tx.execute(sql`UPDATE remediation_workflows SET current_state = ${result.record.state}, state_version = ${result.record.version}, context = ${JSON.stringify(context)}::jsonb, updated_at = ${result.record.updatedAt}::timestamptz WHERE id = ${record.remediationId}::uuid AND tenant_id = ${record.tenantId}`);
      return result;
    });
  }
}