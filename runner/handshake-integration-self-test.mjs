import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const port = 18787 + Math.floor(Math.random() * 1000);
const secret = randomBytes(32).toString("hex");
const child = spawn(process.execPath, ["runner/server.mjs"], {
  env: {
    ...process.env,
    PORT: String(port),
    ELITZE_RUNNER_HMAC_SECRET: secret,
    ELITZE_CALLBACK_ORIGIN: "https://example.com",
    ELITZE_RUNNER_ALLOWED_HOSTS: "example.com",
    ELITZE_RUNNER_UPDATE_TEMPLATES: "false",
  },
  stdio: "ignore",
});

const sign = (timestamp, body) =>
  createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (child.exitCode !== null) throw new Error("Runner exited before becoming healthy");
    try {
      const response = await fetch("http://127.0.0.1:" + port + "/health", {
        signal: AbortSignal.timeout(500),
      });
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Runner health endpoint did not become ready");
}

try {
  await waitForHealth();

  const unauthenticatedGithubProbe = await fetch("http://127.0.0.1:" + port + "/api/github/handshake", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "github-handshake", timestamp: Date.now(), nonce: randomBytes(16).toString("hex") }),
  });
  assert.equal(unauthenticatedGithubProbe.status, 401, "runner probe must reject missing GitHub OIDC identity");

  const timestamp = String(Date.now());
  const nonce = randomBytes(16).toString("hex");
  const payload = JSON.stringify({ action: "handshake", timestamp: Number(timestamp), nonce });
  const response = await fetch("http://127.0.0.1:" + port + "/api/handshake", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-elitze-timestamp": timestamp,
      "x-elitze-signature": sign(timestamp, payload),
    },
    body: payload,
  });
  assert.equal(response.status, 200, "valid signed challenge must succeed");
  const body = await response.text();
  const responseTimestamp = response.headers.get("x-elitze-timestamp");
  const responseSignature = response.headers.get("x-elitze-signature");
  assert.match(responseTimestamp ?? "", /^\d{13}$/);
  assert.match(responseSignature ?? "", /^[a-f0-9]{64}$/i);
  const expected = Buffer.from(sign(responseTimestamp, body), "hex");
  const supplied = Buffer.from(responseSignature, "hex");
  assert.equal(expected.length, supplied.length);
  assert.equal(timingSafeEqual(expected, supplied), true, "response HMAC must verify");
  assert.deepEqual(JSON.parse(body), {
    ok: true,
    action: "handshake",
    nonce,
    timestamp: JSON.parse(body).timestamp,
  });

  const replay = await fetch("http://127.0.0.1:" + port + "/api/handshake", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-elitze-timestamp": timestamp,
      "x-elitze-signature": sign(timestamp, payload),
    },
    body: payload,
  });
  assert.equal(replay.status, 409, "replayed nonce must be rejected");

  const badSignature = await fetch("http://127.0.0.1:" + port + "/api/handshake", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-elitze-timestamp": String(Date.now()),
      "x-elitze-signature": "0".repeat(64),
    },
    body: JSON.stringify({ action: "handshake", timestamp: Date.now(), nonce: randomBytes(16).toString("hex") }),
  });
  assert.equal(badSignature.status, 401, "invalid HMAC must be rejected");
  console.log("ELITZE runner challenge-response integration self-test: PASS (valid signature, response HMAC, nonce replay rejection, invalid signature rejection)");
} finally {
  child.kill("SIGTERM");
}
