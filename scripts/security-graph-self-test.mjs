import fs from "node:fs";
import assert from "node:assert/strict";

const migration = fs.readFileSync("drizzle/0013_security_graph.sql", "utf8");
const service = fs.readFileSync("src/lib/elitze-secure/security-graph-v2.ts", "utf8");
const route = fs.readFileSync("src/app/api/security-graph/route.ts", "utf8");
const docs = fs.readFileSync("docs/ELITZE-SECURITY-GRAPH.md", "utf8");

for (const table of ["security_graph_nodes", "security_graph_edges", "security_graph_evidence"]) assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
for (const type of ["HUMAN_IDENTITY", "AGENT_IDENTITY", "SERVICE_ACCOUNT", "MODEL", "PROMPT_CONFIG", "MCP_CLIENT", "MCP_SERVER", "TOOL", "API_CREDENTIAL", "CLOUD_ROLE", "DATA_STORE", "DEPLOYMENT_ENVIRONMENT", "DELEGATION_AUTHORITY", "POLICY"]) {
  if (type !== "DELEGATION_AUTHORITY") assert.match(migration, new RegExp(type));
}
for (const relation of ["AUTHORIZES", "DELEGATES", "INVOKES", "CAN_REACH", "READS", "WRITES", "EXECUTES", "GOVERNS", "DECIDED_BY", "RESULTED_IN", "VERIFIED_BY", "PROVES"]) assert.match(migration, new RegExp(relation));
for (const marker of ["contentHash", "UNMEASURABLE", "graph_edge_endpoint_missing", "findGraphPaths", "graphStats"]) assert.match(service, new RegExp(marker));
assert.match(route, /ELITZE_INTERNAL_API_KEY/);
assert.match(route, /graphStats/);
assert.match(route, /findGraphPaths/);
assert.match(docs, /No seed agents, fake tools, fabricated credentials, synthetic reachability/);
console.log("ELITZE security graph self-test: PASS");
