import assert from "node:assert/strict";
import { JevDecisionPlane, sanitizeJevState } from "../src/lib/elitze-secure/typesafe-jev.ts";

assert.deepEqual(sanitizeJevState({ tenant: "t1", password: "do-not-send", nested: { apiKey: "redact-me", normal: "keep-me" } }), { tenant: "t1", password: "[REDACTED]", nested: { apiKey: "[REDACTED]", normal: "keep-me" } });
const plane = new JevDecisionPlane({ apiKey: "" });
assert.equal(plane.availability, "DISABLED");
const result = await plane.remediationApproval({ tenantId: "t1", state: { currentState: "SAFETY_CHECKED", blastRadius: "LOW" } });
assert.equal(result.availability, "DISABLED");
assert.equal(result.errorCode, "typesafe_api_key_missing");
console.log("ELITZE TypeSafe/Jev self-test: PASS");
if (process.env.TYPESAFE_API_KEY) {
  const live = await new JevDecisionPlane({ timeout: 15_000 }).evidenceClassification({ tenantId: "self-test", state: { finding: "controlled self-test", evidence: "direct test output" } });
  assert.equal(live.availability, "ENABLED");
  assert.ok(live.answer);
  console.log("ELITZE TypeSafe/Jev live API self-test: PASS");
}
