import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSanitizedReadinessDiagnostic, classifyDatabaseFailure } from "../src/lib/production-readiness-diagnostics.ts";

assert.equal(classifyDatabaseFailure("Production database is not configured."), "DATABASE_UNCONFIGURED");
assert.equal(classifyDatabaseFailure("Database connected, but 2 migration(s) are missing."), "MIGRATIONS_MISSING");
assert.equal(classifyDatabaseFailure("Database connected, but migration ledger parity failed: 1 ledger migration ID(s) not present in this repository."), "MIGRATIONS_MISSING");
assert.equal(classifyDatabaseFailure('password authentication failed for user "elitze_runtime"'), "DATABASE_AUTHENTICATION_FAILED");
assert.equal(classifyDatabaseFailure("self-signed certificate in certificate chain"), "DATABASE_TLS_FAILED");
assert.equal(classifyDatabaseFailure("connect ETIMEDOUT"), "DATABASE_TIMEOUT");
assert.equal(classifyDatabaseFailure("getaddrinfo ENOTFOUND db.example.invalid"), "DATABASE_DNS_FAILED");
assert.equal(classifyDatabaseFailure('relation "_elitze_migrations" does not exist'), "MIGRATION_LEDGER_MISSING");

const connectionScheme = ["postgres", "ql", ":", "/", "/"].join("");
const fixtureConnection = `${connectionScheme}user:fixture-value@db.example.invalid/neondb`;
const diagnostic = buildSanitizedReadinessDiagnostic(
  {
    missing: ["DATABASE_URL", "RESEND_API_KEY"],
    malformed: ["ELITZE_AUTH_ENCRYPTION_KEY_ACTIVE"],
    databaseConfigured: false,
  },
  {
    success: false,
    message: `password authentication failed for user "elitze_runtime" using ${fixtureConnection}`,
    configurationSource: "DATABASE_URL",
    expectedMigrations: 33,
    appliedMigrations: 32,
    missingMigrations: ["0032_validation_kinds.sql"],
    unexpectedMigrations: ["legacy_migration.sql"],
  },
);
assert.deepEqual(diagnostic, {
  event: "elitze_production_readiness_failed",
  configuration: {
    missing: ["DATABASE_URL", "RESEND_API_KEY"],
    malformed: ["ELITZE_AUTH_ENCRYPTION_KEY_ACTIVE"],
    databaseConfigured: false,
  },
  database: {
    success: false,
    configurationSource: "DATABASE_URL",
    failureCode: "DATABASE_AUTHENTICATION_FAILED",
    expectedMigrations: 33,
    appliedMigrations: 32,
    missingMigrationCount: 1,
    unexpectedMigrationCount: 1,
  },
});
const serializedDiagnostic = JSON.stringify(diagnostic);
assert.equal(serializedDiagnostic.includes(connectionScheme), false, "diagnostic must never log connection strings");
assert.equal(serializedDiagnostic.includes(["fixture-value", "@"].join("")), false, "diagnostic must never log credentials");

const route = fs.readFileSync(new URL("../src/app/api/health/route.ts", import.meta.url), "utf8");
assert.match(route, /buildSanitizedReadinessDiagnostic/);
assert.match(route, /console\.error\("\[ELITZE_READINESS\]"/);
assert.match(route, /status: ok \? "ready" : "unavailable"/);
assert.doesNotMatch(route, /database\.message/, "raw database errors must not be emitted by the public route");

console.log("Production readiness diagnostics self-test: PASS");
