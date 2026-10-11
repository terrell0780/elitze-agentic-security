import assert from "node:assert/strict";
import fs from "node:fs";
import { isDisposableAuthE2EEnvironment, isReservedNonDeliverableEmail } from "../src/lib/elitze-secure/auth-email-policy.ts";

const source = fs.readFileSync("scripts/auth-e2e-self-test.mjs", "utf8");
const workflow = fs.readFileSync(".github/workflows/production-gates.yml", "utf8");
const authSource = fs.readFileSync("src/lib/auth.ts", "utf8");
const passkeySource = fs.readFileSync("src/app/api/auth/passkeys/auth/options/route.ts", "utf8");
const oidcSource = fs.readFileSync("src/app/api/auth/oidc/callback/route.ts", "utf8");

const hostedEnvironment = {
  NODE_ENV: "production",
  PGHOST: "ep-example.us-east-1.aws.neon.tech",
  PGDATABASE: "neondb",
};
const disposableCiEnvironment = {
  NODE_ENV: "production",
  PGHOST: "127.0.0.1",
  PGDATABASE: "elitze_ci",
  ELITZE_AUTH_E2E_DISPOSABLE_DB: "true",
};
assert.equal(isDisposableAuthE2EEnvironment(hostedEnvironment), false);
assert.equal(isDisposableAuthE2EEnvironment(disposableCiEnvironment), true);
assert.equal(isReservedNonDeliverableEmail("e2e-auth-example@example.invalid", hostedEnvironment), true,
  "hosted authentication must reject seeded reserved .invalid accounts");
assert.equal(isReservedNonDeliverableEmail("e2e-auth-example@example.invalid", disposableCiEnvironment), false,
  "the isolated disposable CI E2E must permit its synthetic .invalid addresses");
assert.equal(isReservedNonDeliverableEmail("buyer@example.com", hostedEnvironment), false);
assert.equal(isReservedNonDeliverableEmail("e2e-auth-example@example.invalid", {
  ...disposableCiEnvironment, PGHOST: "db.example.net",
}), true, "a remote DB must not unlock reserved test identities");
assert.equal(isReservedNonDeliverableEmail("e2e-auth-example@example.invalid", {
  ...disposableCiEnvironment, PGDATABASE: "production",
}), true, "a persistent database name must not unlock reserved test identities");
assert.match(authSource, /isReservedNonDeliverableEmail\(row\.email\)/, "existing sessions for reserved test identities must be rejected and revoked");
assert.match(authSource, /isReservedNonDeliverableEmail\(normalized\)/, "registration and password authentication must use the reserved-address policy");
assert.match(authSource, /isReservedNonDeliverableEmail\(email\)/, "password recovery must not issue tokens to reserved addresses");
assert.match(passkeySource, /isReservedNonDeliverableEmail\(email\)/, "passkey auth must reject reserved test identities");
assert.match(oidcSource, /isReservedNonDeliverableEmail\(email\)/, "OIDC auth must reject reserved test identities");

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
