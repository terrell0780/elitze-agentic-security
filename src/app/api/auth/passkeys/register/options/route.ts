import { generateRegistrationOptions } from "@simplewebauthn/server";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";
import { webAuthnRpId } from "@/lib/webauthn";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "unauthenticated" }, { status: 401 });
    const rpID = webAuthnRpId();
    const rpName = process.env.ELITZE_WEBAUTHN_RP_NAME || "ELITZE Agentic Security";
    const existing = await getPgPool().query(
      `SELECT credential_id, transports FROM auth_webauthn_credentials
       WHERE user_id=$1 AND tenant_id=$2 AND revoked_at IS NULL`,
      [user.id, user.tenantId],
    );
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.email,
      userID: new TextEncoder().encode(user.id),
      attestationType: "none",
      excludeCredentials: existing.rows.map((row) => ({ id: row.credential_id, transports: row.transports ?? [] })),
      authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
    });
    await getPgPool().query(
      `INSERT INTO auth_challenges (user_id,tenant_id,purpose,challenge_hash,expires_at)
       VALUES ($1,$2,'webauthn_registration',$3,now()+interval '5 minutes')`,
      [user.id, user.tenantId, crypto.createHash("sha256").update(options.challenge).digest("hex")],
    );
    return Response.json(options);
  } catch (error) {
    console.error("ELITZE WebAuthn registration options failed", error);
    return Response.json({ error: "passkey_unavailable" }, { status: 503 });
  }
}
