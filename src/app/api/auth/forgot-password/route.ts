import { NextRequest } from "next/server";
import { issueEmailToken } from "@/lib/auth";
import { getDb } from "@/db";
import { sendAuthEmail } from "@/lib/auth-email";

export const dynamic = "force-dynamic";
const generic = { ok: true };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown };
    if (typeof body.email !== "string") return Response.json(generic);
    const email = body.email.trim().toLowerCase();
    const result = await getDb().query(`SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status FROM auth_users WHERE email_normalized=$1 LIMIT 1`, [email]);
    const user = result.rows[0];
    if (!user) return Response.json(generic);
    const token = await issueEmailToken(user, "password_reset", 30);
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca").replace(/\/$/, "");
    await sendAuthEmail(user.email, "Reset your ELITZE Agentic Security password", `Reset your password: ${base}/auth/reset-password?token=${encodeURIComponent(token)}\n\nThis link expires in 30 minutes.`);
    return Response.json(generic);
  } catch (error) {
    console.error("ELITZE password reset request failed", error);
    return Response.json({ error: "password_reset_unavailable" }, { status: 503 });
  }
}
