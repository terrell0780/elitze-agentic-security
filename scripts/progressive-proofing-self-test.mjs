import assert from "node:assert/strict";

const { evaluateProgressiveProof } = await import("../src/lib/elitze-secure/progressive-proofing.ts");

const base = {
  evidenceState: "OBSERVED",
  sourceRef: "mcp-gateway:self-test",
  observedAt: "2026-09-19T00:00:00.000Z",
  recordHash: "a".repeat(64),
};

assert.equal(evaluateProgressiveProof({ ...base, receiptVerified: false }).stage, "OBSERVED");
assert.equal(evaluateProgressiveProof({ ...base, receiptVerified: true }).stage, "INTEGRITY_VERIFIED");
assert.equal(evaluateProgressiveProof({ ...base, receiptVerified: true, retestStatus: "PASSED" }).stage, "RETESTED");
assert.equal(
  evaluateProgressiveProof({
    ...base,
    receiptVerified: true,
    retestStatus: "PASSED",
    upstreamResultHash: "b".repeat(64),
  }).stage,
  "PROVEN",
);
assert.equal(
  evaluateProgressiveProof({ evidenceState: "UNKNOWN", sourceRef: null, observedAt: null, recordHash: null }).stage,
  "UNMEASURABLE",
);

console.log("ELITZE progressive proofing self-test: PASS");
