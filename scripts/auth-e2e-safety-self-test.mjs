import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("scripts/auth-e2e-self-test.mjs", "utf8");
const workflow = fs.readFileSync(".github/workflows/production-gates.yml", "utf8");

assert.doesNotMatch(source, /process\.loadEnvFile|neonctl connection-string/, "auth E2E must not load local env files or auto-discover a hosted Neon branch");
assert.match(source, /Explicit PostgreSQL environment variables are required for auth E2E/);
assert.match(source, /\["127\.0\.0\.1", "localhost", "::1"\]\.includes\(normalizedPgHost\)/, "auth E2E must allow loopback PostgreSQL hosts only");
assert.match(source, /Refusing authentication E2E against a remote database/);
assert.match(source, /const databaseUrl = new URL\(/, "database URL must be built from the explicitly supplied local PG settings");
assert.match(source, /const fixtureEmails = \[testEmail, secondEmail\]/);
assert.match(source, /DELETE FROM public\.mcp_gateway_decisions WHERE tenant_id = ANY\(\$1::uuid\[\]\)/);
assert.match(source, /DELETE FROM public\.auth_tenants WHERE id = ANY\(\$1::uuid\[\]\)/);
assert.match(source, /await db\.query\("BEGIN"\)/);
assert.match(source, /await db\.query\("COMMIT"\)/);
assert.match(source, /await db\.query\("ROLLBACK"\)/);
assert.ok(source.indexOf("Refusing authentication E2E against a remote database") < source.indexOf("mailServer.listen"), "database guard must run before test services start");
assert.match(workflow, /npm run auth:e2e-safety-self-test/, "release workflow must execute this safety contract before auth DB E2E");
assert.match(workflow, /name: Real authentication DB E2E[\s\S]*?run: npm run auth:e2e-self-test/, "release workflow must retain real isolated-database E2E");

console.log("ELITZE authentication E2E safety self-test: PASS — loopback-only DB, no implicit environment/Neon discovery, bounded fixture cleanup, and CI gate coverage");
