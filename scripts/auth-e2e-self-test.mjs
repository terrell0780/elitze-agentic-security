import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const host = "127.0.0.1";
const appPort = 3010;
const origin = `http://${host}:${appPort}`;
const runId = Date.now().toString(36) + randomBytes(4).toString("hex");
const testEmail = `e2e-auth-${runId}@example.invalid`;
const primaryPassword = ["E2EAuth", runId, "PrimaryPass12"].join("-");
const resetPassword = ["E2EReset", Date.now().toString(), "ResetPass12"].join("-");

try {
  process.loadEnvFile?.(path.resolve(process.cwd(), ".env.local"));
} catch {}

let configuredDatabaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
if (!configuredDatabaseUrl && process.env.NEON_PROJECT_ID) {
  try {
    const command = process.platform === "win32" ? process.env.ComSpec : "npx";
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", "npx neonctl connection-string --project-id " + process.env.NEON_PROJECT_ID]
      : ["neonctl", "connection-string", "--project-id", process.env.NEON_PROJECT_ID];
    configuredDatabaseUrl = execFileSync(command, args, { encoding: "utf8", windowsHide: true })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .findLast((line) => line.startsWith("postgres")) || "";
  } catch {}
}
if (configuredDatabaseUrl && (!process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGHOST || !process.env.PGPORT || !process.env.PGDATABASE)) {
  const parsed = new URL(configuredDatabaseUrl);
  process.env.PGHOST ||= parsed.hostname;
  process.env.PGPORT ||= parsed.port || "5432";
  process.env.PGUSER ||= decodeURIComponent(parsed.username);
  process.env.PGPASSWORD ||= decodeURIComponent(parsed.password);
  process.env.PGDATABASE ||= decodeURIComponent(parsed.pathname.slice(1));
  process.env.PGSSLMODE ||= "require";
}

if (!process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGHOST || !process.env.PGPORT || !process.env.PGDATABASE) {
  throw new Error("PG environment or project DATABASE_URL is required for auth E2E");
}

const databaseUrl = ["postgresql:", "//", process.env.PGUSER, ":", process.env.PGPASSWORD, "@", process.env.PGHOST, ":", process.env.PGPORT, "/", process.env.PGDATABASE].join("");

let deliveredEmail;
const mailServer = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/emails") {
    response.writeHead(404);
    response.end();
    return;
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  deliveredEmail = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ id: "e2e-delivery" }));
});
mailServer.listen(0, host);
await once(mailServer, "listening");
const mailPort = mailServer.address().port;

const env = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: databaseUrl,
  NEXT_PUBLIC_SITE_URL: origin,
  ELITZE_ALLOWED_ORIGINS: origin,
  ELITZE_CONTACT_EMAIL: "tsh_cook@hotmail.com",
  ELITZE_TEAM_SESSION_SECRET: "e2e-team-session-secret-" + runId,
  ELITZE_INTEGRATION_ENCRYPTION_KEY: "a".repeat(64),
  ELITZE_EMAIL_PROVIDER: "test",
  ELITZE_EMAIL_FROM: "ELITZE E2E <e2e@example.invalid>",
  ELITZE_EMAIL_TEST_ENDPOINT: `http://${host}:${mailPort}/emails`,
};

const nextCli = path.resolve(process.cwd(), "node_modules/next/dist/bin/next");
const server = spawn(process.execPath, [nextCli, "start", "--hostname", host, "--port", String(appPort)], {
  env,
  detached: process.platform !== "win32",
  stdio: ["ignore", "pipe", "pipe"],
});
server.unref();
let serverLogs = "";
let serverExited = false;
server.stdout.on("data", (chunk) => { serverLogs += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverLogs += chunk.toString(); });
server.once("exit", () => { serverExited = true; });

const stop = async () => {
  if (!serverExited && server.pid) {
    try {
      if (process.platform === "win32") {
        server.kill("SIGTERM");
      } else {
        process.kill(-server.pid, "SIGTERM");
      }
    } catch {
      try { server.kill("SIGTERM"); } catch {}
    }

    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    if (!serverExited && server.pid) {
      try {
        if (process.platform === "win32") {
          server.kill("SIGKILL");
        } else {
          process.kill(-server.pid, "SIGKILL");
        }
      } catch {
        try { server.kill("SIGKILL"); } catch {}
      }
    }
  }

  if (mailServer.listening) {
    await new Promise((resolve) => mailServer.close(() => resolve()));
  }
};
const hardStop = () => {
  if (!serverExited && server.pid) {
    try {
      if (process.platform === "win32") server.kill("SIGTERM");
      else process.kill(-server.pid, "SIGTERM");
    } catch {}
  }
  if (mailServer.listening) {
    try { mailServer.close(); } catch {}
  }
};
process.once("exit", hardStop);

async function waitForServer() {
  let exited = false;
  let exitCode = null;
  server.once("exit", (code) => {
    exited = true;
    exitCode = code;
  });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (exited) throw new Error(`Next server exited before readiness (code ${exitCode}). Logs:\\n${serverLogs.slice(-4000)}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const response = await fetch(`${origin}/login`, { cache: "no-store", signal: controller.signal });
      if (response.ok) return;
    } catch {}
    finally {
      clearTimeout(timeout);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Next server did not become ready. Logs:\\n${serverLogs.slice(-4000)}`);
}

async function jsonWithTimeout(path, cookie) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(`${origin}${path}`, {
      headers: { cookie },
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function jsonRequest(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${origin}${path}`, {
      ...init,
      headers: {
        origin,
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  } finally {
    clearTimeout(timeout);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sessionCookie(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : (response.headers.get("set-cookie") ? [response.headers.get("set-cookie")] : []);
  return values.map((value) => value.split(";", 1)[0]).filter(Boolean).join("; ");
}

try {
  await waitForServer();
  const db = new Client({ connectionString: databaseUrl });
  await db.connect();
  try {
    const registration = await jsonRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: primaryPassword, displayName: "ELITZE E2E" }),
    });
    assert(registration.response.status === 200, `registration failed: ${registration.response.status} ${JSON.stringify(registration.body)}`);
    assert(registration.body.ok === true && registration.body.verificationRequired === true, "registration did not require verification");
    assert(deliveredEmail?.reply_to?.includes("tsh_cook@hotmail.com"), "registration email reply routing is not canonical");
    assert(deliveredEmail?.to?.includes(testEmail), "registration email recipient mismatch");
    const verificationText = String(deliveredEmail.text ?? "");
    const verificationMatch = verificationText.match(/\/auth\/verify\?token=([A-Za-z0-9_-]+)/);
    assert(verificationMatch?.[1], "verification token was not delivered");

    const beforeVerify = await db.query(
      "SELECT status, email_verified_at, tenant_id FROM auth_users WHERE email_normalized=$1",
      [testEmail],
    );
    assert(beforeVerify.rowCount === 1 && beforeVerify.rows[0].status !== "active", "new account was active before verification");

    const blockedLogin = await jsonRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: primaryPassword }),
    });
    assert(blockedLogin.response.status === 403 && blockedLogin.body.error === "email_verification_required", "unverified account was allowed to log in");

    const verification = await jsonRequest(`/api/auth/verify?token=${encodeURIComponent(verificationMatch[1])}`, {
      method: "POST",
      body: "{}",
    });
    assert(verification.response.status === 200, `verification failed: ${verification.response.status}`);
    const afterVerify = await db.query(
      "SELECT status, email_verified_at, tenant_id FROM auth_users WHERE email_normalized=$1",
      [testEmail],
    );
    assert(afterVerify.rowCount === 1 && afterVerify.rows[0].status === "active" && afterVerify.rows[0].email_verified_at, "verification did not activate the account");

    const login = await jsonRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: primaryPassword, persistent: true }),
    });
    assert(login.response.status === 200 && login.body.ok === true, `login failed: ${login.response.status} ${JSON.stringify(login.body)}`);
    let cookie = sessionCookie(login.response);
    assert(cookie.includes("elitze_session="), "login did not issue an ELITZE session cookie");

    const session = await (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        return await fetch(`${origin}/api/auth/session`, {
          headers: { cookie },
          cache: "no-store",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    })();
    const sessionBody = await session.json();
    assert(session.status === 200 && sessionBody.ok === true && sessionBody.user?.email === testEmail, "session lookup failed after login");

    const activeSession = await db.query(
      "SELECT id FROM auth_sessions WHERE user_id=(SELECT id FROM auth_users WHERE email_normalized=$1) AND revoked_at IS NULL",
      [testEmail],
    );
    assert(activeSession.rowCount >= 1, "no active database session was created");

    const resetRaw = randomBytes(32).toString("base64url");
    const resetHash = createHash("sha256").update(resetRaw).digest("hex");
    const user = afterVerify.rows[0];
    const userRecord = await db.query(
      "SELECT id, tenant_id FROM auth_users WHERE email_normalized=$1",
      [testEmail],
    );
    await db.query(
      "INSERT INTO auth_tokens (user_id, tenant_id, token_hash, purpose, kind, expires_at) VALUES ($1,$2,$3,'password_reset','password_reset',now()+interval '10 minutes')",
      [userRecord.rows[0].id, user.tenant_id, resetHash],
    );

    const reset = await jsonRequest("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token: resetRaw, password: resetPassword }),
    });
    assert(reset.response.status === 200 && reset.body.ok === true, `password reset failed: ${reset.response.status} ${JSON.stringify(reset.body)}`);

    const revoked = await db.query(
      "SELECT count(*)::int AS count FROM auth_sessions WHERE user_id=$1 AND revoked_at IS NOT NULL",
      [userRecord.rows[0].id],
    );
    assert(Number(revoked.rows[0].count) >= 1, "password reset did not revoke existing sessions");

    const oldLogin = await jsonRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: primaryPassword }),
    });
    assert(oldLogin.response.status === 401, "old password remained valid after reset");

    const newLogin = await jsonRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: testEmail, password: resetPassword }),
    });
    assert(newLogin.response.status === 200 && newLogin.body.ok === true, "new password did not authenticate");
    cookie = sessionCookie(newLogin.response);
    assert(cookie.includes("elitze_session="), "post-reset login did not issue a fresh ELITZE session cookie");

    const secondEmail = `e2e-auth-second-${Date.now()}@example.invalid`;
    const secondPassword = ["E2EAuthSecond", Date.now().toString(), "PrimaryPass12"].join("-");
    const secondRegistration = await jsonRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: secondEmail, password: secondPassword, displayName: "ELITZE E2E Second" }),
    });
    assert(secondRegistration.response.status === 200 && secondRegistration.body.ok === true, `second registration failed: ${secondRegistration.response.status}`);
    assert(deliveredEmail?.to?.includes(secondEmail), "second verification email recipient mismatch");
    const secondVerificationMatch = String(deliveredEmail.text ?? "").match(/\/auth\/verify\?token=([A-Za-z0-9_-]+)/);
    assert(secondVerificationMatch?.[1], "second verification token was not delivered");
    const secondVerification = await jsonRequest(`/api/auth/verify?token=${encodeURIComponent(secondVerificationMatch[1])}`, {
      method: "POST",
      body: "{}",
    });
    assert(secondVerification.response.status === 200, "second account verification failed");

    const secondLogin = await jsonRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: secondEmail, password: secondPassword, persistent: true }),
    });
    assert(secondLogin.response.status === 200 && secondLogin.body.ok === true, "second account login failed");
    const secondCookie = sessionCookie(secondLogin.response);
    assert(secondCookie.includes("elitze_session="), "second account did not receive a session cookie");

    const teamSession = await jsonRequest("/api/team/session", {
      method: "POST",
      headers: { cookie },
      body: "{}",
    });
    assert(teamSession.response.status === 200 && teamSession.body.ok === true, "team session bootstrap failed");
    const teamCookie = sessionCookie(teamSession.response);
    assert(teamCookie.includes("elitze_team_session="), "team session cookie was not issued");

    const channel = await jsonRequest("/api/team", {
      method: "POST",
      headers: { cookie: teamCookie },
      body: JSON.stringify({ name: `ELITZE E2E Files ${runId}`, channelType: "team" }),
    });
    assert(channel.response.status === 201 && channel.body.ok === true, "file E2E channel creation failed");

    const uploadForm = new FormData();
    uploadForm.set("channelId", String(channel.body.channel.id));
    uploadForm.append("files", new Blob(["ELITZE real file sharing E2E"], { type: "text/plain" }), "elitze-file-e2e.txt");
    const upload = await fetch(`${origin}/api/chat/files`, {
      method: "POST",
      headers: { origin, cookie },
      body: uploadForm,
    });
    const uploadBody = await upload.json();
    assert(upload.status === 201 && uploadBody.ok === true, `file upload failed: ${upload.status} ${JSON.stringify(uploadBody)}`);
    const attachmentId = uploadBody.attachments?.[0]?.id;
    const attachmentHash = uploadBody.attachments?.[0]?.sha256;
    assert(typeof attachmentId === "string" && /^[0-9a-f-]{36}$/i.test(attachmentId), "upload did not return an attachment id");

    const anonymousDownload = await fetch(`${origin}/api/chat/files/${attachmentId}`, { cache: "no-store" });
    assert(anonymousDownload.status === 401, "anonymous file download was not blocked");

    const tenantWideDownload = await fetch(`${origin}/api/chat/files/${attachmentId}`, {
      headers: { cookie },
      cache: "no-store",
    });
    assert(tenantWideDownload.status === 200, `same-tenant download failed: ${tenantWideDownload.status}`);
    const downloaded = await tenantWideDownload.text();
    assert(downloaded === "ELITZE real file sharing E2E", "downloaded file content did not match uploaded content");
    assert(tenantWideDownload.headers.get("x-elitze-sha256") === attachmentHash, "download SHA-256 digest did not match upload");

    const tenants = await db.query(
      "SELECT id, email_normalized, tenant_id FROM auth_users WHERE email_normalized IN ($1,$2) ORDER BY email_normalized",
      [testEmail, secondEmail],
    );
    assert(tenants.rowCount === 2 && tenants.rows[0].tenant_id !== tenants.rows[1].tenant_id, "accounts did not receive isolated tenants");

    const tenantA = tenants.rows.find((row) => row.email_normalized === testEmail);
    const tenantB = tenants.rows.find((row) => row.email_normalized === secondEmail);
    assert(tenantA?.tenant_id && tenantB?.tenant_id, "tenant ids missing");

    const seed = async ({ tenantId, suffix }) => {
      const nodeHash = createHash("sha256").update(`ci:tenant-isolation-node:${suffix}`).digest("hex");
      await db.query(
        `INSERT INTO security_graph_nodes
          (tenant_id,node_type,subject_key,display_name,source,evidence_state,source_ref,observed_at,metadata,content_hash)
         VALUES ($1,'EVIDENCE_RECORD',$2,$3,'ci-tenant-isolation','UNKNOWN','ci:tenant-isolation:${suffix}',now(),'{}'::jsonb,$4)
         ON CONFLICT (tenant_id,node_type,subject_key) DO UPDATE SET display_name=EXCLUDED.display_name, content_hash=EXCLUDED.content_hash`,
        [tenantId, `ci-only:${suffix}`, `CI-only tenant record ${suffix}`, nodeHash],
      );

      const agent = await db.query(
        `INSERT INTO agent_identities
          (tenant_id,name,kind,identity_fingerprint,token_hash,token_prefix)
         VALUES ($1,$2,'AGENT',$3,$4,$5)
         ON CONFLICT (tenant_id,identity_fingerprint) DO UPDATE SET name=EXCLUDED.name
         RETURNING id`,
        [tenantId, `ci-agent-${suffix}`, `ci-fingerprint-${suffix}`, `ci-token-${suffix}-${tenantId}`, `ci-${suffix}`],
      );
      const server = await db.query(
        `INSERT INTO mcp_gateway_servers
          (tenant_id,agent_identity_id,name,endpoint_url)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (tenant_id,name) DO UPDATE SET endpoint_url=EXCLUDED.endpoint_url
         RETURNING id`,
        [tenantId, agent.rows[0].id, `ci-server-${suffix}`, "https://example.invalid/e2e"],
      );
      const evidenceHash = createHash("sha256").update(`ci:tenant-isolation-evidence:${suffix}`).digest("hex");
      await db.query(
        `INSERT INTO mcp_gateway_decisions
          (tenant_id,request_id,agent_identity_id,gateway_server_id,tool_name,action,decision,policy_version,evidence_hash,evidence_signature,previous_evidence_hash,decision_ref,evidence_source,evidence_state,source_ref,observed_at,evidence_event,verification_status)
         VALUES ($1,$2,$3,$4,'ci.test','ci.test','DENY','ci-e2e',$5,'ci-signature',NULL,$6,'ci-tenant-isolation','SIMULATED',$7,now(),'{}'::jsonb,'FAILED')`,
        [tenantId, `ci-request-${suffix}`, agent.rows[0].id, server.rows[0].id, evidenceHash, `ci-decision-${suffix}`, `ci:tenant-isolation-evidence:${suffix}`],
      );
      return { nodeKey: `ci-only:${suffix}`, decisionRef: `ci-decision-${suffix}` };
    };

    const fixtureA = await seed({ tenantId: tenantA.tenant_id, suffix: `A-${runId}` });
    const fixtureB = await seed({ tenantId: tenantB.tenant_id, suffix: `B-${runId}` });

    const graphA = await jsonWithTimeout("/api/console/security-graph", cookie);
    const graphABody = await graphA.json();
    assert(graphA.status === 200 && graphABody.ok === true, `tenant A security graph request failed: ${graphA.status} ${JSON.stringify(graphABody)}`);
    assert(graphABody.nodes.some((node) => node.subjectKey === fixtureA.nodeKey), "tenant A graph data missing");
    assert(!graphABody.nodes.some((node) => node.subjectKey === fixtureB.nodeKey), "tenant A graph exposed tenant B data");

    const graphB = await jsonWithTimeout("/api/console/security-graph", secondCookie);
    const graphBBody = await graphB.json();
    assert(graphB.status === 200 && graphBBody.ok === true, `tenant B security graph request failed: ${graphB.status} ${JSON.stringify(graphBBody)}`);
    assert(graphBBody.nodes.some((node) => node.subjectKey === fixtureB.nodeKey), "tenant B graph data missing");
    assert(!graphBBody.nodes.some((node) => node.subjectKey === fixtureA.nodeKey), "tenant B graph exposed tenant A data");

    const evidenceA = await jsonWithTimeout("/api/console/evidence-debugger", cookie);
    const evidenceABody = await evidenceA.json();
    assert(evidenceA.status === 200 && evidenceABody.ok === true, `tenant A evidence request failed: ${evidenceA.status} ${JSON.stringify(evidenceABody)}`);
    assert(evidenceABody.records.some((record) => record.decisionRef === fixtureA.decisionRef), "tenant A evidence missing");
    assert(!evidenceABody.records.some((record) => record.decisionRef === fixtureB.decisionRef), "tenant A evidence exposed tenant B data");

    const evidenceB = await jsonWithTimeout("/api/console/evidence-debugger", secondCookie);
    const evidenceBBody = await evidenceB.json();
    assert(evidenceB.status === 200 && evidenceBBody.ok === true, `tenant B evidence request failed: ${evidenceB.status} ${JSON.stringify(evidenceBBody)}`);
    assert(evidenceBBody.records.some((record) => record.decisionRef === fixtureB.decisionRef), "tenant B evidence missing");
    assert(!evidenceBBody.records.some((record) => record.decisionRef === fixtureA.decisionRef), "tenant B evidence exposed tenant A data");

    console.log("ELITZE real-auth E2E: PASS — clean PostgreSQL account creation, verification email contract, verification, login, database session creation, password reset, session revocation, and cross-tenant graph/evidence isolation verified");
  } finally {
    await db.end();
  }
} finally {
  await stop();
  process.off("exit", hardStop);
}
