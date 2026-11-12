import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getPgPool } from "@/db";
import { productionConfig } from "@/config/production";
import { isReservedNonDeliverableEmail } from "@/lib/elitze-secure/auth-email-policy";

const SESSION_COOKIE = "elitze_session";
const PERSISTENT_DAYS = 30;
const NON_PERSISTENT_DAYS = 1;
const SESSION_IDLE_HOURS = 12;
const SESSION_ROTATION_HOURS = 24;
const PASSWORD_MIN = 12;
const RATE_WINDOW_SECONDS = 15 * 60;
const TIMING_SAFE_FALLBACK_HASH = "scrypt$16384$8$1$fixed-elitze-timing-salt$1QW9Zfy7_xUt37q5OriffuvgMKnlAqlCu2b-M6LxnCBx82L5WdVeFJchv1_r9OBA1mc6CcPKXY03CwBE4qIdGw";

type ScryptResult = Buffer<ArrayBuffer>;

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  sessionId?: string;
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

function assertPassword(password: string) {
  if (password.length < PASSWORD_MIN || password.length > 256) {
    throw new Error("password_policy");
  }
}

function scryptAsync(
  password: string,
  salt: string,
  keyLength: number,
  options: ScryptOptions,
): Promise<ScryptResult> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Buffer.from(derivedKey));
    });
  });
}

async function hashPassword(password: string) {
  assertPassword(password);
  const salt = randomBytes(16).toString("base64url");
  const derived = await scryptAsync(password, salt, 64, { N: 16_384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derived.toString("base64url")}`;
}

async function verifyPassword(password: string, encoded: string) {
  const [scheme, n, r, p, salt, encodedKey] = encoded.split("$");
  if (scheme !== "scrypt" || n !== "16384" || r !== "8" || p !== "1" || !salt || !encodedKey) {
    return false;
  }

  const expected = Buffer.from(encodedKey, "base64url");
  const actual = await scryptAsync(password, salt, expected.length, { N: 16_384, r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function clientMeta() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const trustProxy = process.env.ELITZE_TRUST_PROXY === "true";
  const ip = trustProxy
    ? (forwarded?.split(",").map((value) => value.trim()).filter(Boolean).at(-1) ?? requestHeaders.get("x-real-ip") ?? "unknown")
    : "unknown";
  return {
    ip,
    ua: requestHeaders.get("user-agent") ?? "unknown",
  };
}

function normalizeHostHeader(value: string | null) {
  const host = value?.split(",")[0]?.trim().toLowerCase();
  if (!host || /[\s/\\@]/.test(host)) return "";
  try {
    return new URL(`https://${host}`).host;
  } catch {
    return "";
  }
}

function requestHeadersHost(request: Request) {
  // Forwarded headers are only trustworthy when a trusted edge strips and
  // rewrites them. The application cannot establish that from the request,
  // so use the origin-facing Host header for same-origin fallback checks.
  return normalizeHostHeader(request.headers.get("host"));
}

export async function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let requestOrigin: URL;
  try {
    requestOrigin = new URL(origin);
  } catch {
    return false;
  }

  if (requestOrigin.protocol !== "http:" && requestOrigin.protocol !== "https:") return false;

  if (requestOrigin.origin === productionConfig.canonicalOrigin) return true;

  const requestHost = requestHeadersHost(request);
  if (requestHost && requestOrigin.host === requestHost) return true;

  return productionConfig.allowedOrigins.some((allowedOrigin) => {
    try {
      return requestOrigin.origin === new URL(allowedOrigin).origin;
    } catch {
      return false;
    }
  });
}

export async function getRateLimitKey(scope: string, identifier?: string) {
  const meta = await clientMeta();
  return `${scope}:${meta.ip}:${identifier ?? ""}`;
}

export async function consumeRateLimit(bucket: string, maxAttempts: number, windowSeconds = RATE_WINDOW_SECONDS) {
  const result = await getPgPool().query(
    `INSERT INTO auth_rate_limits (bucket,attempts,window_started_at)
     VALUES ($1,1,now())
     ON CONFLICT (bucket) DO UPDATE SET
       attempts = CASE
         WHEN auth_rate_limits.window_started_at <= now() - make_interval(secs => $2::double precision) THEN 1
         ELSE auth_rate_limits.attempts + 1
       END,
       window_started_at = CASE
         WHEN auth_rate_limits.window_started_at <= now() - make_interval(secs => $2::double precision) THEN now()
         ELSE auth_rate_limits.window_started_at
       END
     RETURNING attempts`,
    [digest(bucket), windowSeconds],
  );
  return Number(result.rows[0]?.attempts ?? maxAttempts + 1) <= maxAttempts;
}

function cookieOptions(expires: Date) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
    expires,
    priority: "high" as const,
  };
}

export async function issueMfaLoginChallenge(user: AuthUser) {
  const raw = newToken();
  const expires = new Date(Date.now() + 5 * 60_000);
  await getPgPool().query(
    `INSERT INTO auth_challenges (user_id, tenant_id, purpose, challenge_hash, expires_at)
     VALUES ($1,$2,'mfa_login',$3,$4)`,
    [user.id, user.tenantId, digest(raw), expires.toISOString()],
  );
  (await cookies()).set("elitze_mfa_challenge", raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    expires,
  });
  return expires;
}

export async function consumeMfaLoginChallenge(raw: string) {
  const result = await getPgPool().query(
    `UPDATE auth_challenges
     SET consumed_at=now()
     WHERE challenge_hash=$1 AND purpose='mfa_login' AND consumed_at IS NULL AND expires_at>now()
     RETURNING user_id AS "userId", tenant_id AS "tenantId"`,
    [digest(raw)],
  );
  return result.rows[0] as { userId: string; tenantId: string } | undefined;
}

export async function createSession(user: AuthUser, persistent = true) {
  const raw = newToken();
  const expires = new Date(
    Date.now() + (persistent ? PERSISTENT_DAYS : NON_PERSISTENT_DAYS) * 86_400_000,
  );
  const meta = await clientMeta();

  await getPgPool().query(
    `INSERT INTO auth_sessions
      (user_id, tenant_id, token_hash, persistent, expires_at, ip_hash, user_agent_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      user.id,
      user.tenantId,
      digest(raw),
      persistent,
      expires.toISOString(),
      digest(meta.ip),
      digest(meta.ua),
    ],
  );

  (await cookies()).set(SESSION_COOKIE, raw, cookieOptions(expires));
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const db = getPgPool();
  const result = await db.query(
    `SELECT
       u.id,
       u.tenant_id AS "tenantId",
       u.email,
       u.display_name AS "displayName",
       u.role,
       u.status,
       s.id AS session_id,
       s.expires_at,
       s.created_at,
       s.last_seen_at,
       s.persistent
     FROM auth_sessions s
     JOIN auth_users u ON u.id=s.user_id
     WHERE s.token_hash=$1
       AND s.revoked_at IS NULL
       AND s.expires_at>now()
     LIMIT 1`,
    [digest(raw)],
  );

  const row = result.rows[0] as
    | (AuthUser & {
        session_id: string;
        expires_at: string;
        created_at: string;
        last_seen_at: string;
        persistent: boolean;
      })
    | undefined;

  if (!row || row.status !== "active") return null;
  if (isReservedNonDeliverableEmail(row.email)) {
    await db.query(
      "UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL",
      [row.session_id],
    );
    (await cookies()).delete(SESSION_COOKIE);
    return null;
  }

  const now = Date.now();
  const absoluteLifetime = (row.persistent ? PERSISTENT_DAYS : NON_PERSISTENT_DAYS) * 86_400_000;
  const createdAt = new Date(row.created_at).getTime();
  const lastSeenAt = new Date(row.last_seen_at).getTime();

  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSeenAt) ||
      now - createdAt >= absoluteLifetime || now - lastSeenAt >= SESSION_IDLE_HOURS * 3_600_000) {
    await db.query(`UPDATE auth_sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL`, [row.session_id]);
    (await cookies()).delete(SESSION_COOKIE);
    return null;
  }

  if (now - createdAt >= SESSION_ROTATION_HOURS * 3_600_000) {
    const rotated = newToken();
    const remaining = Math.max(1, createdAt + absoluteLifetime - now);
    const next = new Date(now + remaining);
    await db.query(
      `UPDATE auth_sessions SET token_hash=$1,last_seen_at=now(),expires_at=$2 WHERE id=$3 AND revoked_at IS NULL`,
      [digest(rotated), next.toISOString(), row.session_id],
    );
    (await cookies()).set(SESSION_COOKIE, rotated, cookieOptions(next));
    return {
      id: row.id,
      tenantId: row.tenantId,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      status: row.status,
      sessionId: row.session_id,
    };
  }

  if (row.persistent && new Date(row.expires_at).getTime() - now < 7 * 86_400_000) {
    const next = new Date(Math.min(createdAt + absoluteLifetime, now + PERSISTENT_DAYS * 86_400_000));
    await db.query(
      `UPDATE auth_sessions SET expires_at=$1,last_seen_at=now() WHERE id=$2 AND revoked_at IS NULL`,
      [next.toISOString(), row.session_id],
    );
    (await cookies()).set(SESSION_COOKIE, raw, cookieOptions(next));
  } else {
    await db.query(`UPDATE auth_sessions SET last_seen_at=now() WHERE id=$1 AND revoked_at IS NULL`, [row.session_id]);
  }

  return {
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
    sessionId: row.session_id,
  };
}

export async function logout() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await getPgPool().query(
      `UPDATE auth_sessions
       SET revoked_at=now()
       WHERE token_hash=$1 AND revoked_at IS NULL`,
      [digest(raw)],
    );
  }
  jar.delete(SESSION_COOKIE);
}

export async function issuePrivilegedReauthChallenge(user: AuthUser) {
  if (!user.sessionId) throw new Error("session_required");
  const raw = newToken();
  const expires = new Date(Date.now() + 10 * 60_000);
  await getPgPool().query(
    `INSERT INTO auth_privileged_reauth (user_id,tenant_id,session_id,challenge_hash,expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [user.id, user.tenantId, user.sessionId, digest(raw), expires.toISOString()],
  );
  await getPgPool().query(
    `UPDATE auth_privileged_reauth
     SET satisfied_at=now()
     WHERE challenge_hash=$1 AND user_id=$2 AND tenant_id=$3 AND session_id=$4 AND satisfied_at IS NULL`,
    [digest(raw), user.id, user.tenantId, user.sessionId],
  );
  (await cookies()).set("elitze_reauth", raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    expires,
  });
  return expires;
}

export async function consumePrivilegedReauth(user: AuthUser) {
  const jar = await cookies();
  const raw = jar.get("elitze_reauth")?.value;
  if (!raw || !user.sessionId) return false;
  const result = await getPgPool().query(
    `DELETE FROM auth_privileged_reauth
     WHERE challenge_hash=$1 AND user_id=$2 AND tenant_id=$3 AND session_id=$4
       AND satisfied_at IS NOT NULL AND expires_at>now()
     RETURNING id`,
    [digest(raw), user.id, user.tenantId, user.sessionId],
  );
  if (result.rowCount === 1) jar.delete("elitze_reauth");
  return result.rowCount === 1;
}

export async function registerUser(
  email: string,
  password: string,
  displayName?: string,
  organizationName?: string,
  organizationSlug?: string,
) {
  const normalized = normalizeEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(normalized) || isReservedNonDeliverableEmail(normalized)) {
    throw new Error("invalid_email");
  }

  const passwordHash = await hashPassword(password);
  const tenantName = organizationName?.trim() || `${normalized.split("@")[0]}'s organization`;
  const tenantSlug = organizationSlug?.trim().toLowerCase() || `tenant-${randomBytes(8).toString("hex")}`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantSlug)) throw new Error("organization_slug_policy");
  const client = await getPgPool().connect();
  try {
    await client.query("BEGIN");
    // Serialize same-email registrations and invitation acceptance across tenant creation paths.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [normalized]);
    const existing = await client.query(
      `SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status
       FROM auth_users WHERE email_normalized=$1 LIMIT 1`,
      [normalized],
    );
    const existingUser = existing.rows[0] as AuthUser | undefined;
    if (existingUser) {
      // Active accounts must not re-enter the registration path. Pending
      // accounts are returned so the caller can re-issue the verification
      // email instead of stranding the user on a 409 they can never resolve.
      if (existingUser.status === "active") throw new Error("email_already_active");
      await client.query("COMMIT");
      return existingUser;
    }

    const result = await client.query(
      `WITH new_tenant AS (
         INSERT INTO auth_tenants (name,slug)
         VALUES ($1,$2)
         RETURNING id
       )
       INSERT INTO auth_users
         (tenant_id,email,email_normalized,password_hash,display_name,role)
       SELECT id,$3,$3,$4,$5,'owner'
       FROM new_tenant
       RETURNING
         id,
         tenant_id AS "tenantId",
         email,
         display_name AS "displayName",
         role,
         status`,
      [
        tenantName,
        tenantSlug,
        normalized,
        passwordHash,
        displayName?.trim() || null,
      ],
    );
    await client.query("COMMIT");
    return result.rows[0] as AuthUser;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function authenticate(email: string, password: string) {
  const normalized = normalizeEmail(email);
  if (isReservedNonDeliverableEmail(normalized)) {
    await verifyPassword(password, TIMING_SAFE_FALLBACK_HASH);
    return null;
  }
  const db = getPgPool();
  const result = await db.query(
    `SELECT
       id,
       tenant_id AS "tenantId",
       email,
       display_name AS "displayName",
       role,
       status,
       password_hash AS "passwordHash",
       failed_login_count AS "failedLoginCount",
       locked_until AS "lockedUntil"
     FROM auth_users
     WHERE email_normalized=$1
     LIMIT 1`,
    [normalized],
  );

  const row = result.rows[0] as
    | (AuthUser & {
        passwordHash: string;
        failedLoginCount: number;
        lockedUntil: string | null;
      })
    | undefined;

  if (!row) {
    await verifyPassword(password, TIMING_SAFE_FALLBACK_HASH);
    return null;
  }
  if (row.lockedUntil && new Date(row.lockedUntil).getTime() > Date.now()) {
    await verifyPassword(password, TIMING_SAFE_FALLBACK_HASH);
    return null;
  }

  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) {
    const count = row.failedLoginCount + 1;
    const lock = count >= 10 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
    await db.query(
      `UPDATE auth_users
       SET failed_login_count=$1,locked_until=$2,updated_at=now()
       WHERE id=$3`,
      [count >= 10 ? 0 : count, lock, row.id],
    );
    return null;
  }

  await db.query(
    `UPDATE auth_users
     SET failed_login_count=0,locked_until=NULL,last_login_at=now(),updated_at=now()
     WHERE id=$1`,
    [row.id],
  );

  return {
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
  };
}

export async function verifyEmailToken(raw: string): Promise<AuthUser | null> {
  const record = await consumeToken(raw, "email_verification");
  if (!record) return null;
  const result = await getPgPool().query(
    `UPDATE auth_users
     SET status='active', email_verified_at=now(), updated_at=now()
     WHERE id=$1 AND tenant_id=$2
     RETURNING id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status`,
    [record.userId, record.tenantId],
  );
  return (result.rows[0] as AuthUser | undefined) ?? null;
}

export async function requestPasswordRecovery(emailInput: string): Promise<string | null> {
  const email = normalizeEmail(emailInput);
  if (isReservedNonDeliverableEmail(email)) return null;
  const [user] = (await (async () => {
    const result = await getPgPool().query(
      `SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status
       FROM auth_users WHERE email_normalized=$1 AND status='active' LIMIT 1`,
      [email],
    );
    return result.rows;
  })()) as AuthUser[];
  if (!user) return null;
  return issueEmailToken(user, "password_reset", 60);
}

export async function issueEmailToken(
  user: AuthUser,
  purpose: "email_verification" | "password_reset",
  ttlMinutes: number,
) {
  const raw = newToken();
  const db = getPgPool();
  await db.query(
    `DELETE FROM auth_tokens
     WHERE user_id=$1 AND purpose=$2 AND consumed_at IS NULL`,
    [user.id, purpose],
  );
  await db.query(
    `INSERT INTO auth_tokens
      (user_id,tenant_id,token_hash,purpose,kind,expires_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      user.id,
      user.tenantId,
      digest(raw),
      purpose,
      purpose,
      new Date(Date.now() + ttlMinutes * 60_000).toISOString(),
    ],
  );
  return raw;
}

export async function consumeToken(
  raw: string,
  purpose: "email_verification" | "password_reset",
) {
  const result = await getPgPool().query(
    `UPDATE auth_tokens
     SET consumed_at=now()
     WHERE token_hash=$1
       AND purpose=$2
       AND consumed_at IS NULL
       AND expires_at>now()
     RETURNING user_id AS "userId",tenant_id AS "tenantId"`,
    [digest(raw), purpose],
  );
  return result.rows[0] as { userId: string; tenantId: string } | undefined;
}

export { hashPassword, verifyPassword, SESSION_COOKIE };
