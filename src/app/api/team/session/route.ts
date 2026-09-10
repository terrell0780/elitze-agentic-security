import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encodeTeamSession, teamSessionCookie, teamSessionMaxAge } from "@/lib/team/session";

const bodySchema = z.object({
  actorId: z.string().trim().min(1).max(200),
  bootstrapKey: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  const expected = process.env.ELITZE_TEAM_BOOTSTRAP_KEY?.trim();
  if (!expected) {
    return NextResponse.json({ ok: false, error: "Team bootstrap is not configured." }, { status: 503 });
  }

  const input = bodySchema.safeParse(await request.json().catch(() => null));
  if (!input.success || input.data.bootstrapKey !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid team bootstrap credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, actorId: input.data.actorId });
  response.cookies.set({
    name: teamSessionCookie,
    value: encodeTeamSession(input.data.actorId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: teamSessionMaxAge,
  });
  return response;
}
