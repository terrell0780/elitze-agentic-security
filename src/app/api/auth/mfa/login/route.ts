import { assertSameOrigin, consumeMfaLoginChallenge, createSession } from "@/lib/auth";
import { decryptAuthSecret, hashRecoveryCode, verifyTotp } from "@/lib/auth-mfa";
import { getPgPool } from "@/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const rawChallenge = (await cookies()).get("elitze_mfa_challenge")?.value;
    if (!rawChallenge) return Response.json({ error: "mfa_challenge_required" }, { status: 401 });
    const body = await request.json() as { code?: unknown; persistent?: unknown };
    if (typeof body.code !== "string") return Response.json({ error: "invalid_mfa_code" }, { status: 401 });

    const record = await consumeMfaLoginChallenge(rawChallenge);
    (await cookies()).delete("elitze_mfa_challenge");
    if (!record) return Response.json({ error: "invalid_or_expired_mfa_challenge" }, { status: 401 });

    const db = getPgPool();
    const userResult = await db.query(
      `SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status
       FROM auth_users WHERE id=$1 AND tenant_id=$2 AND status='active' LIMIT 1`,
      [record.userId, record.tenantId],
    );
    const user = userResult.rows[0];
    if (!user) return Response.json({ error: "invalid_mfa_code" }, { status: 401 });

    const factorResult = await db.query(
      `SELECT secret_ciphertext FROM auth_mfa_factors
       WHERE user_id=$1 AND tenant_id=$2 AND factor_type='totp' AND enabled_at IS NOT NULL AND revoked_at IS NULL LIMIT 1`,
      [user.id, user.tenantId],
    );
    let verified = false;
    if (factorResult.rows[0]?.secret_ciphertext) {
      verified = verifyTotp(decryptAuthSecret(factorResult.rows[0].secret_ciphertext), body.code);
    }
    if (!verified) {
      const recovery = await db.query(
        `UPDATE auth_recovery_codes SET consumed_at=now()
         WHERE user_id=$1 AND tenant_id=$2 AND code_hash=$3 AND consumed_at IS NULL
         RETURNING id`,
        [user.id, user.tenantId, hashRecoveryCode(body.code)],
      );
      verified = recovery.rowCount === 1;
    }
    if (!verified) return Response.json({ error: "invalid_mfa_code" }, { status: 401 });

    await createSession(user, body.persistent !== false);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("ELITZE MFA login failed", error);
    return Response.json({ error: "mfa_unavailable" }, { status: 503 });
  }
}
