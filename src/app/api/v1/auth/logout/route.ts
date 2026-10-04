import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken, requireCsrf } from "@/lib/auth/cookies";
import { revokeSession } from "@/lib/auth/service";

export async function POST(request: Request) {
  try {
    await requireCsrf(request);
    const token = await getSessionToken();
    if (token) await revokeSession(token);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Logout rejected." }, { status: 403 });
  }
}
