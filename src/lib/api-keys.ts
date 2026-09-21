import crypto from "node:crypto";

export function generateApiKey() {
  const secret = crypto.randomBytes(32).toString("base64url");
  const raw = `elz_${secret}`;
  return { raw, prefix: raw.slice(0, 12), hash: crypto.createHash("sha256").update(raw).digest("hex") };
}

export function hashApiKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function authenticateApiKey(raw: string, requiredScope?: string) {
  const { getPgPool } = await import("@/db");
  const result = await getPgPool().query(
    `SELECT id, tenant_id AS "tenantId", user_id AS "userId", scopes, expires_at AS "expiresAt"
     FROM auth_api_keys
     WHERE key_hash=$1 AND revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at>now())
     LIMIT 1`,
    [hashApiKey(raw)],
  );
  const row = result.rows[0];
  if (!row) return null;
  const scopes = Array.isArray(row.scopes) ? row.scopes as string[] : [];
  if (requiredScope && !scopes.includes("*") && !scopes.includes(requiredScope)) return null;
  await getPgPool().query(`UPDATE auth_api_keys SET last_used_at=now() WHERE id=$1 AND revoked_at IS NULL`, [row.id]);
  return { id: row.id as string, tenantId: row.tenantId as string, userId: row.userId as string | null, scopes };
}
