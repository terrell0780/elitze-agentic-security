import { NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, issueEmailToken, registerUser } from "@/lib/auth";
import { sendAuthEmail } from "@/lib/auth-email";

const schema = z.object({
  organizationName: z.string().trim().min(2).max(200),
  organizationSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(256),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await assertSameOrigin(request))) {
      return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });
    }

    const input = schema.parse(await request.json());
    const user = await registerUser(
      input.email,
      input.password,
      undefined,
      input.organizationName,
      input.organizationSlug,
    );
    const token = await issueEmailToken(user, "email_verification", 24 * 60);
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin;
    await sendAuthEmail(
      user.email,
      "Verify your ELITZE Agentic Security account",
      `Verify your email: ${origin.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}\n\nThis link expires in 24 hours.`,
    );

    return NextResponse.json({ ok: true, status: "VERIFICATION_REQUIRED", userId: user.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const duplicate = /duplicate|unique/i.test(message);
    const emailConfig = /email_delivery_not_configured|email_delivery_failed|unsupported_email_provider/i.test(message);
    const invalidInput = error instanceof z.ZodError;
    const publicError = duplicate
      ? "Account or organization already exists."
      : emailConfig
        ? "Transactional email is not configured."
        : invalidInput
          ? "Invalid signup request."
          : "Signup failed.";
    const status = emailConfig ? 503 : duplicate ? 409 : invalidInput ? 400 : 500;
    if (!duplicate && !emailConfig && !invalidInput) {
      console.error("ELITZE signup failed", error);
    }
    return NextResponse.json({ ok: false, error: publicError }, { status });
  }
}