import assert from "node:assert/strict";
import { detectThreats } from "../src/lib/elitze-secure/threat-detection.ts";

function event(id, overrides = {}) {
  return {
    id,
    connector_id: "test-source",
    event_type: "auth_login_failure",
    subject_key: "user:subject-1",
    evidence_state: "OBSERVED",
    severity: "MEDIUM",
    observed_at: "2026-10-11T10:00:00.000Z",
    source_ref: "provider-event-" + id,
    payload: { action: "login", outcome: "failed", sourceIp: "192.0.2.15" },
    ...overrides,
  };
}

const nonObserved = detectThreats([
  event("inferred", { evidence_state: "INFERRED", severity: "CRITICAL", event_type: "credential_exposure" }),
  event("unknown", { evidence_state: "UNKNOWN", event_type: "data_exfiltration" }),
  event("missing-connector", { connector_id: "" }),
]);
assert.equal(nonObserved.observedEventCount, 0);
assert.equal(nonObserved.detectionCount, 0);
assert.equal(nonObserved.evidenceState, "UNMEASURABLE");
assert.equal(nonObserved.ignoredNonObservedCount, 3);

const twoFailures = detectThreats([
  event("a", { observed_at: "2026-10-11T10:00:00.000Z" }),
  event("b", { observed_at: "2026-10-11T10:12:00.000Z" }),
]);
assert.equal(twoFailures.detections.some((item) => item.ruleId === "ELITZE-TD-002"), false,
  "authentication cluster must require at least three failures");

const threeFailures = detectThreats([
  event("a", { observed_at: "2026-10-11T10:00:00.000Z" }),
  event("b", { observed_at: "2026-10-11T10:12:00.000Z" }),
  event("c", { observed_at: "2026-10-11T10:29:00.000Z" }),
]);
const cluster = threeFailures.detections.find((item) => item.ruleId === "ELITZE-TD-002");
assert.ok(cluster, "three source-observed failures in thirty minutes must create a cluster");
assert.deepEqual(cluster.eventIds, ["a", "b", "c"]);
assert.ok(cluster.techniqueIds.includes("T1110"));
assert.ok(cluster.sourceRefs.includes("provider-event-a"));

const outOfWindow = detectThreats([
  event("a", { observed_at: "2026-10-11T10:00:00.000Z" }),
  event("b", { observed_at: "2026-10-11T10:12:00.000Z" }),
  event("c", { observed_at: "2026-10-11T10:31:00.001Z" }),
]);
assert.equal(outOfWindow.detections.some((item) => item.ruleId === "ELITZE-TD-002"), false,
  "a cluster with no three events inside one thirty-minute window must not match");

const highImpact = detectThreats([
  event("high", { event_type: "source_alert", severity: "CRITICAL", payload: { alertName: "provider-auth-alert" } }),
]);
assert.equal(highImpact.detectionCount, 1);
assert.equal(highImpact.detections[0].severity, "CRITICAL");
assert.equal(highImpact.detections[0].evidenceState, "OBSERVED");
assert.match(highImpact.detections[0].description, /source marked/i);

const exfiltration = detectThreats([
  event("exfil", { event_type: "data_exfiltration_alert", severity: "HIGH", payload: { indicator: "data_exfiltration" } }),
]);
assert.equal(exfiltration.detections.some((item) => item.ruleId === "ELITZE-TD-003"), true);

const denial = detectThreats([
  event("deny", { event_type: "mcp_tool_execution", payload: { decision: "DENIED", action: "tool invocation denied by policy" } }),
]);
const denialFinding = denial.detections.find((item) => item.ruleId === "ELITZE-TD-004");
assert.ok(denialFinding);
assert.match(denialFinding.description, /not evidence that the action succeeded/i);

console.log("ELITZE threat-detection self-test: PASS — observed-only inputs, minimum auth cluster, rolling time window, severity preservation, explicit exfiltration signal and denial semantics");
