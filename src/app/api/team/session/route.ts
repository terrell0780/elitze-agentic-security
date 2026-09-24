import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { encodeTeamSession, teamSessionCookie, teamSessionMaxAge } from "@/lib/team/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });

  const token = encodeTeamSession(user.id, user.tenantId);
  (await cookies()).set(teamSessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: teamSessionMaxAge,
  });

  return NextResponse.json({
    ok: true,
    actorId: user.id,
    tenantId: user.tenantId,
    mode: "auth-session",
  }, { headers: { "cache-control": "no-store" } });
}
