import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const host = "127.0.0.1";
const appPort = 3010;
const origin = `http://${host}:${appPort}`;
const testEmail = `e2e-auth-${Date.now()}@example.invalid`;
const primaryPassword = ["E2EAuth", Date.now().toString(), "PrimaryPass12"].join("-");
const resetPassword = ["E2EReset", Date.now().toString(), "ResetPass12"].join("-");
const databaseUrl = ["postgresql:", "//", process.env.PGUSER, ":", process.env.PGPASSWORD, "@", process.env.PGHOST, ":", process.env.PGPORT, "/", process.env.PGDATABASE].join("");

if (!process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGHOST || !process.env.PGPORT || !process.env.PGDATABASE) {
  throw new Error("PG environment is required for auth E2E");
}

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
  RESEND_API_KEY: "e2e-key",
  RESEND_FROM: "ELITZE E2E <e2e@example.invalid>",
  RESEND_API_URL: `http://${host}:${mailPort}/emails`,
};

const server = spawn("npm", ["run", "start", "--", "--hostname", host, "--port", String(appPort)], {
  env,
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLogs = "";
server.stdout.on("data", (chunk) => { serverLogs += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverLogs += chunk.toString(); });

const stop = () => {
  if (!server.killed) server.kill("SIGTERM");
  if (mailServer.listening) mailServer.close();
};
process.on("exit", stop);

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

async function jsonRequest(path, init = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers: {
      origin,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
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
    const cookie = sessionCookie(login.response);
    assert(cookie.includes("elitze_session="), "login did not issue an ELITZE session cookie");

    const session = await fetch(`${origin}/api/auth/session`, {
      headers: { cookie },
      cache: "no-store",
    });
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
      "INSERT INTO auth_tokens (user_id, tenant_id, token_hash, purpose, expires_at) VALUES ($1,$2,$3,'password_reset',now()+interval '10 minutes')",
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

    console.log("ELITZE real-auth E2E: PASS — clean PostgreSQL account creation, verification email contract, verification, login, database session creation, password reset, and session revocation verified");
  } finally {
    await db.end();
  }
} finally {
  stop();
}
