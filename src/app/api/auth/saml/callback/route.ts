import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { createSession } from "@/lib/auth";
import { createSaml, samlSiteOrigin } from "@/lib/saml";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

const readString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim();
  return "";
};

const readProfileValue = (profile: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = readString(profile[key]);
    if (value) return value;
  }
  return "";
};

const equalToken = (left: string, right: string) => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export async function POST(request: Request) {
  try {
    const saml = createSaml();
    const form = await request.formData();
    const samlResponse = readString(form.get("SAMLResponse"));
    const relayState = readString(form.get("RelayState"));
    const browserState = (await cookies()).get("elitze_saml_state")?.value;

    if (!samlResponse || !relayState || !browserState || !equalToken(relayState, browserState)) {
      return NextResponse.json({ error: "saml_state_invalid" }, { status: 401 });
    }

    const stateHash = digest(relayState);
    const challenge = await getPgPool().query(
      `SELECT id
       FROM auth_challenges
       WHERE purpose='saml_login'
         AND challenge_hash=$1
         AND state_hash=$1
         AND consumed_at IS NULL
         AND expires_at>now()
       ORDER BY created_at DESC
       LIMIT 1`,
      [stateHash],
    );
    const row = challenge.rows[0];
    if (!row) return NextResponse.json({ error: "saml_state_invalid" }, { status: 401 });

    const validation = await saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
      RelayState: relayState,
    });
    const profile = validation.profile as Record<string, unknown> | null | undefined;
    if (validation.loggedOut || !profile) {
      return NextResponse.json({ error: "saml_identity_invalid" }, { status: 401 });
    }

    const subject = readProfileValue(profile, ["nameID", "nameId"]);
    const idpIssuer = readProfileValue(profile, ["issuer"]) || process.env.ELITZE_SAML_IDP_ENTITY_ID?.trim() || "";
    const email = readProfileValue(profile, [
      "email",
      "mail",
      "emailAddress",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "http://schemas.microsoft.com/identity/claims/emailaddress",
    ]).toLowerCase();

    if (!subject || !idpIssuer) return NextResponse.json({ error: "saml_identity_unverified" }, { status: 403 });

    const db = getPgPool();
    let userResult = await db.query(
      `SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status
       FROM auth_users
       WHERE saml_idp=$1 AND saml_subject=$2 AND status='active'
       LIMIT 1`,
      [idpIssuer, subject],
    );

    if (!userResult.rows[0] && email) {
      userResult = await db.query(
        `SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status
         FROM auth_users
         WHERE email_normalized=$1 AND status='active'
         LIMIT 1`,
        [email],
      );
    }

    const user = userResult.rows[0];
    if (!user) return NextResponse.json({ error: "saml_account_not_provisioned" }, { status: 403 });

    const consumed = await db.query(
      `UPDATE auth_challenges
       SET consumed_at=now()
       WHERE id=$1 AND consumed_at IS NULL
       RETURNING id`,
      [row.id],
    );
    if (!consumed.rowCount) {
      return NextResponse.json({ error: "saml_state_replayed" }, { status: 401 });
    }

    await db.query(
      `UPDATE auth_users
       SET saml_subject=COALESCE(saml_subject,$1),
           saml_idp=COALESCE(saml_idp,$2),
           updated_at=now()
       WHERE id=$3 AND tenant_id=$4`,
      [subject, idpIssuer, user.id, user.tenantId],
    );

    (await cookies()).delete("elitze_saml_state");
    await createSession(user, true);
    return NextResponse.redirect(new URL("/console", samlSiteOrigin()));
  } catch (error) {
    console.error("ELITZE SAML callback failed", error);
    return NextResponse.json({ error: "saml_login_failed" }, { status: 401 });
  }
}
