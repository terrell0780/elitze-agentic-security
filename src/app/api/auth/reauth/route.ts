import { assertSameOrigin, getCurrentUser, issuePrivilegedReauthChallenge, verifyPassword } from "@/lib/auth";
import { decryptAuthSecret, hashRecoveryCode, verifyTotp } from "@/lib/auth-mfa";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });
    const body = await request.json() as { password?: unknown; code?: unknown };
    if (typeof body.password !== "string") return Response.json({ error: "reauthentication_required" }, { status: 401 });

    const userResult = await getPgPool().query(
      `SELECT password_hash AS "passwordHash", mfa_required FROM auth_users WHERE id=$1 AND tenant_id=$2 AND status='active' LIMIT 1`,
      [user.id, user.tenantId],
    );
    const row = userResult.rows[0];
    if (!row || !(await verifyPassword(body.password, row.passwordHash))) {
      return Response.json({ error: "reauthentication_failed" }, { status: 401 });
    }

    if (row.mfa_required) {
      if (typeof body.code !== "string") return Response.json({ error: "mfa_required" }, { status: 401 });
      const factor = await getPgPool().query(
        `SELECT secret_ciphertext FROM auth_mfa_factors
         WHERE user_id=$1 AND tenant_id=$2 AND factor_type='totp' AND enabled_at IS NOT NULL AND revoked_at IS NULL LIMIT 1`,
        [user.id, user.tenantId],
      );
      let mfaOk = Boolean(factor.rows[0]?.secret_ciphertext && verifyTotp(decryptAuthSecret(factor.rows[0].secret_ciphertext), body.code));
      if (!mfaOk) {
        const recovery = await getPgPool().query(
          `UPDATE auth_recovery_codes SET consumed_at=now()
           WHERE user_id=$1 AND tenant_id=$2 AND code_hash=$3 AND consumed_at IS NULL
           RETURNING id`,
          [user.id, user.tenantId, hashRecoveryCode(body.code)],
        );
        mfaOk = recovery.rowCount === 1;
      }
      if (!mfaOk) return Response.json({ error: "mfa_verification_failed" }, { status: 401 });
    }

    await issuePrivilegedReauthChallenge(user);
    return Response.json({ ok: true, expiresInSeconds: 600 });
  } catch (error) {
    console.error("ELITZE privileged reauthentication failed", error);
    return Response.json({ error: "reauthentication_unavailable" }, { status: 503 });
  }
}
