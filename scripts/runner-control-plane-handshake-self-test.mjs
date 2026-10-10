import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { verifyRunnerHandshake } from "../src/lib/security-validation/runner-handshake.ts";

const port = 19787 + Math.floor(Math.random() * 1000);
const secret = randomBytes(32).toString("hex");
const baseUrl = "http://127.0.0.1:" + port;
const child = spawn(process.execPath, ["runner/server.mjs"], {
  env: {
    ...process.env,
    PORT: String(port),
    ELITZE_RUNNER_HMAC_SECRET: secret,
    ELITZE_CALLBACK_ORIGIN: "https://elitze.info",
    ELITZE_RUNNER_ALLOWED_HOSTS: "example.com",
    ELITZE_RUNNER_UPDATE_TEMPLATES: "false",
  },
  stdio: "ignore",
});

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error("Runner exited before becoming healthy");
    try {
      const response = await fetch(baseUrl + "/health", { signal: AbortSignal.timeout(500) });
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Runner health endpoint did not become ready");
}

try {
  await waitForHealth();
  const result = await verifyRunnerHandshake({ baseUrl, secret });
  assert.equal(result.ok, true);
  assert.match(result.nonce, /^[a-f0-9]{32}$/);
  assert.ok(Math.abs(Date.now() - result.timestamp) < 5_000);

  await assert.rejects(
    verifyRunnerHandshake({ baseUrl, secret: randomBytes(32).toString("hex") }),
    /security_runner_handshake_http_401/,
    "runner must reject a challenge signed with the wrong key",
  );
  console.log("ELITZE control-plane runner handshake self-test: PASS (fresh nonce, request HMAC, response HMAC, response timestamp, wrong-key rejection)");
} finally {
  child.kill("SIGTERM");
}
