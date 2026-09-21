import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { decryptAuthSecret, generateRecoveryCodes, hashRecoveryCode, verifyTotp } from "@/lib/auth-mfa";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });
    const body = await request.json() as { factorId?: unknown; code?: unknown };
    if (typeof body.factorId !== "string" || typeof body.code !== "string") return Response.json({ error: "invalid_mfa_request" }, { status: 400 });

    const result = await getPgPool().query(
      `SELECT id, secret_ciphertext FROM auth_mfa_factors
       WHERE id=$1 AND user_id=$2 AND tenant_id=$3 AND factor_type='totp' AND revoked_at IS NULL AND enabled_at IS NULL LIMIT 1`,
      [body.factorId, user.id, user.tenantId],
    );
    const factor = result.rows[0];
    if (!factor || !verifyTotp(decryptAuthSecret(factor.secret_ciphertext), body.code)) {
      return Response.json({ error: "invalid_mfa_code" }, { status: 401 });
    }

    const recoveryCodes = generateRecoveryCodes();
    const db = getPgPool();
    await db.query("BEGIN");
    try {
      await db.query(`UPDATE auth_mfa_factors SET enabled_at=now() WHERE id=$1 AND user_id=$2 AND tenant_id=$3`, [body.factorId, user.id, user.tenantId]);
      await db.query(`UPDATE auth_users SET mfa_required=true, mfa_enrolled_at=now(), updated_at=now() WHERE id=$1 AND tenant_id=$2`, [user.id, user.tenantId]);
      await db.query(`DELETE FROM auth_recovery_codes WHERE user_id=$1 AND tenant_id=$2 AND consumed_at IS NULL`, [user.id, user.tenantId]);
      for (const code of recoveryCodes) {
        await db.query(`INSERT INTO auth_recovery_codes (user_id,tenant_id,code_hash) VALUES ($1,$2,$3)`, [user.id, user.tenantId, hashRecoveryCode(code)]);
      }
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
    return Response.json({ ok: true, recoveryCodes });
  } catch (error) {
    console.error("ELITZE MFA enrollment verification failed", error);
    return Response.json({ error: "mfa_unavailable" }, { status: 503 });
  }
}
