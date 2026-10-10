import fs from "node:fs";
import assert from "node:assert/strict";

const route = fs.readFileSync("src/app/api/console/evidence-snapshot/route.ts", "utf8");
for (const marker of [
  'getCurrentUser()',
  'user.tenantId',
  'security_graph_nodes',
  'security_graph_edges',
  'security_test_requests',
  'security_test_findings',
  'security_validation_events',
  'CONFIGURED_NOT_LIVE_VERIFIED',
  'NOT_RUNTIME_VERIFIED',
  'OUT_OF_BAND_EVIDENCE_REQUIRED',
  'cache-control',
  'content-disposition',
]) assert.ok(route.includes(marker), `evidence snapshot must include ${marker}`);
assert.doesNotMatch(route, /DATABASE_URL|ELITZE_SECURITY_RUNNER_HMAC_SECRET|process\.env\.[A-Z_]*(?:TOKEN|SECRET|PASSWORD|KEY)/);
assert.match(route, /No targets, credentials, finding descriptions, raw event payloads, or secrets are included/);
console.log("ELITZE tenant-scoped evidence snapshot self-test: PASS");
