import { NextRequest } from "next/server";
import { consumeRateLimit, getRateLimitKey, issueEmailToken, registerUser } from "@/lib/auth";
import { sendAuthEmail } from "@/lib/auth-email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown; displayName?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return Response.json({ error: "email_and_password_required" }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    if (!(await consumeRateLimit(await getRateLimitKey("register", email), 5, 60 * 60))) {
      return Response.json({ error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "3600" } });
    }

    if (!process.env.RESEND_API_KEY?.trim() || !process.env.RESEND_FROM?.trim()) {
      return Response.json({ error: "email_delivery_not_configured" }, { status: 503 });
    }

    const user = await registerUser(email, body.password, typeof body.displayName === "string" ? body.displayName : undefined);
    const token = await issueEmailToken(user, "email_verification", 60);
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.elitze.info").replace(/\/$/, "");
    await sendAuthEmail(user.email, "Verify your ELITZE Agentic Security email", `Verify your email: ${base}/auth/verify?token=${encodeURIComponent(token)}\n\nThis link expires in 60 minutes.`);
    return Response.json({ ok: true, verificationRequired: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "registration_failed";
    if (message === "email_delivery_not_configured") return Response.json({ error: "email_delivery_not_configured" }, { status: 503 });
    if (message === "invalid_email" || message === "password_policy") return Response.json({ error: message }, { status: 400 });
    if (message.includes("duplicate") || message.includes("unique")) {
      return Response.json({ ok: true, verificationRequired: true });
    }
    console.error("ELITZE registration failed", error);
    return Response.json({ error: "registration_unavailable" }, { status: 503 });
  }
}
