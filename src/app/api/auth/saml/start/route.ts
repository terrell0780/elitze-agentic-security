import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { createSaml } from "@/lib/saml";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export async function GET(request: Request) {
  try {
    const saml = createSaml();
    const state = crypto.randomBytes(32).toString("base64url");
    await getPgPool().query(
      `INSERT INTO auth_challenges (purpose,challenge_hash,state_hash,expires_at)
       VALUES ('saml_login',$1,$1,now()+interval '10 minutes')`,
      [digest(state)],
    );

    (await cookies()).set("elitze_saml_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    const host = new URL(request.url).host;
    const authorizationUrl = await saml.getAuthorizeUrlAsync(state, host, {});
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("ELITZE SAML start failed", error);
    return NextResponse.json({ error: "saml_unavailable" }, { status: 503 });
  }
}
