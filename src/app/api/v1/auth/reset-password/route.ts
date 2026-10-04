import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/lib/auth/reset";

const schema = z.object({
  token: z.string().min(32).max(256),
  password: z.string().min(12).max(256),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await resetPassword(input.token, input.password);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid or expired recovery token." }, { status: 400 });
  }
}
