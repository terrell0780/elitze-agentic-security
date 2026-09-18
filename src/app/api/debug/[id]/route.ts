import { NextRequest, NextResponse } from "next/server";
import { getTeamSession } from "@/lib/team/session";
import { getDebugSession } from "@/lib/elitze-secure/debugger-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getTeamSession();
  if (!auth) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  const { id } = await context.params;
  const debug = getDebugSession(id, auth.actorId);
  if (!debug) return NextResponse.json({ ok: false, error: "Debugger session not found." }, { status: 404 });
  return NextResponse.json({ ok: true, session: debug.snapshot() });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getTeamSession();
  if (!auth) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  const { id } = await context.params;
  const debug = getDebugSession(id, auth.actorId);
  if (!debug) return NextResponse.json({ ok: false, error: "Debugger session not found." }, { status: 404 });
  const body = await request.json().catch(() => null) as { action?: unknown; [key: string]: unknown } | null;
  if (typeof body?.action !== "string") return NextResponse.json({ ok: false, error: "Debugger action is required." }, { status: 400 });
  try {
    const result = await debug.command(body as { action: string; [key: string]: unknown });
    return NextResponse.json({ ok: true, result, session: debug.snapshot() });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Debugger action failed.", session: debug.snapshot() }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getTeamSession();
  if (!auth) return NextResponse.json({ ok: false, error: "Team authentication required." }, { status: 401 });
  const { id } = await context.params;
  const debug = getDebugSession(id, auth.actorId);
  if (!debug) return NextResponse.json({ ok: false, error: "Debugger session not found." }, { status: 404 });
  await debug.stop();
  return NextResponse.json({ ok: true, state: "stopped" });
}
