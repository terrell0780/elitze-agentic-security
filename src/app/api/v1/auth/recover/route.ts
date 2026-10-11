import { NextResponse } from "next/server";
import { assertSameOrigin, normalizeEmail, requestPasswordRecovery } from "@/lib/auth";
import { sendAuthEmail } from "@/lib/auth-email";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().email().max(320) });

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = { ok: true, message: "If the account exists, recovery instructions have been sent." };
  try {
    if (!(await assertSameOrigin(request))) return NextResponse.json({ error: "csrf_rejected" }, { status: 403 });

    const { email } = schema.parse(await request.json());
    const normalized = normalizeEmail(email);
    const token = await requestPasswordRecovery(normalized);
    if (!token) return NextResponse.json(response);

    const base = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin).replace(/\/$/, "");
    await sendAuthEmail(
      normalized,
      "Reset your ELITZE Agentic Security password",
      `Reset your password: ${base}/reset-password?token=${encodeURIComponent(token)}\n\nThis link expires in 1 hour and can be used once.`,
    );
  } catch (error) {
    console.error("ELITZE v1 recovery request failed", error);
  }
  return NextResponse.json(response);
}