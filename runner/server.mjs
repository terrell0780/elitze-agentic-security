import http from "node:http";
import { spawn } from "node:child_process";
import { createHmac, createPublicKey, verify as verifySignature, timingSafeEqual, randomUUID } from "node:crypto";
import dns from "node:dns/promises";
import { isIP } from "node:net";
import { URL } from "node:url";
import { hostAuthorized, isPrivateIp, RUNNER_PROFILES, RUNNER_SCOPES } from "./scope-policy.mjs";

const boundedNumber = (value, fallback, minimum, maximum) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, Math.trunc(parsed))) : fallback;
};

const PORT = boundedNumber(process.env.PORT, 8787, 1, 65535);
const CONTROL_SECRET = process.env.ELITZE_RUNNER_HMAC_SECRET?.trim() ?? "";
const RUNNER_TOKEN = process.env.ELITZE_SECURITY_RUNNER_TOKEN?.trim() ?? "";
const CALLBACK_ORIGIN = process.env.ELITZE_CALLBACK_ORIGIN?.trim().replace(/\/$/, "") ?? "";
const ALLOWED_HOSTS = (process.env.ELITZE_RUNNER_ALLOWED_HOSTS ?? "")
  .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
const ALLOW_PRIVATE = /^(1|true|yes)$/i.test(process.env.ELITZE_RUNNER_ALLOW_PRIVATE_TARGETS ?? "");
const MAX_CONCURRENT = boundedNumber(process.env.ELITZE_RUNNER_MAX_CONCURRENT, 2, 1, 8);
const MAX_QUEUE = boundedNumber(process.env.ELITZE_RUNNER_MAX_QUEUE, 100, 1, 1000);
const MAX_RETAINED_JOBS = boundedNumber(process.env.ELITZE_RUNNER_MAX_RETAINED_JOBS, 500, 50, 5000);
const JOB_TIMEOUT_MS = boundedNumber(process.env.ELITZE_RUNNER_JOB_TIMEOUT_MS, 900000, 30000, 3600000);
const CANCEL_GRACE_MS = boundedNumber(process.env.ELITZE_RUNNER_CANCEL_GRACE_MS, 5000, 1000, 30000);
const NUCLEI_BIN = process.env.NUCLEI_BIN?.trim() || "nuclei";
const DEFAULT_RATE = boundedNumber(process.env.ELITZE_RUNNER_RATE_LIMIT, 20, 1, 200);
const TEMPLATE_UPDATE = /^(1|true|yes)$/i.test(process.env.ELITZE_RUNNER_UPDATE_TEMPLATES ?? "false");
const ALLOWED_PORTS = new Set((process.env.ELITZE_RUNNER_ALLOWED_PORTS ?? "443")
  .split(",").map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value > 0 && value <= 65535));

if (!CONTROL_SECRET || Buffer.byteLength(CONTROL_SECRET, "utf8") < 32) {
  console.error("ELITZE_RUNNER_HMAC_SECRET must contain at least 32 UTF-8 bytes");
  process.exit(1);
}
let callbackOriginIsValid = false;
try {
  const callbackOrigin = new URL(CALLBACK_ORIGIN);
  callbackOriginIsValid = callbackOrigin.protocol === "https:" &&
    callbackOrigin.origin === CALLBACK_ORIGIN &&
    callbackOrigin.pathname === "/" &&
    !callbackOrigin.username && !callbackOrigin.password &&
    !callbackOrigin.search && !callbackOrigin.hash;
} catch {}
if (!callbackOriginIsValid) {
  console.error("ELITZE_CALLBACK_ORIGIN must be an HTTPS origin without a path, credentials, query, or fragment");
  process.exit(1);
}
if (!ALLOWED_HOSTS.length) {
  console.error("ELITZE_RUNNER_ALLOWED_HOSTS must contain at least one authorized hostname");
  process.exit(1);
}

const jobs = new Map();
const queue = [];

const handshakeNonces = new Map();
const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_AUDIENCE = "elitze-runner-handshake";
const GITHUB_REPOSITORY = "terrell0780/elitze-agentic-security";
const GITHUB_MAIN_REF = "refs/heads/main";
const GITHUB_PRODUCTION_WORKFLOW = "terrell0780/elitze-agentic-security/.github/workflows/production-gates.yml@refs/heads/main";
let githubOidcJwksCache = null;
let githubOidcJwksFetchedAt = 0;

async function getGithubOidcJwks() {
  if (githubOidcJwksCache && Date.now() - githubOidcJwksFetchedAt < 5 * 60_000) {
    return githubOidcJwksCache;
  }
  const response = await fetch(GITHUB_OIDC_ISSUER + "/.well-known/jwks", {
    signal: AbortSignal.timeout(5_000),
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("github_oidc_jwks_unavailable");
  const document = await response.json();
  if (!Array.isArray(document.keys)) throw new Error("github_oidc_jwks_invalid");
  const keys = document.keys.filter((key) => key && key.kid && key.kty === "RSA" && (!key.use || key.use === "sig") && (!key.alg || key.alg === "RS256"));
  if (!keys.length) throw new Error("github_oidc_signing_keys_missing");
  githubOidcJwksCache = keys;
  githubOidcJwksFetchedAt = Date.now();
  return keys;
}

async function validateGithubOidcToken(token) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) throw new Error("github_oidc_token_invalid");
  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("github_oidc_token_invalid");
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("github_oidc_algorithm_not_allowed");
  const jwk = (await getGithubOidcJwks()).find((key) => key.kid === header.kid);
  if (!jwk) throw new Error("github_oidc_signing_key_unknown");
  const signedContent = Buffer.from(parts[0] + "." + parts[1], "utf8");
  const signatureBytes = Buffer.from(parts[2], "base64url");
  const validSignature = verifySignature(
    "RSA-SHA256",
    signedContent,
    createPublicKey({ key: jwk, format: "jwk" }),
    signatureBytes,
  );
  if (!validSignature) throw new Error("github_oidc_signature_invalid");

  const now = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== GITHUB_OIDC_ISSUER || !audiences.includes(GITHUB_OIDC_AUDIENCE)) {
    throw new Error("github_oidc_issuer_or_audience_invalid");
  }
  if (!Number.isFinite(claims.exp) || claims.exp <= now ||
      !Number.isFinite(claims.iat) || claims.iat > now + 30 || now - claims.iat > 600 ||
      (Number.isFinite(claims.nbf) && claims.nbf > now + 30)) {
    throw new Error("github_oidc_token_time_invalid");
  }
  if (claims.repository !== GITHUB_REPOSITORY ||
      claims.ref !== GITHUB_MAIN_REF ||
      claims.workflow_ref !== GITHUB_PRODUCTION_WORKFLOW ||
      !["push", "workflow_dispatch"].includes(claims.event_name)) {
    throw new Error("github_oidc_workload_not_authorized");
  }
  return claims;
}
const MAX_HANDSHAKE_NONCES = 10_000;

function authOk(req) {
  if (!RUNNER_TOKEN) return true;
  const expected = Buffer.from("Bearer " + RUNNER_TOKEN, "utf8");
  const supplied = Buffer.from(String(req.headers.authorization ?? ""), "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function signature(body, timestamp) {
  return createHmac("sha256", CONTROL_SECRET).update(timestamp + "." + body).digest("hex");
}

function requestSignatureOk(req, body) {
  const timestamp = String(req.headers["x-elitze-timestamp"] ?? "");
  const provided = String(req.headers["x-elitze-signature"] ?? "");
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > 5 * 60_000 || !provided) return false;
  const expected = signature(body, timestamp);
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("request_too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function validCallback(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.origin === CALLBACK_ORIGIN &&
      parsed.pathname === "/api/security/pentest" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

async function assertResolvedTargetSafe(hostname) {
  if (ALLOW_PRIVATE) return;
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("resolved_target_is_private_or_unroutable");
  }
}

async function validateJob(input) {
  if (!input || typeof input !== "object") throw new Error("invalid_job");
  const required = ["jobId","tenantId","kind","executionMode","target","scope","profile","authorizationRef","callbackUrl","roeExpiresAt"];
  for (const key of required) if (typeof input[key] !== "string" || !input[key].trim()) throw new Error(key + "_required");
  if (!["PENTEST","RED_TEAM"].includes(input.kind)) throw new Error("invalid_kind");
  if (!["manual","automatic"].includes(input.executionMode)) throw new Error("invalid_execution_mode");
  if (!RUNNER_SCOPES.has(input.scope)) throw new Error("scope_not_authorized");
  if (!RUNNER_PROFILES.has(input.profile)) throw new Error("profile_not_authorized");
  if (input.jobId.trim().length > 200 || input.tenantId.trim().length > 120) throw new Error("job_identity_invalid");
  if (input.authorizationRef.trim().length > 240) throw new Error("authorization_ref_invalid");
  if (!validCallback(input.callbackUrl)) throw new Error("callback_not_allowed");
  if (input.target.length > 2048 || !/^https:\/\//i.test(input.target)) throw new Error("https_target_required");
  const target = new URL(input.target);
  if (target.username || target.password) throw new Error("target_credentials_not_allowed");
  if (!hostAuthorized(target.hostname, ALLOWED_HOSTS)) throw new Error("target_not_in_authorized_allowlist");
  if (target.hash) throw new Error("target_fragment_not_allowed");
  const targetPort = Number(target.port || "443");
  if (!ALLOWED_PORTS.has(targetPort)) throw new Error("target_port_not_authorized");
  if (!ALLOW_PRIVATE) {
    if (isIP(target.hostname) && isPrivateIp(target.hostname)) throw new Error("private_target_blocked");
    await assertResolvedTargetSafe(target.hostname);
  }
  if (!Number.isFinite(Date.parse(input.roeExpiresAt)) || Date.parse(input.roeExpiresAt) <= Date.now()) throw new Error("roe_expired");
  return {
    ...input,
    jobId: input.jobId.trim(),
    tenantId: input.tenantId.trim(),
    target: input.target.trim(),
    scope: input.scope.trim(),
    profile: input.profile.trim(),
    authorizationRef: input.authorizationRef.trim(),
  };
}

async function callback(job, status, extra = {}) {
  if (!validCallback(job.callbackUrl)) return;
  const payload = JSON.stringify({
    callback: true,
    jobId: job.jobId,
    tenantId: job.tenantId,
    kind: job.kind,
    status,
    ...extra,
  });
  const timestamp = String(Date.now());
  const headers = {
    "content-type": "application/json",
    "x-elitze-timestamp": timestamp,
    "x-elitze-signature": signature(payload, timestamp),
  };
  if (RUNNER_TOKEN) headers.authorization = "Bearer " + RUNNER_TOKEN;
  try {
    const response = await fetch(job.callbackUrl, { method: "POST", headers, body: payload, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) console.error("callback_rejected", job.jobId, response.status);
  } catch (error) {
    console.error("callback_failed", job.jobId, error instanceof Error ? error.message : String(error));
  }
}

function templateArgs(job) {
  const args = [
    "-u", job.target,
    "-jsonl",
    "-silent",
    "-rate-limit", String(DEFAULT_RATE),
    "-timeout", "10",
    "-retries", "1",
    "-disable-redirects",
    "-restrict-local-network-access",
    "-disable-update-check",
    "-no-interactsh",
  ];
  if (job.kind === "RED_TEAM") {
    args.push("-severity", "low,medium,high,critical");
  } else if (job.profile === "api-security" || job.profile === "mcp-security") {
    args.push("-severity", "medium,high,critical");
  } else {
    args.push("-severity", "low,medium,high,critical");
  }
  return args;
}

let templatesReady = false;

async function ensureTemplates() {
  if (templatesReady || !TEMPLATE_UPDATE) return;
  await new Promise((resolve, reject) => {
    const child = spawn(NUCLEI_BIN, ["-update-templates", "-silent"], { stdio: ["ignore", "ignore", "pipe"] });
    let error = "";
    child.stderr.on("data", (chunk) => { error += chunk.toString("utf8").slice(0, 2000); });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(error || "nuclei_template_update_failed")));
  });
  templatesReady = true;
}

async function execute(job) {
  job.status = "RUNNING";
  try {
    await ensureTemplates();
  } catch (error) {
    job.status = "FAILED";
    job.completedAt = new Date().toISOString();
    job.result = { engine: "nuclei", error: "scanner_template_preparation_failed" };
    job.events = [{ level: "ERROR", eventType: "RUN_FAILED", message: "Scanner template preparation failed." }];
    await callback(job, "FAILED", { events: job.events, result: job.result });
    return;
  }
  job.startedAt = new Date().toISOString();
  job.heartbeatAt = job.startedAt;
  job.events = [{ level: "INFO", eventType: "RUN_STARTED", message: "Authorized security scan started." }];
  await callback(job, "RUNNING", { events: job.events });

  const args = templateArgs(job);
  const child = spawn(NUCLEI_BIN, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  job.child = child;
  const findings = [];
  let timedOut = false;
  let forcedKillTimer;
  const executionTimeout = setTimeout(() => {
    timedOut = true;
    job.cancelReason = "timeout";
    child.kill("SIGTERM");
    forcedKillTimer = setTimeout(() => {
      if (job.child === child) child.kill("SIGKILL");
    }, CANCEL_GRACE_MS);
    forcedKillTimer.unref?.();
  }, JOB_TIMEOUT_MS);
  executionTimeout.unref?.();
  let stdoutBuffer = "";
  let stderr = "";

  const heartbeat = setInterval(() => {
    job.heartbeatAt = new Date().toISOString();
    void callback(job, "RUNNING", {
      events: [{ level: "INFO", eventType: "HEARTBEAT", message: "Scanner heartbeat.", payload: { findings: findings.length } }],
      result: { findings: findings.length },
    });
  }, 10_000);

  const flush = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let parsed;
    try { parsed = JSON.parse(trimmed); } catch { return; }
    const finding = {
      findingKey: parsed.templateID && parsed.host ? parsed.templateID + ":" + parsed.host + ":" + (parsed.matchedAt ?? "") : randomUUID(),
      title: parsed.info?.name ?? parsed.templateID ?? "Nuclei finding",
      severity: String(parsed.info?.severity ?? "info").toUpperCase(),
      category: parsed.type ?? "VULNERABILITY",
      target: parsed.host ?? job.target,
      source: "Nuclei " + (parsed["template-url"] ? parsed["template-url"] : "official/community templates"),
      evidenceState: "OBSERVED",
      status: "OPEN",
      summary: parsed.matchedAt ? "Observed match at " + parsed.matchedAt : "Observed scanner match.",
      remediation: parsed.info?.remediation ?? null,
      references: Array.isArray(parsed.info?.reference) ? parsed.info.reference : [],
      evidence: parsed,
      observedAt: new Date().toISOString(),
    };
    findings.push(finding);
    job.heartbeatAt = finding.observedAt;
    void callback(job, "RUNNING", {
      findings: [finding],
      events: [{ level: "SUCCESS", eventType: "FINDING_OBSERVED", message: finding.title, payload: { findingKey: finding.findingKey } }],
      result: { findings: findings.length },
    });
  };

  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk.toString("utf8");
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? "";
    for (const line of lines) flush(line);
  });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8").slice(0, 4000); });

  const exitCode = await new Promise((resolve) => {
    child.once("error", () => resolve(127));
    child.once("close", (code) => resolve(typeof code === "number" ? code : 1));
  });
  if (stdoutBuffer) flush(stdoutBuffer);
  clearInterval(heartbeat);
  clearTimeout(executionTimeout);
  clearTimeout(forcedKillTimer);
  delete job.child;
  job.heartbeatAt = new Date().toISOString();

  if (timedOut) {
    job.status = "FAILED";
  } else if (job.cancelRequested) {
    job.status = "CANCELLED";
  } else if (exitCode === 0) {
    job.status = "COMPLETED";
  } else {
    job.status = "FAILED";
  }

  job.completedAt = new Date().toISOString();
  job.findings = findings;
  job.result = {
    engine: "nuclei",
    exitCode,
    findingCount: findings.length,
    timedOut,
    cancelReason: job.cancelReason ?? null,
    stderr: stderr ? stderr.slice(0, 2000) : null,
  };
  job.events = [
    ...(job.events ?? []),
    {
      level: job.status === "COMPLETED" ? "SUCCESS" : job.status === "CANCELLED" ? "WARN" : "ERROR",
      eventType: timedOut ? "RUN_TIMEOUT" : job.status === "CANCELLED" ? "RUN_CANCELLED" : "RUN_COMPLETED",
      message: timedOut ? "Scanner exceeded its execution deadline and was terminated." : job.status === "CANCELLED" ? "Scanner was cancelled and terminated." : "Scanner finished with status " + job.status + ".",
      payload: job.result,
    },
  ];
  await callback(job, job.status, {
    findings,
    events: job.events.slice(-50),
    evidenceState: job.status === "COMPLETED" ? "AVAILABLE" : "UNAVAILABLE",
    result: job.result,
  });
}

function pump() {
  while (queue.length && [...jobs.values()].filter((job) => job.status === "RUNNING").length < MAX_CONCURRENT) {
    const job = queue.shift();
    if (!job || job.cancelRequested) continue;
    void execute(job).catch(async (error) => {
      job.status = "FAILED";
      job.completedAt = new Date().toISOString();
      job.result = { engine: "nuclei", error: error instanceof Error ? error.message : String(error) };
      await callback(job, "FAILED", { events: [{ level: "ERROR", eventType: "RUN_FAILED", message: "Runner execution failed." }], result: job.result });
    }).finally(pump);
  }
}

function pruneJobs(maxSize = MAX_RETAINED_JOBS) {
  if (jobs.size <= maxSize) return;
  for (const [jobId, job] of jobs) {
    if (jobs.size <= maxSize) break;
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) jobs.delete(jobId);
  }
}

function enqueue(job) {
  if (queue.length >= MAX_QUEUE) throw new Error("runner_queue_full");
  pruneJobs(MAX_RETAINED_JOBS - 1);
  if (jobs.size >= MAX_RETAINED_JOBS) throw new Error("runner_retained_job_limit_reached");
  if (jobs.has(job.jobId)) throw new Error("runner_job_id_conflict");
  jobs.set(job.jobId, job);
  queue.push(job);
  pump();
}

async function handle(req, res) {
  const url = new URL(req.url ?? "/", "http://runner.local");
  if (url.pathname === "/health") return json(res, 200, { ok: true, runner: "ELITZE", engine: "nuclei", active: [...jobs.values()].filter((j) => j.status === "RUNNING").length, queued: queue.length });

  if (req.method === "POST" && url.pathname === "/api/github/handshake") {
    const authorization = String(req.headers.authorization ?? "");
    const tokenMatch = authorization.match(/^Bearer\s+(\S+)$/i);
    if (!tokenMatch) return json(res, 401, { ok: false, error: "github_oidc_required" });
    let challenge;
    try {
      challenge = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { ok: false, error: "invalid_json" });
    }
    if (challenge?.action !== "github-handshake" ||
        !Number.isSafeInteger(challenge?.timestamp) ||
        Math.abs(Date.now() - challenge.timestamp) > 5 * 60_000 ||
        typeof challenge?.nonce !== "string" ||
        !/^[a-f0-9]{32}$/i.test(challenge.nonce)) {
      return json(res, 400, { ok: false, error: "invalid_github_handshake_challenge" });
    }
    let claims;
    try {
      claims = await validateGithubOidcToken(tokenMatch[1]);
    } catch {
      return json(res, 401, { ok: false, error: "github_oidc_not_authorized" });
    }
    const now = Date.now();
    for (const [seenNonce, seenAt] of handshakeNonces) if (now - seenAt > 300000) handshakeNonces.delete(seenNonce);
    if (handshakeNonces.has(challenge.nonce)) return json(res, 409, { ok: false, error: "handshake_nonce_replayed" });
    if (handshakeNonces.size >= MAX_HANDSHAKE_NONCES) return json(res, 429, { ok: false, error: "handshake_nonce_capacity" });
    handshakeNonces.set(challenge.nonce, now);
    return json(res, 200, {
      ok: true,
      action: "github-handshake",
      nonce: challenge.nonce,
      timestamp: now,
      repository: claims.repository,
      workflowRef: claims.workflow_ref,
    });
  }

  if (!authOk(req)) return json(res, 401, { ok: false, error: "unauthorized" });
  const body = await readBody(req);
  if (!requestSignatureOk(req, body)) return json(res, 401, { ok: false, error: "invalid_signature" });

  if (req.method === "POST" && url.pathname === "/api/handshake") {
    let challenge;
    try { challenge = JSON.parse(body); } catch { return json(res, 400, { ok: false, error: "invalid_json" }); }
    const requestTimestamp = String(req.headers["x-elitze-timestamp"] ?? "");
    const nonce = challenge?.nonce;
    if (challenge?.action !== "handshake" || !Number.isSafeInteger(challenge?.timestamp) ||
        String(challenge.timestamp) !== requestTimestamp || typeof nonce !== "string" ||
        !/^[a-f0-9]{32}$/i.test(nonce)) {
      return json(res, 400, { ok: false, error: "invalid_handshake_challenge" });
    }
    const now = Date.now();
    for (const [seenNonce, seenAt] of handshakeNonces) if (now - seenAt > 300000) handshakeNonces.delete(seenNonce);
    if (handshakeNonces.has(nonce)) return json(res, 409, { ok: false, error: "handshake_nonce_replayed" });
    if (handshakeNonces.size >= MAX_HANDSHAKE_NONCES) return json(res, 429, { ok: false, error: "handshake_nonce_capacity" });
    handshakeNonces.set(nonce, now);
    const responseTimestamp = String(now);
    const responseBody = JSON.stringify({ ok: true, action: "handshake", nonce, timestamp: now });
    res.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-elitze-timestamp": responseTimestamp,
      "x-elitze-signature": signature(responseBody, responseTimestamp),
    });
    return res.end(responseBody);
  }

  if (req.method === "POST" && url.pathname === "/v1/jobs") {
    try {
      const job = await validateJob(JSON.parse(body));
      const existing = jobs.get(job.jobId);
      if (existing) {
        const sameIdentity = existing.tenantId === job.tenantId &&
          existing.kind === job.kind && existing.target === job.target &&
          existing.scope === job.scope && existing.profile === job.profile &&
          existing.authorizationRef === job.authorizationRef;
        if (!sameIdentity) return json(res, 409, { ok: false, error: "runner_job_id_conflict" });
        return json(res, 200, { ok: true, jobId: existing.jobId, status: existing.status });
      }
      const record = { ...job, status: "QUEUED", createdAt: new Date().toISOString(), heartbeatAt: null, startedAt: null, completedAt: null, findings: [], events: [], result: null, cancelRequested: false };
      if (queue.length >= MAX_QUEUE) return json(res, 429, { ok: false, error: "runner_queue_full" });
      try {
        enqueue(record);
      } catch (error) {
        return json(res, 503, { ok: false, error: error instanceof Error ? error.message : "runner_enqueue_failed" });
      }
      return json(res, 202, { ok: true, jobId: record.jobId, status: record.status });
    } catch (error) {
      return json(res, 400, { ok: false, error: error instanceof Error ? error.message : "invalid_job" });
    }
  }

  const match = url.pathname.match(/^\/v1\/jobs\/([^/]+)$/);
  if (match) {
    const jobId = decodeURIComponent(match[1]);
    const job = jobs.get(jobId);
    if (!job) return json(res, 404, { ok: false, error: "job_not_found" });
    if (req.method === "GET") {
      return json(res, 200, {
        ok: true,
        job: {
          jobId: job.jobId,
          status: job.status,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          heartbeatAt: job.heartbeatAt,
          result: job.result,
        },
      });
    }
    if (req.method === "DELETE") {
      if (["COMPLETED", "FAILED", "CANCELLED"].includes(job.status)) {
        return json(res, 200, { ok: true, status: job.status });
      }
      job.cancelRequested = true;
      job.cancelReason = "requested";
      if (job.status === "QUEUED") {
        job.status = "CANCELLED";
        job.completedAt = new Date().toISOString();
        await callback(job, "CANCELLED", {
          evidenceState: "UNAVAILABLE",
          events: [{ level: "WARN", eventType: "RUN_CANCELLED", message: "Queued scanner job cancelled before execution." }],
          result: { engine: "nuclei", cancelledBeforeStart: true },
        });
      } else if (job.child) {
        const child = job.child;
        child.kill("SIGTERM");
        const killTimer = setTimeout(() => {
          if (job.child === child) child.kill("SIGKILL");
        }, CANCEL_GRACE_MS);
        killTimer.unref?.();
      }
      return json(res, 200, { ok: true, status: job.status });
    }
  }

  return json(res, 404, { ok: false, error: "not_found" });
}

http.createServer((req, res) => {
  void handle(req, res).catch((error) => {
    if (error instanceof Error && error.message === "request_too_large") {
      return json(res, 413, { ok: false, error: "request_too_large" });
    }
    console.error("runner_request_failed", error instanceof Error ? error.message : String(error));
    json(res, 500, { ok: false, error: "runner_internal_error" });
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log("ELITZE security runner listening on :" + PORT);
});
