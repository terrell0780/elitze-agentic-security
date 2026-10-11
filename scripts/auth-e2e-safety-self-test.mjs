import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("scripts/auth-e2e-self-test.mjs", "utf8");
const workflow = fs.readFileSync(".github/workflows/production-gates.yml", "utf8");

assert.doesNotMatch(source, /process\.loadEnvFile|neonctl connection-string/, "auth E2E must not load local env files or auto-discover a hosted Neon branch");
assert.match(source, /Explicit PostgreSQL environment variables are required for auth E2E/);
assert.match(source, /\["127\.0\.0\.1", "localhost", "::1"\]\.includes\(normalizedPgHost\)/, "auth E2E must allow loopback PostgreSQL hosts only");
assert.match(source, /Refusing authentication E2E against a remote database/);
assert.match(source, /ELITZE_AUTH_E2E_DISPOSABLE_DB !== "true"/, "auth E2E must require an explicit disposable-db opt-in");
assert.match(source, /PGDATABASE\)\)/, "auth E2E must restrict writes to databases explicitly named for test/CI/E2E");
assert.match(source, /const databaseUrl = new URL\(/, "database URL must be built from the explicitly supplied local PG settings");
assert.match(source, /deny_mcp_gateway_decision_mutation\(\)/, "append-only security decision evidence must not be deleted");
assert.match(source, /ELITZE auth E2E fixture accounting: PASS/, "run must report bounded fixture accounting");
assert.doesNotMatch(source, /DELETE FROM public\.mcp_gateway_decisions|DELETE FROM public\.auth_tenants/, "auth E2E must not attempt to delete append-only evidence or tenant trees");
assert.ok(source.indexOf("Refusing authentication E2E against a remote database") < source.indexOf("mailServer.listen"), "database guard must run before test services start");
assert.ok(source.indexOf("ELITZE_AUTH_E2E_DISPOSABLE_DB !== \"true\"") < source.indexOf("mailServer.listen"), "disposable-db guard must run before test services start");
assert.match(workflow, /ELITZE_AUTH_E2E_DISPOSABLE_DB: "true"/, "CI must explicitly label the E2E database as disposable");
assert.match(workflow, /npm run auth:e2e-safety-self-test/, "release workflow must execute this safety contract before auth DB E2E");
assert.match(workflow, /name: Real authentication DB E2E[\s\S]*?run: npm run auth:e2e-self-test/, "release workflow must retain real isolated-database E2E");

console.log("ELITZE authentication E2E safety self-test: PASS — loopback-only disposable DB, no implicit environment/Neon discovery, append-only evidence preservation, and CI gate coverage");
