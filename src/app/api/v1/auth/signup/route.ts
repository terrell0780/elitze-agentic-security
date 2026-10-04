import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/auth/service";
import { sendVerificationEmail } from "@/lib/email/resend";

const schema = z.object({
  organizationName: z.string().trim().min(2).max(200),
  organizationSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(256),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await registerUser(input);
    await sendVerificationEmail(result.user.email, result.verificationToken);
    return NextResponse.json({ ok: true, status: "VERIFICATION_REQUIRED", userId: result.user.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    if (/RESEND_API_KEY|EMAIL_FROM|APP_ORIGIN|required for transactional email/i.test(message)) {
      return NextResponse.json({ ok: false, error: "Transactional email is not configured." }, { status: 503 });
    }
    if (/duplicate|unique/i.test(message)) {
      return NextResponse.json({ ok: false, error: "Account or organization already exists." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Signup failed." }, { status: 400 });
  }
}
