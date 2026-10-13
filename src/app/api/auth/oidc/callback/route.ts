import { authorizationCodeGrant, fetchUserInfo } from "openid-client";
import { NextResponse } from "next/server";
import { discoverOidc, oidcRedirectUri } from "@/lib/oidc";
import { createSession } from "@/lib/auth";
import { decryptAuthSecret } from "@/lib/auth-mfa";
import { getPgPool } from "@/db";
import { isReservedNonDeliverableEmail } from "@/lib/elitze-secure/auth-email-policy";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const equalToken = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const browserState = (await cookies()).get("elitze_oidc_state")?.value;
    if (error || !state || !browserState || !equalToken(state, browserState)) {
      return NextResponse.json({ error: "oidc_login_failed" }, { status: 401 });
    }

    const config = await discoverOidc();
    const stateHash = crypto.createHash("sha256").update(state).digest("hex");
    const challenge = await getPgPool().query(
      "SELECT id, state_hash, nonce_hash, nonce_ciphertext, code_verifier_ciphertext FROM auth_challenges WHERE purpose='oidc_login' AND state_hash=$1 AND consumed_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1",
      [stateHash],
    );
    const row = challenge.rows[0];
    if (!row) return NextResponse.json({ error: "oidc_state_invalid" }, { status: 401 });

    const tokens = await authorizationCodeGrant(config, request, {
      expectedState: state,
      expectedNonce: decryptAuthSecret(row.nonce_ciphertext),
      pkceCodeVerifier: decryptAuthSecret(row.code_verifier_ciphertext),
    });

    const claims = tokens.claims();
    const accessToken = tokens.access_token;
    const subject = String(claims?.sub ?? "").trim();
    if (!subject) return NextResponse.json({ error: "oidc_subject_missing" }, { status: 401 });

    const userinfo = accessToken ? await fetchUserInfo(config, accessToken, subject) : undefined;
    const email = String(userinfo?.email ?? claims?.email ?? "").trim().toLowerCase();
    const emailVerified = Boolean(userinfo?.email_verified ?? claims?.email_verified);
    if (!email || !emailVerified || isReservedNonDeliverableEmail(email)) {
      return NextResponse.json({ error: "oidc_identity_unverified" }, { status: 403 });
    }

    const userResult = await getPgPool().query(
      "SELECT id, tenant_id AS \"tenantId\", email, display_name AS \"displayName\", role, status FROM auth_users WHERE email_normalized=$1 AND status='active' LIMIT 1",
      [email],
    );
    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ error: "oidc_account_not_provisioned" }, { status: 403 });

    const consumed = await getPgPool().query("UPDATE auth_challenges SET consumed_at=now() WHERE id=$1 AND consumed_at IS NULL RETURNING id", [row.id]);
    if (!consumed.rowCount) return NextResponse.json({ error: "oidc_state_replayed" }, { status: 401 });
    (await cookies()).delete("elitze_oidc_state");
    await createSession(user, true);
    return NextResponse.redirect(new URL("/console", new URL(oidcRedirectUri()).origin));
  } catch (error) {
    console.error("ELITZE OIDC callback failed", error);
    return NextResponse.json({ error: "oidc_login_failed" }, { status: 401 });
  }
}