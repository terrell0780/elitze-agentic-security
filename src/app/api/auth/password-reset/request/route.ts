import { NextRequest } from "next/server";
import { assertSameOrigin, consumeRateLimit, getRateLimitKey, issueEmailToken, normalizeEmail } from "@/lib/auth";
import { getPgPool } from "@/db";
import { sendAuthEmail } from "@/lib/auth-email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const generic = { ok: true };
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const body = await request.json() as { email?: unknown };
    if (typeof body.email !== "string") return Response.json(generic);
    const email = normalizeEmail(body.email);
    if (!(await consumeRateLimit(await getRateLimitKey("password-reset", email), 5, 60 * 60))) {
      return Response.json(generic);
    }

    const result = await getPgPool().query(
      `SELECT id, tenant_id AS "tenantId", email, display_name AS "displayName", role, status
       FROM auth_users WHERE email_normalized=$1 AND status='active' LIMIT 1`,
      [email],
    );
    const user = result.rows[0];
    if (!user) return Response.json(generic);

    const token = await issueEmailToken(user, "password_reset", 30);
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.info").replace(/\/$/, "");
    await sendAuthEmail(
      user.email,
      "Reset your ELITZE Agentic Security password",
      `Reset your password: ${base}/reset-password?token=${encodeURIComponent(token)}\n\nThis link expires in 30 minutes and can be used once.`,
    );
    return Response.json(generic);
  } catch (error) {
    console.error("ELITZE password reset request failed", error);
    return Response.json(generic);
  }
}
