import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("runner/server.mjs", "utf8");
const dockerfile = fs.readFileSync("runner/Dockerfile", "utf8");

assert.match(source, /ELITZE_SECURITY_RUNNER_HMAC_SECRET/);
assert.match(source, /ELITZE_RUNNER_ALLOWED_HOSTS/);
assert.match(source, /target_not_in_authorized_allowlist/);
assert.match(source, /private_target_blocked/);
assert.match(source, /spawn\(NUCLEI_BIN/);
assert.match(source, /callbackUrl/);
assert.match(source, /timingSafeEqual/);
assert.match(source, /RUN_STARTED/);
assert.match(source, /FINDING_OBSERVED/);
assert.match(source, /RUN_COMPLETED/);
assert.match(dockerfile, /nuclei@v3\.11\.1/);
console.log("ELITZE security runner self-test: PASS");
