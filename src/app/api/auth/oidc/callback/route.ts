import { authorizationCodeGrant, fetchUserInfo } from "openid-client";
import { NextResponse } from "next/server";
import { discoverOidc } from "@/lib/oidc";
import { createSession } from "@/lib/auth";
import { decryptAuthSecret } from "@/lib/auth-mfa";
import { getPgPool } from "@/db";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    if (error || !state) return NextResponse.json({ error: "oidc_login_failed" }, { status: 401 });

    const config = await discoverOidc();
    const stateHash = crypto.createHash("sha256").update(state).digest("hex");
    const challenge = await getPgPool().query(
      `SELECT id, state_hash, nonce_hash, nonce_ciphertext, code_verifier_ciphertext
       FROM auth_challenges WHERE purpose='oidc_login' AND state_hash=$1
       AND consumed_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1`,
      [stateHash],
    );
    const row = challenge.rows[0];
    if (!row) return NextResponse.json({ error: "oidc_state_invalid" }, { status: 401 });

    const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.elitze.info");
    const tokens = await authorizationCodeGrant(config, request, {
      expectedState: state,
      expectedNonce: decryptAuthSecret(row.nonce_ciphertext),
      pkceCodeVerifier: decryptAuthSecret(row.code_verifier_ciphertext),
    });

    const claims = tokens.claims();
    const accessToken = tokens.access_token;
    const userinfo = accessToken ? await fetchUserInfo(config, accessToken, claims?.sub) : undefined;
    const email = String(userinfo?.email ?? claims?.email ?? "").trim().toLowerCase();
    const emailVerified = Boolean(userinfo?.email_verified ?? claims?.email_verified);
    if (!email || !emailVerified) return NextResponse.json({ error: "oidc_identity_unverified" }, { status: 403 });

    const userResult = await getPgPool().query(
      `SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status
       FROM auth_users WHERE email_normalized=$1 AND status='active' LIMIT 1`,
      [email],
    );
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ error: "oidc_account_not_provisioned" }, { status: 403 });

    await getPgPool().query(`UPDATE auth_challenges SET consumed_at=now() WHERE id=$1 AND consumed_at IS NULL`, [row.id]);
    await createSession(user, true);
    return NextResponse.redirect(new URL("/console", site));
  } catch (error) {
    console.error("ELITZE OIDC callback failed", error);
    return NextResponse.json({ error: "oidc_login_failed" }, { status: 401 });
  }
}
