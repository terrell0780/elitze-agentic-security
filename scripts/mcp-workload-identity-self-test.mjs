import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "drizzle/0015_real_identity_model.sql",
  "drizzle/0027_mcp_control_plane_lockdown.sql",
  "src/lib/elitze-secure/workload-identity.ts",
  "src/lib/elitze-secure/mcp-gateway.ts",
  "src/app/api/mcp-gateway/workload-token/route.ts",
  "src/app/api/mcp-gateway/route.ts",
  ".env.example",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`missing:${file}`);
}

const migration = fs.readFileSync(path.join(root, "drizzle/0027_mcp_control_plane_lockdown.sql"), "utf8");
for (const marker of [
  "gateway_server_id",
  "mcp_gateway_request_nonces",
  "mcp_gateway_rate_limits",
  "tool_name",
  "consumed_at",
  "UNIQUE (tenant_id, workload_session_id, request_id)",
]) {
  if (!migration.includes(marker)) throw new Error(`mcp_lockdown_schema_missing:${marker}`);
}

const tokenService = fs.readFileSync(path.join(root, "src/lib/elitze-secure/workload-identity.ts"), "utf8");
for (const marker of [
  "issueWorkloadToken",
  "verifyWorkloadToken",
  "ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET",
  "gatewayServerId",
  "jti",
  "timingSafeEqual",
  "claims.sub !== claims.workloadSessionId",
]) {
  if (!tokenService.includes(marker)) throw new Error(`workload_token_control_missing:${marker}`);
}

const gatewayLibrary = fs.readFileSync(path.join(root, "src/lib/elitze-secure/mcp-gateway.ts"), "utf8");
for (const marker of [
  "parseCapabilitySet",
  "capabilityAllows",
  "moreRestrictiveDecision",
  "validateMcpUpstreamUrl",
  "mcp_upstream_https_required",
  "mcp_upstream_private_address_blocked",
]) {
  if (!gatewayLibrary.includes(marker)) throw new Error(`gateway_library_control_missing:${marker}`);
}

const gateway = fs.readFileSync(path.join(root, "src/app/api/mcp-gateway/route.ts"), "utf8");
for (const marker of [
  "verifyWorkloadToken",
  "gateway_server_id",
  "mcp_gateway_request_nonces",
  "MCP_REQUEST_REPLAY_DETECTED",
  "consumeMcpRateLimit",
  "ELITZE_MCP_GATEWAY_ENABLED",
  "ELITZE_MCP_GATEWAY_EXECUTION_ENABLED",
  "MCP_TOOL_EXECUTION_DISABLED",
  "failClosed: true",
  "APPROVAL_REQUIRED",
  "createApproval",
  "approvalIsValid",
  "pg_advisory_xact_lock",
  "redirect: \"error\"",
  "consumed_at",
]) {
  if (!gateway.includes(marker)) throw new Error(`gateway_enforcement_missing:${marker}`);
}

if (!/method === "tools\/call" && process\.env\.ELITZE_MCP_GATEWAY_EXECUTION_ENABLED !== "true"/.test(gateway)) {
  throw new Error("mcp_tool_execution_must_be_explicitly_enabled");
}
if (!/policyMatch\s*\?\s*mapDecision\(policyMatch\.decision\)\s*:\s*"DENY"/.test(gateway)) {
  throw new Error("mcp_unmatched_policy_must_deny_by_default");
}

if (/capability === ["']\*["']/.test(gateway) || /capability\.includes\(tool/.test(gateway)) {
  throw new Error("wildcard_or_substring_capability_match_remains");
}

const tokenRoute = fs.readFileSync(path.join(root, "src/app/api/mcp-gateway/workload-token/route.ts"), "utf8");
for (const marker of [
  "gatewayServerId",
  "kind = 'AGENT'",
  "mcp_server_identity_mismatch",
  "explicit_tool_capabilities_required",
  "tool_outside_requested_capability",
  "gateway_server_id",
  "tool_name",
  "credentialsInAgentContext",
]) {
  if (!tokenRoute.includes(marker)) throw new Error(`workload_issuance_control_missing:${marker}`);
}

const env = fs.readFileSync(path.join(root, ".env.example"), "utf8");
for (const marker of [
  "ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET",
  "ELITZE_WORKLOAD_TOKEN_TTL_SECONDS",
  "ELITZE_MCP_GATEWAY_ENABLED",
  "ELITZE_MCP_GATEWAY_EXECUTION_ENABLED",
  "ELITZE_MCP_UPSTREAM_HOST_ALLOWLIST",
  "ELITZE_MCP_CREDENTIAL_ENV_ALLOWLIST",
]) {
  if (!env.includes(marker)) throw new Error(`env_missing:${marker}`);
}

console.log("MCP workload identity/control-plane lockdown self-test: PASS");
