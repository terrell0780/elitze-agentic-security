import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { assertSameOrigin, createSession } from "@/lib/auth";
import { getPgPool } from "@/db";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const body = await request.json();
    const credentialId = typeof body?.id === "string" ? body.id : "";
    if (!credentialId) return Response.json({ error: "invalid_passkey" }, { status: 401 });
    const db = getPgPool();
    const credential = await db.query(
      `SELECT c.id, c.user_id, c.tenant_id, c.credential_id, c.public_key, c.counter,
              u.email, u.display_name AS "displayName", u.role, u.status
       FROM auth_webauthn_credentials c
       JOIN auth_users u ON u.id=c.user_id AND u.tenant_id=c.tenant_id
       WHERE c.credential_id=$1 AND c.revoked_at IS NULL AND u.status='active' LIMIT 1`,
      [credentialId],
    );
    const row = credential.rows[0];
    if (!row) return Response.json({ error: "invalid_passkey" }, { status: 401 });
    const challenge = await db.query(
      `SELECT id, challenge_hash FROM auth_challenges
       WHERE user_id=$1 AND tenant_id=$2 AND purpose='webauthn_authentication'
       AND consumed_at IS NULL AND expires_at>now()
       ORDER BY created_at DESC LIMIT 1`,
      [row.user_id, row.tenant_id],
    );
    if (!challenge.rows[0]) return Response.json({ error: "passkey_challenge_expired" }, { status: 401 });
    const challengeHash = challenge.rows[0].challenge_hash;
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: async (candidate) => crypto.createHash("sha256").update(candidate).digest("hex") === challengeHash,
      expectedOrigin: process.env.ELITZE_WEBAUTHN_ORIGIN || "https://www.elitze.info",
      expectedRPID: process.env.ELITZE_WEBAUTHN_RP_ID || "www.elitze.info",
      credential: {
        id: row.credential_id,
        publicKey: new Uint8Array(row.public_key),
        counter: Number(row.counter),
        transports: body.response?.transports ?? [],
      },
      requireUserVerification: true,
    });
    if (!verification.verified) return Response.json({ error: "passkey_verification_failed" }, { status: 401 });
    await db.query(`UPDATE auth_webauthn_credentials SET counter=$1,last_used_at=now() WHERE id=$2`, [verification.authenticationInfo.newCounter, row.id]);
    await db.query(`UPDATE auth_challenges SET consumed_at=now() WHERE id=$1`, [challenge.rows[0].id]);
    await createSession({
      id: row.user_id,
      tenantId: row.tenant_id,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      status: row.status,
    }, true);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("ELITZE WebAuthn authentication verification failed", error);
    return Response.json({ error: "passkey_verification_failed" }, { status: 401 });
  }
}
