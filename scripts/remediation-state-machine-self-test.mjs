import assert from "node:assert/strict";
import { REMEDIATION_EVENTS, REMEDIATION_STATES, applyRemediationEvent, canonicalTransitionTargets, createRemediationRecord, isRemediationEvent, isRemediationState, transitionRemediation } from "../src/lib/elitze-secure/remediation-state-machine.ts";

assert.equal(REMEDIATION_STATES.length, 24);
assert.equal(new Set(REMEDIATION_STATES).size, REMEDIATION_STATES.length);
for (const state of REMEDIATION_STATES) assert.equal(isRemediationState(state), true);
for (const event of REMEDIATION_EVENTS) assert.equal(isRemediationEvent(event), true);
for (const [from, nextStates] of Object.entries(canonicalTransitionTargets())) { assert.equal(isRemediationState(from), true); for (const nextState of nextStates) assert.equal(isRemediationState(nextState), true); }
assert.equal(transitionRemediation("DETECTED", "FINDING_IDENTIFIED").state, "IDENTIFIED");
assert.equal(transitionRemediation("SAFETY_CHECKED", "SAFETY_FAILED").state, "BLOCKED");
assert.equal(transitionRemediation("SAFETY_CHECKED", "SAFETY_UNCERTAIN").state, "HOLD");
assert.equal(transitionRemediation("CANARY_DEPLOY", "CANARY_OPERATIONAL_FAILED").state, "ROLLBACK");
assert.equal(transitionRemediation("EXPLOIT_REGRESSION", "EXPLOIT_STILL_SUCCEEDS").state, "CONTAINED");
assert.equal(transitionRemediation("FUNCTIONAL_VERIFY", "FUNCTIONAL_VERIFICATION_FAILED").state, "ROLLBACK");
assert.equal(transitionRemediation("SECURITY_VERIFY", "SECURITY_VERIFICATION_PASSED").state, "VERIFIED_FIX");
assert.equal(transitionRemediation("VERIFIED_FIX", "THREAT_REOPENED").state, "REOPENED");
const blocked = transitionRemediation("VERIFIED_FIX", "APPROVAL_GRANTED");
assert.equal(blocked.allowed, false);
assert.equal(blocked.state, "VERIFIED_FIX");
let record = createRemediationRecord({ remediationId: "test-remediation-001", tenantId: "test-tenant", findingId: "test-finding" });
const sequence = ["FINDING_IDENTIFIED","ASSET_RESOLVED","GRAPH_CORRELATED","TRIAGE_COMPLETE","REACHABILITY_CONFIRMED","EXPLOITABILITY_VALIDATED","BLAST_ANALYSIS_COMPLETE","REMEDIATION_PROPOSED","SAFETY_PASSED","APPROVAL_GRANTED","PREPARATION_COMPLETE","PREVALIDATION_PASSED","CANARY_PASSED","EXPLOIT_BLOCKED","FUNCTIONAL_VERIFICATION_PASSED","SECURITY_VERIFICATION_PASSED","RELEASED"];
for (const event of sequence) { const result = applyRemediationEvent(record, event); assert.equal(result.transition.allowed, true, event); record = result.record; }
assert.equal(record.state, "MONITORING");
assert.equal(applyRemediationEvent(record, "RUNTIME_ATTACK_OBSERVED").record.state, "REOPENED");
console.log("ELITZE canonical remediation state-machine self-test: PASS");