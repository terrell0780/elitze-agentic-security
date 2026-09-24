import fs from "node:fs";
const route = fs.readFileSync("src/app/api/console/overview/route.ts", "utf8");
for (const marker of ["getCurrentUser","tenantId","agent_identities","mcp_gateway_servers","security_policies","security_approvals","mcp_gateway_decisions","security_graph_nodes","security_test_requests","evidence_records","tenant-scoped PostgreSQL records"]) {
  if (!route.includes(marker)) throw new Error(`tenant_overview_contract_missing:${marker}`);
}
for (const forbidden of ["Math.random","seed","synthetic","mock","fake"]) {
  if (new RegExp(`\\b${forbidden}\\b`,"i").test(route)) throw new Error(`tenant_overview_forbidden:${forbidden}`);
}
console.log("ELITZE tenant overview self-test: PASS");