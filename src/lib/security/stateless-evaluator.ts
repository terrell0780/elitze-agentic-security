/**
 * Shared contract for ELITZE's stateless evaluator endpoints.
 *
 * These endpoints compute a result from caller-supplied input only. They do not
 * read or write tenant records and their output is NOT an authorization
 * decision. The authoritative, audited path is /api/security/decision, which is
 * authenticated with the internal control-plane key, tenant-bound, and written
 * to the tamper-evident audit ledger.
 *
 * Responses therefore carry an explicit non-authoritative marker so a caller
 * cannot mistake an evaluator result for a persisted security decision.
 */
export const STATELESS_EVALUATOR = {
  evaluator: "STATELESS_EVALUATOR",
  authoritative: false,
  note: "Computed from request input only. Not an authorization decision and not persisted evidence. Use the authenticated control-plane endpoints for authoritative decisions.",
} as const;

/** Reject non-object bodies (null, arrays, primitives) before evaluation. */
export function readEvaluatorBody(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
