import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { encryptAuthSecret, generateRecoveryCodes, generateTotpSecret, hashRecoveryCode } from "@/lib/auth-mfa";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });

    const existing = await getPgPool().query(
      `SELECT id FROM auth_mfa_factors WHERE user_id=$1 AND tenant_id=$2 AND factor_type='totp' AND revoked_at IS NULL AND enabled_at IS NOT NULL LIMIT 1`,
      [user.id, user.tenantId],
    );
    if (existing.rowCount) return Response.json({ error: "mfa_already_enabled" }, { status: 409 });

    const secret = generateTotpSecret();
    const factor = await getPgPool().query(
      `INSERT INTO auth_mfa_factors (user_id,tenant_id,factor_type,label,secret_ciphertext)
       VALUES ($1,$2,'totp','ELITZE authenticator',$3)
       RETURNING id`,
      [user.id, user.tenantId, encryptAuthSecret(secret)],
    );
    const issuer = encodeURIComponent("ELITZE Agentic Security");
    const account = encodeURIComponent(user.email);
    const uri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return Response.json({ ok: true, factorId: factor.rows[0].id, secret, otpauthUri: uri });
  } catch (error) {
    console.error("ELITZE MFA enrollment failed", error);
    return Response.json({ error: "mfa_unavailable" }, { status: 503 });
  }
}
