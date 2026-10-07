import { createHmac, timingSafeEqual } from "node:crypto";
import { productionConfig } from "@/config/production";

export type ValidationKind = "PENTEST" | "RED_TEAM";
export type ExecutionMode = "manual" | "automatic";
export type ValidationStatus = "QUEUED" | "DISPATCHED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

const env = (name: string) => process.env[name]?.trim() ?? "";

function runnerBaseUrl() {
  return env("ELITZE_SECURITY_RUNNER_URL").replace(/\/$/, "");
}

function signingSecret() {
  return env("ELITZE_SECURITY_RUNNER_HMAC_SECRET");
}

function runnerToken() {
  return env("ELITZE_SECURITY_RUNNER_TOKEN");
}

function sign(body: string, timestamp: string) {
  const secret = signingSecret();
  if (!secret) throw new Error("security_runner_not_configured");
  return createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
}

async function runnerFetch(path: string, init: RequestInit = {}) {
  const base = runnerBaseUrl();
  if (!base || !signingSecret()) throw new Error("security_runner_not_configured");
  const body = typeof init.body === "string" ? init.body : "";
  const timestamp = String(Date.now());
  const headers = new Headers(init.headers);
  headers.set("x-elitze-timestamp", timestamp);
  headers.set("x-elitze-signature", sign(body, timestamp));
  headers.set("accept", "application/json");
  if (runnerToken()) headers.set("authorization", "Bearer " + runnerToken());
  return fetch(base + path, { ...init, headers, cache: "no-store" });
}

export type RunnerDispatchInput = {
  jobId: string;
  tenantId: string;
  kind: ValidationKind;
  executionMode: ExecutionMode;
  target: string;
  scope: string;
  profile: string;
  framework?: string;
  authorizationRef: string;
  roeExpiresAt?: string | null;
};

export async function runnerConfigured() {
  return Boolean(runnerBaseUrl() && signingSecret());
}

export async function dispatchValidationJob(input: RunnerDispatchInput) {
  const callbackUrl = productionConfig.canonicalOrigin.replace(/\/$/, "") + "/api/security/pentest";
  const body = JSON.stringify({ ...input, callbackUrl });
  const response = await runnerFetch("/v1/jobs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  const payload = await response.json().catch(() => ({})) as {
    ok?: boolean;
    jobId?: string;
    status?: ValidationStatus;
    message?: string;
  };
  if (!response.ok || !payload.ok || !payload.jobId) {
    throw new Error(payload.message || "security_runner_dispatch_failed");
  }
  return payload;
}

export async function getRunnerJob(jobId: string) {
  const response = await runnerFetch("/v1/jobs/" + encodeURIComponent(jobId), { method: "GET" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("security_runner_status_" + response.status);
  return payload as {
    ok: boolean;
    job?: {
      jobId: string;
      status: ValidationStatus;
      startedAt?: string | null;
      completedAt?: string | null;
      heartbeatAt?: string | null;
      result?: Record<string, unknown>;
    };
  };
}

export async function cancelRunnerJob(jobId: string) {
  const response = await runnerFetch("/v1/jobs/" + encodeURIComponent(jobId), { method: "DELETE" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("security_runner_cancel_" + response.status);
  return payload as { ok: boolean; status?: ValidationStatus };
}

export function verifyRunnerSignature(body: string, timestamp: string, signature: string) {
  const secret = signingSecret();
  if (!secret || !timestamp || !signature) return false;
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > 5 * 60_000) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
