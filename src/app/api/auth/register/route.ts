import { NextRequest } from "next/server";
import { issueEmailToken, registerUser } from "@/lib/auth";
import { sendAuthEmail } from "@/lib/auth-email";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown; displayName?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") return Response.json({ error: "email_and_password_required" }, { status: 400 });
    const user = await registerUser(body.email, body.password, typeof body.displayName === "string" ? body.displayName : undefined);
    const token = await issueEmailToken(user, "email_verification", 60);
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca").replace(/\/$/, "");
    await sendAuthEmail(user.email, "Verify your ELITZE Agentic Security email", `Verify your email: ${base}/auth/verify?token=${encodeURIComponent(token)}\n\nThis link expires in 60 minutes.`);
    return Response.json({ ok: true, verificationRequired: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "registration_failed";
    if (message === "email_delivery_not_configured") return Response.json({ error: "email_delivery_not_configured" }, { status: 503 });
    if (message === "invalid_email" || message === "password_policy") return Response.json({ error: message }, { status: 400 });
    if (message.includes("duplicate") || message.includes("unique")) return Response.json({ error: "registration_unavailable" }, { status: 409 });
    console.error("ELITZE registration failed", error);
    return Response.json({ error: "registration_unavailable" }, { status: 503 });
  }
}
