import assert from "node:assert/strict";
import { evaluateEvidenceExpression } from "../src/lib/elitze-secure/evidence-expression.mjs";

const record = {
  decisionRef: "dec_1",
  requestId: "req_1",
  subject: "github:deploy",
  decision: "ALLOW",
  evidenceState: "OBSERVED",
  stage: "PROVEN",
  nextAction: "No further proof step is required",
  observedAt: "2026-09-21T12:00:00.000Z",
};

assert.equal(evaluateEvidenceExpression('decision == "ALLOW"', record), true);
assert.equal(evaluateEvidenceExpression('stage == "PROVEN" && evidenceState == "OBSERVED"', record), true);
assert.equal(evaluateEvidenceExpression('subject contains "github"', record), true);
assert.equal(evaluateEvidenceExpression('subject startsWith "aws"', record), false);
assert.equal(evaluateEvidenceExpression('!(decision == "DENY")', record), true);
assert.equal(evaluateEvidenceExpression('stage == "PROVEN" || decision == "DENY"', record), true);
assert.throws(() => evaluateEvidenceExpression('secret == "x"', record), /unknown_field/);
assert.throws(() => evaluateEvidenceExpression('decision == "ALLOW" &&', record), /expression_incomplete|field_required/);
console.log("ELITZE evidence expression self-test: PASS");
