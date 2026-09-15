import crypto from "node:crypto";

export type EvidenceState = "OBSERVED" | "INFERRED" | "SIMULATED" | "UNKNOWN" | "UNMEASURABLE";

function stable(value: unknown): string {
  return JSON.stringify(value, (_, current) => {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      return Object.fromEntries(Object.entries(current as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
    }
    return current;
  });
}

export function hashEvidence(event: Record<string, unknown>, previousRecordHash: string | null): string {
  return crypto.createHash("sha256").update(stable({ ...event, previousRecordHash })).digest("hex");
}

export function signEvidenceHash(recordHash: string, secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET): string {
  if (!secret) throw new Error("ELITZE_EVIDENCE_SIGNING_SECRET is required");
  return crypto.createHmac("sha256", secret).update(recordHash).digest("base64url");
}

export function verifyEvidenceReceipt(input: { event: Record<string, unknown>; previousRecordHash: string | null; recordHash: string; signature: string }, secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET): boolean {
  if (!secret) return false;
  const expectedHash = hashEvidence(input.event, input.previousRecordHash);
  const expectedSignature = crypto.createHmac("sha256", secret).update(expectedHash).digest("base64url");
  return expectedHash === input.recordHash && expectedSignature === input.signature;
}

export function normalizeEvidenceState(value: unknown): EvidenceState {
  if (value === "OBSERVED" || value === "INFERRED" || value === "SIMULATED" || value === "UNKNOWN" || value === "UNMEASURABLE") return value;
  throw new Error("invalid_evidence_state");
}
