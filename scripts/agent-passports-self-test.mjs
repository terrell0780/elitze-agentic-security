import assert from "node:assert/strict";
import { agentPassports, securityTruthStates } from "../src/lib/agent-passports.ts";

assert.deepEqual(agentPassports.map((agent) => agent.id).sort(), ["ELITZE", "SARA"]);
assert.equal(new Set(agentPassports.map((agent) => agent.id)).size, 2);
assert.ok(agentPassports.every((agent) => agent.catalogTruthState === "DECLARED"));
assert.ok(agentPassports.every((agent) => agent.runtimeTruthState === "UNKNOWN"));
assert.ok(agentPassports.every((agent) => agent.executionWindow.startsWith("Not verified")));
assert.ok(agentPassports.every((agent) => agent.documentedCapabilities.length > 0));
assert.ok(agentPassports.every((agent) => agent.authorizationBoundary.length > 0));
assert.deepEqual([...new Set(agentPassports.map((agent) => agent.division))].sort(), ["DEFENSIVE", "OPERATIONS"]);
assert.deepEqual(securityTruthStates.map((item) => item.state).sort(), ["DECLARED", "INFERRED", "OBSERVED", "UNKNOWN", "UNMEASURABLE"]);
console.log("ELITZE agent identity self-test: PASS (ELITZE and Sara; runtime truth preserved)");