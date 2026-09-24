import fs from "node:fs";

const route = fs.readFileSync("src/app/api/console/overview/route.ts", "utf8");
for (const marker of [
  "getCurrentUser",
  "tenantId",
  "agent_identities",
  "mcp_gateway_servers",
  "security_policies",
  "security_approvals",
  "mcp_gateway_decisions",
  "security_graph_nodes",
  "security_test_requests",
  "tenant-scoped PostgreSQL records",
]) {
  if (!route.includes(marker)) throw new Error(`tenant_overview_contract_missing:${marker}`);
}
for (const forbidden of [
  /\bMath\.random\s*\(/,
  /\bINITIAL_[A-Z0-9_]+\b/,
  /\bmock(?:Data|Record|Telemetry)\b/i,
  /\bfake(?:Data|Record|Telemetry)\b/i,
  /\/api\/market\b/,
  /evidence_records\s+WHERE\s+tenant_id/i,
]) {
  if (forbidden.test(route)) throw new Error(`tenant_overview_forbidden:${forbidden}`);
}
console.log("ELITZE tenant overview self-test: PASS");