import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordRecovery } from "@/lib/auth/service";
import { sendRecoveryEmail } from "@/lib/email/resend";

const schema = z.object({ email: z.string().trim().email().max(320) });

export async function POST(request: Request) {
  const response = { ok: true, message: "If the account exists, recovery instructions have been sent." };
  try {
    const { email } = schema.parse(await request.json());
    const token = await requestPasswordRecovery(email);
    if (token) await sendRecoveryEmail(email.trim().toLowerCase(), token);
  } catch (error) {
    console.error("ELITZE recovery request failed", error);
  }
  return NextResponse.json(response);
}
