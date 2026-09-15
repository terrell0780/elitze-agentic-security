import fs from "node:fs";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("drizzle/0016_phase5_real_observations.sql");
const evidenceMigration = read("drizzle/0017_mcp_evidence_integrity.sql");
const mcpObservation = read("src/lib/elitze-secure/mcp-observation.ts");
const mcpGateway = read("src/app/api/mcp-gateway/route.ts");
const github = read("src/lib/elitze-secure/github-integration.ts");
const aws = read("src/lib/elitze-secure/aws-integration.ts");
const graphRoute = read("src/app/api/console/security-graph/route.ts");
const githubRoute = read("src/app/api/integrations/github/observe/route.ts");
const awsRoute = read("src/app/api/integrations/aws/observe/route.ts");
const docs = read("docs/ELITZE-PHASE-5-6-REAL-INTEGRATIONS.md");

for (const table of ["mcp_tool_inventory"]) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
for (const marker of ["decision_ref", "evidence_event", "evidence_state", "freshness_at", "deny_mcp_gateway_decision_mutation"]) assert.match(evidenceMigration, new RegExp(marker));
for (const marker of ["description_hash", "previous_description_hash", "descriptionChanged", "OBSERVED"]) assert.match(mcpObservation, new RegExp(marker));
for (const marker of ["tools/list", "tools/call", "persistObservedTool", "evaluatePolicies", "signGatewayEvidence"]) assert.match(mcpGateway, new RegExp(marker));
for (const marker of ["/repos/", "actions/workflows", "branches?protected=true", "actions/secrets", "/installation", "/audit-log"]) assert.match(github, new RegExp(marker.replace(/[?]/g, "\\?")));
for (const marker of ["GetCallerIdentity", "ListRoles", "ListPolicies", "LookupEvents", "AWSCloudTrail_20131119.LookupEvents"]) assert.match(aws, new RegExp(marker.replace(/[.]/g, "\\.")));
for (const route of [graphRoute, githubRoute, awsRoute]) assert.match(route, /getCurrentUser|authorizeInternalRequest/);
for (const forbidden of ["Math.random", "fake", "synthetic", "seed"]) {
  assert.doesNotMatch(mcpObservation.toLowerCase(), new RegExp(`\\b${forbidden}\\b`));
}

// Validate the production boundary semantically rather than requiring a brittle exact phrase.
assert.match(docs, /provider credentials/i);
assert.match(docs, /real provider account\/repository/i);
assert.match(docs, /no synthetic/i);
console.log("ELITZE Phase 5/6 self-test: PASS");
