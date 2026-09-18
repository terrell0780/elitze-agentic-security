import { NextRequest, NextResponse } from "next/server";
import { getTeamSession } from "@/lib/team/session";
import { createDebugSession, listDebugSessions } from "@/lib/elitze-secure/debugger-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getTeamSession();
  if (!auth) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  return NextResponse.json({
    ok: true,
    enabled: process.env.ELITZE_DEBUGGER_ENABLED === "true" || (process.env.NODE_ENV !== "production" && process.env.ELITZE_DEBUGGER_ENABLED !== "false"),
    sessions: listDebugSessions(auth.actorId),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getTeamSession();
  if (!auth) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { entry?: unknown; args?: unknown; cwd?: unknown } | null;
  const entry = typeof body?.entry === "string" ? body.entry.trim() : "";
  const args = Array.isArray(body?.args) ? body.args.filter((v): v is string => typeof v === "string").slice(0, 32) : [];
  const cwd = typeof body?.cwd === "string" && body.cwd.trim() ? body.cwd.trim() : ".";
  if (!entry) return NextResponse.json({ ok: false, error: "Entry file is required." }, { status: 400 });
  try {
    const debug = await createDebugSession({ actorId: auth.actorId, entry, args, cwd });
    return NextResponse.json({ ok: true, session: debug.snapshot() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Debugger session could not start." }, { status: 400 });
  }
}
