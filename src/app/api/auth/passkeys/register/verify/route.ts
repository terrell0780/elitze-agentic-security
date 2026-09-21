import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });
    const body = await request.json();
    const db = getPgPool();
    const challenge = await db.query(
      `SELECT id, challenge_hash FROM auth_challenges
       WHERE user_id=$1 AND tenant_id=$2 AND purpose='webauthn_registration'
       AND consumed_at IS NULL AND expires_at>now()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, user.tenantId],
    );
    if (!challenge.rows[0]) return Response.json({ error: "passkey_challenge_expired" }, { status: 400 });
    const expectedChallengeHash = challenge.rows[0].challenge_hash;
    const responseChallenge = typeof body?.response?.clientDataJSON === "string" ? body.response.clientDataJSON : "";
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: async (candidate) => crypto.createHash("sha256").update(candidate).digest("hex") === expectedChallengeHash,
      expectedOrigin: process.env.ELITZE_WEBAUTHN_ORIGIN || "https://elitze.ca",
      expectedRPID: process.env.ELITZE_WEBAUTHN_RP_ID || "elitze.ca",
      requireUserVerification: true,
    });
    if (!verification.verified || !verification.registrationInfo) return Response.json({ error: "passkey_verification_failed" }, { status: 400 });
    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    await db.query(
      `INSERT INTO auth_webauthn_credentials
       (user_id,tenant_id,credential_id,public_key,counter,transports,device_type,backed_up)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [user.id, user.tenantId, credential.id, Buffer.from(credential.publicKey), credential.counter, body.response?.transports ?? [], credentialDeviceType, credentialBackedUp],
    );
    await db.query(`UPDATE auth_challenges SET consumed_at=now() WHERE id=$1`, [challenge.rows[0].id]);
    return Response.json({ ok: true, verified: true });
  } catch (error) {
    console.error("ELITZE WebAuthn registration verification failed", error);
    return Response.json({ error: "passkey_verification_failed" }, { status: 400 });
  }
}
