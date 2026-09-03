import { createHash } from "node:crypto";

export type ReoAuditEvent = {
  tenantId: string;
  contentId: string;
  decision: string;
  eventType: string;
  actorId: string | null;
  policyVersion: string | null;
  payload: Record<string, unknown>;
  previousEventHash: string | null;
};

export function hashAuditEvent(event: ReoAuditEvent): string {
  const canonical = JSON.stringify({
    tenantId: event.tenantId,
    contentId: event.contentId,
    decision: event.decision,
    eventType: event.eventType,
    actorId: event.actorId,
    policyVersion: event.policyVersion,
    payload: event.payload,
    previousEventHash: event.previousEventHash,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function verifyAuditLink(event: ReoAuditEvent, eventHash: string): boolean {
  return /^[a-f0-9]{64}$/.test(eventHash) && hashAuditEvent(event) === eventHash;
}
