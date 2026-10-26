import assert from "node:assert/strict";
import { assessTenantDatabaseIsolation } from "../src/lib/database-isolation-readiness.ts";

const healthy = {
  expectedRuntimeRole: "elitze_app_runtime",
  activeRole: "elitze_app_runtime",
  isSuperuser: false,
  bypassRls: false,
  tenantTables: [
    {
      schemaName: "public",
      tableName: "auth_tenants",
      rlsEnabled: true,
      forceRls: true,
      policyCount: 2,
    },
  ],
};

assert.equal(assessTenantDatabaseIsolation(healthy).state, "READY");
assert.match(
  assessTenantDatabaseIsolation(healthy).detail,
  /does not prove policy semantics|does not.*replace negative cross-tenant tests/i,
  "a catalog pass must not be described as proof of semantic isolation",
);

assert.equal(
  assessTenantDatabaseIsolation({ ...healthy, expectedRuntimeRole: "" }).state,
  "BLOCKED",
  "runtime role must be explicitly configured",
);
assert.equal(
  assessTenantDatabaseIsolation({ ...healthy, activeRole: "postgres" }).state,
  "BLOCKED",
  "active database role must match the configured runtime role",
);
assert.equal(
  assessTenantDatabaseIsolation({ ...healthy, isSuperuser: true }).state,
  "BLOCKED",
  "superuser runtime roles must be rejected",
);
assert.equal(
  assessTenantDatabaseIsolation({ ...healthy, bypassRls: true }).state,
  "BLOCKED",
  "BYPASSRLS runtime roles must be rejected",
);
assert.equal(
  assessTenantDatabaseIsolation({ ...healthy, tenantTables: [] }).state,
  "BLOCKED",
  "absence of tenant-keyed tables must not pass as evidence",
);

for (const gap of [
  { rlsEnabled: false, forceRls: true, policyCount: 1 },
  { rlsEnabled: true, forceRls: false, policyCount: 1 },
  { rlsEnabled: true, forceRls: true, policyCount: 0 },
]) {
  const result = assessTenantDatabaseIsolation({
    ...healthy,
    tenantTables: [{ ...healthy.tenantTables[0], ...gap }],
  });
  assert.equal(result.state, "BLOCKED", "missing RLS structure must block readiness");
}

const partial = assessTenantDatabaseIsolation({
  ...healthy,
  tenantTables: [
    ...healthy.tenantTables,
    {
      schemaName: "public",
      tableName: "security_decisions",
      rlsEnabled: false,
      forceRls: false,
      policyCount: 0,
    },
  ],
});
assert.equal(partial.state, "BLOCKED");
assert.match(partial.detail, /public\.security_decisions/);

console.log("ELITZE tenant database isolation readiness self-test: PASS");
