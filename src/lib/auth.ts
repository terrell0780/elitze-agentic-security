import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { getDb } from "@/db";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "elitze_session";
const PERSISTENT_DAYS = 30;
const ABSOLUTE_DAYS = 90;
const PASSWORD_MIN = 12;

export type AuthUser = { id: string; tenantId: string; email: string; displayName: string | null; role: string; status: string };

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function token() { return randomBytes(32).toString("base64url"); }
function assertPassword(password: string) {
  if (password.length < PASSWORD_MIN || password.length > 256) throw new Error("password_policy");
}

async function hashPassword(password: string) {
  assertPassword(password);
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 })) as Buffer;
  return `scrypt$16384$8$1$${salt}$${derived.toString("base64url")}`;
}

async function verifyPassword(password: string, encoded: string) {
  const [scheme, n, r, p, salt, encodedKey] = encoded.split("$");
  if (scheme !== "scrypt" || n !== "16384" || r !== "8" || p !== "1" || !salt || !encodedKey) return false;
  const expected = Buffer.from(encodedKey, "base64url");
  const actual = (await scrypt(password, salt, expected.length, { N: 16384, r: 8, p: 1 })) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function clientMeta() {
  return headers().then((h) => ({ ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown", ua: h.get("user-agent") ?? "unknown" }));
}

export async function createSession(user: AuthUser, persistent = true) {
  const raw = token();
  const now = Date.now();
  const maxMs = Math.min(persistent ? PERSISTENT_DAYS : 1, ABSOLUTE_DAYS) * 86400000;
  const expires = new Date(now + maxMs);
  const meta = await clientMeta();
  const db = getDb();
  await db.query(`INSERT INTO auth_sessions (user_id, tenant_id, token_hash, persistent, expires_at, ip_hash, user_agent_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [user.id, user.tenantId, digest(raw), persistent, expires.toISOString(), digest(meta.ip), digest(meta.ua)]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires, priority: "high" });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const db = getDb();
  const result = await db.query(`SELECT u.id, u.tenant_id AS "tenantId", u.email, u.display_name AS "displayName", u.role, u.status, s.id AS session_id, s.expires_at, s.persistent FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > now() LIMIT 1`, [digest(raw)]);
  const row = result.rows[0] as (AuthUser & { session_id: string; expires_at: string; persistent: boolean }) | undefined;
  if (!row || row.status !== "active") return null;
  const remaining = new Date(row.expires_at).getTime() - Date.now();
  if (row.persistent && remaining < 7 * 86400000) {
    const next = new Date(Date.now() + PERSISTENT_DAYS * 86400000);
    await db.query(`UPDATE auth_sessions SET expires_at=$1, last_seen_at=now() WHERE id=$2`, [next.toISOString(), row.session_id]);
    (await cookies()).set(SESSION_COOKIE, raw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: next, priority: "high" });
  } else {
    await db.query(`UPDATE auth_sessions SET last_seen_at=now() WHERE id=$1`, [row.session_id]);
  }
  return { id: row.id, tenantId: row.tenantId, email: row.email, displayName: row.displayName, role: row.role, status: row.status };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  return user;
}

export async function logout() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) await getDb().query(`UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL`, [digest(raw)]);
  jar.delete(SESSION_COOKIE);
}

export async function registerUser(email: string, password: string, displayName?: string) {
  const normalized = normalizeEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error("invalid_email");
  const passwordHash = await hashPassword(password);
  const db = getDb();
  const tenantSlug = `tenant-${randomBytes(8).toString("hex")}`;
  const result = await db.query(`WITH new_tenant AS (INSERT INTO auth_tenants (name, slug) VALUES ($1,$2) RETURNING id) INSERT INTO auth_users (tenant_id,email,email_normalized,password_hash,display_name) SELECT id,$3,$3,$4,$5 FROM new_tenant RETURNING id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status`, [displayName?.trim() || `${normalized.split("@")[0]}'s organization`, tenantSlug, normalized, passwordHash, displayName?.trim() || null]);
  return result.rows[0] as AuthUser;
}

export async function authenticate(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const db = getDb();
  const result = await db.query(`SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status, password_hash AS "passwordHash", failed_login_count AS "failedLoginCount", locked_until AS "lockedUntil" FROM auth_users WHERE email_normalized=$1 LIMIT 1`, [normalized]);
  const row = result.rows[0] as (AuthUser & { passwordHash: string; failedLoginCount: number; lockedUntil: string | null }) | undefined;
  if (!row) return null;
  if (row.lockedUntil && new Date(row.lockedUntil).getTime() > Date.now()) return null;
  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) {
    const count = row.failedLoginCount + 1;
    const lock = count >= 10 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
    await db.query(`UPDATE auth_users SET failed_login_count=$1, locked_until=$2, updated_at=now() WHERE id=$3`, [count >= 10 ? 0 : count, lock, row.id]);
    return null;
  }
  if (row.status !== "active") return { ...row, passwordHash: undefined } as unknown as AuthUser;
  await db.query(`UPDATE auth_users SET failed_login_count=0, locked_until=NULL, last_login_at=now(), updated_at=now() WHERE id=$1`, [row.id]);
  return { id: row.id, tenantId: row.tenantId, email: row.email, displayName: row.displayName, role: row.role, status: row.status };
}

export async function issueEmailToken(user: AuthUser, purpose: "email_verification" | "password_reset", ttlMinutes: number) {
  const raw = token();
  await getDb().query(`DELETE FROM auth_tokens WHERE user_id=$1 AND purpose=$2 AND consumed_at IS NULL`, [user.id, purpose]);
  await getDb().query(`INSERT INTO auth_tokens (user_id,tenant_id,token_hash,purpose,expires_at) VALUES ($1,$2,$3,$4,$5)`, [user.id, user.tenantId, digest(raw), purpose, new Date(Date.now() + ttlMinutes * 60000).toISOString()]);
  return raw;
}

export async function consumeToken(raw: string, purpose: "email_verification" | "password_reset") {
  const result = await getDb().query(`UPDATE auth_tokens SET consumed_at=now() WHERE token_hash=$1 AND purpose=$2 AND consumed_at IS NULL AND expires_at>now() RETURNING user_id AS "userId", tenant_id AS "tenantId"`, [digest(raw), purpose]);
  return result.rows[0] as { userId: string; tenantId: string } | undefined;
}

export { normalizeEmail, hashPassword, SESSION_COOKIE };
