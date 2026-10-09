import assert from "node:assert/strict";
import { agentPassports, securityTruthStates } from "../src/lib/agent-passports.ts";

const expectedIds = [
  "LINDY-01", "HERMES-07", "AEGIS-CODE", "CERT-TRUST", "FRAZIER-CRM", "VEGA-HUNTER",
  "PHANTOM-RE", "ORACLE-SOC", "NOVA-PATCH", "ATLAS-SCAN", "NEXUS-LOG", "SIGMA-RED",
  "ECHO-FORENS", "TITAN-IDENT", "LINDY-MEM", "KIRA-VULN", "BLAZE-RESP", "PORTO-COMPLY",
  "HELIX-FUZZ", "RAVEN-INTEL", "GROVE-BUILD", "PATEL-EMAIL", "STORM-DATA", "APEX-REPORT",
].sort();

assert.equal(agentPassports.length, 24, "agent catalog must contain 24 entries");
assert.deepEqual(agentPassports.map((agent) => agent.id).sort(), expectedIds, "roster must match source catalog");
assert.equal(new Set(agentPassports.map((agent) => agent.id)).size, 24, "agent IDs must be unique");
assert.ok(agentPassports.every((agent) => agent.catalogTruthState === "DECLARED"));
assert.ok(agentPassports.every((agent) => agent.runtimeTruthState === "UNKNOWN"));
assert.ok(agentPassports.every((agent) => agent.executionWindow.startsWith("UNKNOWN")));
assert.ok(agentPassports.every((agent) => agent.documentedCapabilities.length > 0));
assert.ok(agentPassports.every((agent) => agent.authorizationBoundary.length > 0));
assert.deepEqual(
  [...new Set(agentPassports.map((agent) => agent.division))].sort(),
  ["DEFENSIVE", "OFFENSIVE", "OPERATIONS"],
);
assert.deepEqual(
  securityTruthStates.map((item) => item.state).sort(),
  ["DECLARED", "INFERRED", "OBSERVED", "UNKNOWN", "UNMEASURABLE"],
);
console.log("ELITZE agent passport self-test: PASS (24 source-derived roles; runtime remains UNKNOWN)");
