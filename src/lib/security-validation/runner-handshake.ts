import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type RunnerHandshakeOptions = {
  baseUrl: string;
  secret: string;
  token?: string;
  timeoutMs?: number;
};

export type RunnerHandshakeResult = {
  ok: true;
  nonce: string;
  timestamp: number;
};

export async function verifyRunnerHandshake({
  baseUrl,
  secret,
  token = "",
  timeoutMs = 5_000,
}: RunnerHandshakeOptions): Promise<RunnerHandshakeResult> {
  const base = baseUrl.trim().replace(/\/+$/, "");
  if (!base || !secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("security_runner_not_configured");
  }

  let parsedBase: URL;
  try {
    parsedBase = new URL(base);
  } catch {
    throw new Error("security_runner_url_invalid");
  }
  const localHttp = parsedBase.protocol === "http:" && ["127.0.0.1", "localhost"].includes(parsedBase.hostname);
  if (parsedBase.protocol !== "https:" && !localHttp) {
    throw new Error("security_runner_https_required");
  }

  const timestamp = String(Date.now());
  const nonce = randomBytes(16).toString("hex");
  const requestBody = JSON.stringify({ action: "handshake", timestamp: Number(timestamp), nonce });
  const requestSignature = createHmac("sha256", secret)
    .update(timestamp + "." + requestBody)
    .digest("hex");
  const headers = new Headers({
    "content-type": "application/json",
    accept: "application/json",
    "cache-control": "no-store",
    "x-elitze-timestamp": timestamp,
    "x-elitze-signature": requestSignature,
  });
  if (token.trim()) headers.set("authorization", "Bearer " + token.trim());

  const response = await fetch(base + "/api/handshake", {
    method: "POST",
    headers,
    body: requestBody,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error("security_runner_handshake_http_" + response.status);
  }

  const responseBody = await response.text();
  const responseTimestamp = response.headers.get("x-elitze-timestamp") ?? "";
  const responseSignature = response.headers.get("x-elitze-signature") ?? "";
  if (!/^\d{13}$/.test(responseTimestamp) || !/^[a-f0-9]{64}$/i.test(responseSignature)) {
    throw new Error("security_runner_handshake_headers_invalid");
  }
  const responseTime = Number(responseTimestamp);
  if (!Number.isSafeInteger(responseTime) || Math.abs(Date.now() - responseTime) > 5 * 60_000) {
    throw new Error("security_runner_handshake_response_stale");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(responseTimestamp + "." + responseBody)
    .digest();
  const suppliedSignature = Buffer.from(responseSignature, "hex");
  if (expectedSignature.length !== suppliedSignature.length || !timingSafeEqual(expectedSignature, suppliedSignature)) {
    throw new Error("security_runner_handshake_response_signature_invalid");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(responseBody);
  } catch {
    throw new Error("security_runner_handshake_response_invalid_json");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    (payload as Record<string, unknown>).ok !== true ||
    (payload as Record<string, unknown>).action !== "handshake" ||
    (payload as Record<string, unknown>).nonce !== nonce ||
    (payload as Record<string, unknown>).timestamp !== responseTime
  ) {
    throw new Error("security_runner_handshake_challenge_mismatch");
  }

  return { ok: true, nonce, timestamp: responseTime };
}
