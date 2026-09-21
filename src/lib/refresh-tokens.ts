import crypto from "node:crypto";
import { getPgPool } from "@/db";
import type { AuthUser } from "@/lib/auth";

const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function issueRefreshToken(user: AuthUser, familyId = crypto.randomUUID()) {
  const raw = crypto.randomBytes(48).toString("base64url");
  const expires = new Date(Date.now() + 30 * 86_400_000);
  await getPgPool().query(
    `INSERT INTO auth_refresh_tokens (user_id,tenant_id,token_hash,family_id,expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [user.id, user.tenantId, digest(raw), familyId, expires.toISOString()],
  );
  return { raw, familyId, expires };
}

export async function rotateRefreshToken(raw: string) {
  const db = getPgPool();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT rt.id, rt.user_id AS "userId", rt.tenant_id AS "tenantId", rt.family_id AS "familyId",
              rt.expires_at AS "expiresAt", rt.replaced_at AS "replacedAt", rt.revoked_at AS "revokedAt",
              u.email, u.display_name AS "displayName", u.role, u.status
       FROM auth_refresh_tokens rt
       JOIN auth_users u ON u.id=rt.user_id AND u.tenant_id=rt.tenant_id
       WHERE rt.token_hash=$1 LIMIT 1 FOR UPDATE`,
      [digest(raw)],
    );
    const row = result.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return null;
    }
    if (row.replacedAt || row.revokedAt) {
      await client.query(`UPDATE auth_refresh_tokens SET revoked_at=COALESCE(revoked_at,now()) WHERE family_id=$1 AND revoked_at IS NULL`, [row.familyId]);
      await client.query("COMMIT");
      return null;
    }
    if (new Date(row.expiresAt).getTime() <= Date.now() || row.status !== "active") {
      await client.query(`UPDATE auth_refresh_tokens SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL`, [row.id]);
      await client.query("COMMIT");
      return null;
    }

    const nextRaw = crypto.randomBytes(48).toString("base64url");
    const nextExpires = new Date(Date.now() + 30 * 86_400_000);
    await client.query(`UPDATE auth_refresh_tokens SET replaced_at=now() WHERE id=$1`, [row.id]);
    await client.query(
      `INSERT INTO auth_refresh_tokens (user_id,tenant_id,token_hash,family_id,expires_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [row.userId, row.tenantId, digest(nextRaw), row.familyId, nextExpires.toISOString()],
    );
    await client.query("COMMIT");
    return {
      token: nextRaw,
      user: {
        id: row.userId,
        tenantId: row.tenantId,
        email: row.email,
        displayName: row.displayName,
        role: row.role,
        status: row.status,
      } satisfies AuthUser,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeRefreshToken(raw: string) {
  const result = await getPgPool().query(
    `UPDATE auth_refresh_tokens SET revoked_at=now()
     WHERE token_hash=$1 AND revoked_at IS NULL RETURNING family_id`,
    [digest(raw)],
  );
  if (!result.rowCount) return false;
  await getPgPool().query(`UPDATE auth_refresh_tokens SET revoked_at=now() WHERE family_id=$1 AND revoked_at IS NULL`, [result.rows[0].family_id]);
  return true;
}
