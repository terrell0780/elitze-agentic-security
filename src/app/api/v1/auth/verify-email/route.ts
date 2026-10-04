import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmail } from "@/lib/auth/service";

const schema = z.object({ token: z.string().min(32).max(256) });

export async function POST(request: Request) {
  try {
    const { token } = schema.parse(await request.json());
    const user = await verifyEmail(token);
    return NextResponse.json({ ok: true, userId: user.id });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid or expired verification token." }, { status: 400 });
  }
}
