import { NextResponse } from "next/server";
import { calculatePKCECodeChallenge, buildAuthorizationUrl, randomNonce, randomPKCECodeVerifier, randomState } from "openid-client";
import { discoverOidc, oidcRedirectUri } from "@/lib/oidc";
import { encryptAuthSecret } from "@/lib/auth-mfa";
import { getPgPool } from "@/db";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const config = await discoverOidc();
    const state = randomState();
    const nonce = randomNonce();
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

    await getPgPool().query(
      `INSERT INTO auth_challenges (purpose,challenge_hash,state_hash,nonce_hash,nonce_ciphertext,code_verifier_ciphertext,expires_at)
       VALUES ('oidc_login',$1,$2,$3,$4,$5,now()+interval '10 minutes')`,
      [
        crypto.createHash("sha256").update(state).digest("hex"),
        crypto.createHash("sha256").update(state).digest("hex"),
        crypto.createHash("sha256").update(nonce).digest("hex"),
        encryptAuthSecret(nonce),
        encryptAuthSecret(codeVerifier),
      ],
    );

    (await cookies()).set("elitze_oidc_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    const authorizationUrl = buildAuthorizationUrl(config, {
      redirect_uri: oidcRedirectUri(),
      scope: process.env.ELITZE_OIDC_SCOPES || "openid profile email",
      response_type: "code",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
    });
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("ELITZE OIDC start failed", error);
    return NextResponse.json({ error: "oidc_unavailable" }, { status: 503 });
  }
}
