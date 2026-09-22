import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";
import { applyRemediationEvent, createRemediationRecord, type RemediationEvent, type RemediationRecord } from "@/lib/elitze-secure/remediation-state-machine";
import { JevDecisionPlane } from "@/lib/elitze-secure/typesafe-jev";
import { PostgresRemediationStore, type RemediationStore } from "@/lib/elitze-secure/remediation-store";

export interface RemediationAuditWriter { append<T>(tenantId: string, type: string, payload: T): Promise<{ id: string }>; }
export interface RemediationEngineOptions { audit?: RemediationAuditWriter; jev?: JevDecisionPlane; store?: RemediationStore; }
export interface RemediationTransitionResult { record: RemediationRecord; transition: ReturnType<typeof applyRemediationEvent>["transition"]; }

export class RemediationEngine {
  private readonly audit: RemediationAuditWriter;
  private readonly jev: JevDecisionPlane;
  private readonly store: RemediationStore;
  constructor(options: RemediationEngineOptions = {}) { this.audit = options.audit ?? new AuditLedger(); this.jev = options.jev ?? new JevDecisionPlane(); this.store = options.store ?? new PostgresRemediationStore(); }
  async start(input: { remediationId?: string; tenantId: string; findingId: string; assetId?: string; now?: string }): Promise<RemediationRecord> {
    const record = createRemediationRecord(input);
    await this.audit.append(record.tenantId, "remediation.created", record);
    return record;
  }
  async transition(record: RemediationRecord, event: RemediationEvent, context: Record<string, unknown> = {}): Promise<RemediationTransitionResult> {
    const result = applyRemediationEvent(record, event);
    await this.audit.append(record.tenantId, "remediation.transition", { remediationId: record.remediationId, findingId: record.findingId, assetId: record.assetId, previousState: result.transition.previousState, state: result.transition.state, event, allowed: result.transition.allowed, reason: result.transition.reason, context });
    return result;
  }
  async remediationApprovalRecommendation(record: RemediationRecord, context: Record<string, unknown>) {
    return this.jev.remediationApproval({ tenantId: record.tenantId, state: { remediationId: record.remediationId, findingId: record.findingId, assetId: record.assetId, remediationState: record.state, ...context } });
  }
}