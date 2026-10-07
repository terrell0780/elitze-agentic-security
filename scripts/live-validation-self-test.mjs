import assert from "node:assert/strict";
import fs from "node:fs";

const route = fs.readFileSync("src/app/api/security/pentest/route.ts", "utf8");
const migration = fs.readFileSync("drizzle/0031_live_security_validation.sql", "utf8");
const kinds = fs.readFileSync("drizzle/0032_validation_kinds.sql", "utf8");
const runner = fs.readFileSync("src/lib/security-validation/runner.ts", "utf8");
const page = fs.readFileSync("src/app/console/pentesting/page.tsx", "utf8");

assert.match(route, /runnerConfigured/);
assert.match(route, /verifyRunnerSignature/);
assert.match(route, /security_test_findings/);
assert.match(route, /security_validation_events/);
assert.match(route, /security_validation_schedules/);
assert.match(route, /red_team_runs/);
assert.match(route, /callback === true/);
assert.match(migration, /security_test_findings/);
assert.match(kinds, /PENTEST.*RED_TEAM/);
assert.match(kinds, /roe_expires_at/);
assert.match(runner, /ELITZE_SECURITY_RUNNER_HMAC_SECRET/);
assert.match(runner, /callbackUrl/);
assert.match(page, /Run now/);
assert.match(page, /Live telemetry/);
assert.match(page, /Findings/);
assert.match(page, /Every 5 minutes/);
console.log("ELITZE live validation self-test: PASS");
