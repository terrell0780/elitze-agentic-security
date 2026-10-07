import http from "node:http";
import { spawn } from "node:child_process";
import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { URL } from "node:url";

const PORT = Number(process.env.PORT ?? 8787);
const CONTROL_SECRET = process.env.ELITZE_SECURITY_RUNNER_HMAC_SECRET?.trim() ?? "";
const RUNNER_TOKEN = process.env.ELITZE_SECURITY_RUNNER_TOKEN?.trim() ?? "";
const CALLBACK_ORIGIN = process.env.ELITZE_CALLBACK_ORIGIN?.trim().replace(/\/$/, "") ?? "";
const ALLOWED_HOSTS = (process.env.ELITZE_RUNNER_ALLOWED_HOSTS ?? "")
  .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
const ALLOW_PRIVATE = /^(1|true|yes)$/i.test(process.env.ELITZE_RUNNER_ALLOW_PRIVATE_TARGETS ?? "");
const MAX_CONCURRENT = Math.max(1, Math.min(8, Number(process.env.ELITZE_RUNNER_MAX_CONCURRENT ?? 2)));
const NUCLEI_BIN = process.env.NUCLEI_BIN?.trim() || "nuclei";
const DEFAULT_RATE = Math.max(1, Math.min(200, Number(process.env.ELITZE_RUNNER_RATE_LIMIT ?? 20)));

if (!CONTROL_SECRET) {
  console.error("ELITZE_SECURITY_RUNNER_HMAC_SECRET is required");
  process.exit(1);
}
if (!CALLBACK_ORIGIN || !/^https:\/\//i.test(CALLBACK_ORIGIN)) {
  console.error("ELITZE_CALLBACK_ORIGIN must be an HTTPS origin");
  process.exit(1);
}
if (!ALLOWED_HOSTS.length) {
  console.error("ELITZE_RUNNER_ALLOWED_HOSTS must contain at least one authorized hostname");
  process.exit(1);
}

const jobs = new Map();
const queue = [];

function authOk(req) {
  if (!RUNNER_TOKEN) return true;
  const value = req.headers.authorization ?? "";
  return value === "Bearer " + RUNNER_TOKEN;
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
    return parsed.protocol === "https:" && url.startsWith(CALLBACK_ORIGIN + "/api/security/pentest");
  } catch {
    return false;
  }
}

function hostAuthorized(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed))) return true;
  return false;
}

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return true;
  const match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const octets = match.slice(1).map(Number);
  if (octets.some((n) => n > 255)) return true;
  const [a,b] = octets;
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || a === 0;
}

function validateJob(input) {
  if (!input || typeof input !== "object") throw new Error("invalid_job");
  const required = ["jobId","tenantId","kind","executionMode","target","scope","profile","authorizationRef","callbackUrl"];
  for (const key of required) if (typeof input[key] !== "string" || !input[key].trim()) throw new Error(key + "_required");
  if (!["PENTEST","RED_TEAM"].includes(input.kind)) throw new Error("invalid_kind");
  if (!["manual","automatic"].includes(input.executionMode)) throw new Error("invalid_execution_mode");
  if (!validCallback(input.callbackUrl)) throw new Error("callback_not_allowed");
  if (!/^(http|https):\/\//i.test(input.target)) throw new Error("invalid_target");
  const target = new URL(input.target);
  if (!hostAuthorized(target.hostname)) throw new Error("target_not_in_authorized_allowlist");
  if (!ALLOW_PRIVATE && isPrivateHost(target.hostname)) throw new Error("private_target_blocked");
  if (input.roeExpiresAt && Date.parse(input.roeExpiresAt) <= Date.now()) throw new Error("roe_expired");
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
    await fetch(job.callbackUrl, { method: "POST", headers, body: payload, signal: AbortSignal.timeout(15_000) });
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

async function execute(job) {
  job.status = "RUNNING";
  job.startedAt = new Date().toISOString();
  job.heartbeatAt = job.startedAt;
  job.events = [{ level: "INFO", eventType: "RUN_STARTED", message: "Authorized security scan started." }];
  await callback(job, "RUNNING", { events: job.events });

  const args = templateArgs(job);
  const child = spawn(NUCLEI_BIN, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  job.child = child;
  const findings = [];
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
  delete job.child;
  job.heartbeatAt = new Date().toISOString();

  if (job.cancelRequested) {
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
    stderr: stderr ? stderr.slice(0, 2000) : null,
  };
  job.events = [
    ...(job.events ?? []),
    {
      level: job.status === "COMPLETED" ? "SUCCESS" : job.status === "CANCELLED" ? "WARN" : "ERROR",
      eventType: "RUN_COMPLETED",
      message: "Scanner finished with status " + job.status + ".",
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

function enqueue(job) {
  jobs.set(job.jobId, job);
  queue.push(job);
  pump();
}

async function handle(req, res) {
  const url = new URL(req.url ?? "/", "http://runner.local");
  if (url.pathname === "/health") return json(res, 200, { ok: true, runner: "ELITZE", engine: "nuclei", active: [...jobs.values()].filter((j) => j.status === "RUNNING").length, queued: queue.length });
  if (!authOk(req)) return json(res, 401, { ok: false, error: "unauthorized" });
  const body = await readBody(req);
  if (!requestSignatureOk(req, body)) return json(res, 401, { ok: false, error: "invalid_signature" });

  if (req.method === "POST" && url.pathname === "/v1/jobs") {
    try {
      const job = validateJob(JSON.parse(body));
      if (jobs.has(job.jobId)) return json(res, 200, { ok: true, jobId: job.jobId, status: jobs.get(job.jobId).status });
      const record = { ...job, status: "QUEUED", createdAt: new Date().toISOString(), heartbeatAt: null, startedAt: null, completedAt: null, findings: [], events: [], result: null, cancelRequested: false };
      enqueue(record);
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
      job.cancelRequested = true;
      if (job.child) job.child.kill("SIGTERM");
      if (job.status === "QUEUED") job.status = "CANCELLED";
      return json(res, 200, { ok: true, status: job.status });
    }
  }

  return json(res, 404, { ok: false, error: "not_found" });
}

http.createServer((req, res) => {
  void handle(req, res).catch((error) => {
    console.error("runner_request_failed", error);
    json(res, 500, { ok: false, error: "runner_internal_error" });
  });
}).listen(PORT, "0.0.0.0", () => {
  console.log("ELITZE security runner listening on :" + PORT);
});
