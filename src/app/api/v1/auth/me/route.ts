import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth/cookies";
import { getUserBySessionToken } from "@/lib/auth/service";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await getUserBySessionToken(token);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({ ok: true, user });
}
