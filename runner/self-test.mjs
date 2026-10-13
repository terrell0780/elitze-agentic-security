import assert from "node:assert/strict";
import fs from "node:fs";
import { hostAuthorized, isPrivateIp, RUNNER_PROFILES, RUNNER_SCOPES } from "./scope-policy.mjs";

const source = fs.readFileSync("runner/server.mjs", "utf8");
const dockerfile = fs.readFileSync("runner/Dockerfile", "utf8");

assert.match(source, /ELITZE_RUNNER_HMAC_SECRET/);
assert.match(source, /\/api\/handshake/);
assert.match(source, /handshake_nonce_replayed/);
assert.match(source, /invalid_handshake_challenge/);
assert.match(source, /ELITZE_RUNNER_ALLOWED_HOSTS/);
assert.match(source, /target_not_in_authorized_allowlist/);
assert.match(source, /private_target_blocked/);
assert.match(source, /resolved_target_is_private_or_unroutable/);
assert.match(source, /target_credentials_not_allowed/);
assert.match(source, /update-templates/);
assert.match(source, /spawn\(NUCLEI_BIN/);
assert.match(source, /callbackUrl/);
assert.match(source, /timingSafeEqual/);
assert.match(source, /RUN_STARTED/);
assert.match(source, /FINDING_OBSERVED/);
assert.match(source, /RUN_COMPLETED/);
assert.match(dockerfile, /nuclei@v3\.11\.1/);

for (const address of ["0.0.0.0", "10.0.0.1", "100.64.0.1", "127.0.0.1", "169.254.10.2", "172.16.0.1", "192.168.1.1", "198.18.0.1", "224.0.0.1", "::", "::1", "fc00::1", "fe80::1", "2001:db8::1", "::ffff:127.0.0.1", "not-an-ip"]) {
  assert.equal(isPrivateIp(address), true, `private, special-purpose, or invalid address must be blocked: ${address}`);
}
for (const address of ["1.1.1.1", "8.8.8.8", "93.184.216.34", "2606:4700:4700::1111", "2001:4860:4860::8888"]) {
  assert.equal(isPrivateIp(address), false, `public address should pass IP classification: ${address}`);
}
assert.equal(hostAuthorized("example.com", ["example.com"]), true);
assert.equal(hostAuthorized("API.EXAMPLE.COM.", ["*.example.com"]), true);
assert.equal(hostAuthorized("example.com", ["*.example.com"]), false);
assert.equal(hostAuthorized("notexample.com", ["*.example.com"]), false);
assert.equal(hostAuthorized("example.com.attacker.test", ["*.example.com"]), false);
assert.equal(hostAuthorized("attacker-example.com", ["example.com"]), false);
assert.equal(RUNNER_SCOPES.has("public-surface"), true);
assert.equal(RUNNER_SCOPES.has("arbitrary-network"), false);
assert.equal(RUNNER_PROFILES.has("api-security"), true);
assert.equal(RUNNER_PROFILES.has("arbitrary-profile"), false);

console.log("ELITZE security runner self-test: PASS (control-plane assertions, target-scope boundaries, public/private IP classification)");
