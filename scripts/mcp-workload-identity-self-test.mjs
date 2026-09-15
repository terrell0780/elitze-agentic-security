import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "drizzle/0015_real_identity_model.sql",
  "src/lib/elitze-secure/workload-identity.ts",
  "src/app/api/mcp-gateway/workload-token/route.ts",
  "src/app/api/mcp-gateway/route.ts",
  ".env.example",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`missing:${file}`);
}

const migration = fs.readFileSync(path.join(root, "drizzle/0015_real_identity_model.sql"), "utf8");
for (const marker of ["workload_sessions", "workload_delegations", "human_owner_id", "requested_capability", "approval_authority_id", "credential_ref", "expires_at", "mcp_gateway_decisions"]) {
  if (!migration.includes(marker)) throw new Error(`identity_schema_missing:${marker}`);
}

const tokenService = fs.readFileSync(path.join(root, "src/lib/elitze-secure/workload-identity.ts"), "utf8");
for (const marker of ["issueWorkloadToken", "verifyWorkloadToken", "ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET", "exp", "HMAC", "timingSafeEqual"]) {
  if (!tokenService.includes(marker)) throw new Error(`workload_token_control_missing:${marker}`);
}

const gateway = fs.readFileSync(path.join(root, "src/app/api/mcp-gateway/route.ts"), "utf8");
for (const marker of ["Authorization", "Bearer ", "verifyWorkloadToken", "workload_sessions", "human_owner_id", "delegation_source", "requested_capability", "approval_authority_id", "failClosed"]) {
  if (!gateway.includes(marker)) throw new Error(`gateway_identity_enforcement_missing:${marker}`);
}

const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
for (const marker of ["ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET", "ELITZE_WORKLOAD_TOKEN_TTL_SECONDS"]) {
  if (!env.includes(marker)) throw new Error(`env_missing:${marker}`);
}

console.log("MCP workload identity self-test: PASS");
