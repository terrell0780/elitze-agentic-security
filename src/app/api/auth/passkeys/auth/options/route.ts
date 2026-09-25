import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { assertSameOrigin } from "@/lib/auth";
import { getPgPool } from "@/db";
import { webAuthnRpId } from "@/lib/webauthn";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const body = await request.json() as { email?: unknown };
    if (typeof body.email !== "string") return Response.json({ error: "invalid_credentials" }, { status: 401 });
    const email = body.email.trim().toLowerCase();
    const userResult = await getPgPool().query(
      `SELECT id, tenant_id AS "tenantId" FROM auth_users WHERE email_normalized=$1 AND status='active' LIMIT 1`,
      [email],
    );
    if (!userResult.rows[0]) return Response.json({ error: "invalid_credentials" }, { status: 401 });
    const user = userResult.rows[0];
    const credentials = await getPgPool().query(
      `SELECT credential_id, transports FROM auth_webauthn_credentials
       WHERE user_id=$1 AND tenant_id=$2 AND revoked_at IS NULL`,
      [user.id, user.tenantId],
    );
    const options = await generateAuthenticationOptions({
      rpID: webAuthnRpId(),
      userVerification: "required",
      allowCredentials: credentials.rows.map((row) => ({ id: row.credential_id, transports: row.transports ?? [] })),
    });
    await getPgPool().query(
      `INSERT INTO auth_challenges (user_id,tenant_id,purpose,challenge_hash,expires_at)
       VALUES ($1,$2,'webauthn_authentication',$3,now()+interval '5 minutes')`,
      [user.id, user.tenantId, crypto.createHash("sha256").update(options.challenge).digest("hex")],
    );
    return Response.json(options);
  } catch (error) {
    console.error("ELITZE WebAuthn authentication options failed", error);
    return Response.json({ error: "passkey_unavailable" }, { status: 503 });
  }
}
