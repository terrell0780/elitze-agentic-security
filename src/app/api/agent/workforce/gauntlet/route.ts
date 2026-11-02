import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, consumeRateLimit, getCurrentUser, getRateLimitKey } from "@/lib/auth";
import { listGauntletRuns, recordGauntletRun } from "@/lib/elitze-secure/agent-workforce-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const gateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  exitCode: z.number().int().finite(),
  durationMs: z.number().int().finite().min(0).max(86_400_000).default(0),
  logExcerpt: z.string().max(20_000).default(""),
});

const recordSchema = z.object({
  agentId: z.string().trim().regex(/^wf-[0-9a-f]{8}$/),
  patchRef: z.string().trim().min(1).max(300),
  gates: z.array(gateSchema).min(1).max(20),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const agentId = request.nextUrl.searchParams.get("agentId") ?? undefined;

  try {
    const runs = await listGauntletRuns(user.tenantId, agentId);
    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    console.error("ELITZE agent gauntlet listing failed", error);
    return NextResponse.json({ ok: false, error: "agent_gauntlet_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const parsed = recordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_gauntlet_record" }, { status: 400 });

  if (!(await consumeRateLimit(await getRateLimitKey("workforce-gauntlet", user.tenantId), 60, 60 * 60))) {
    return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "3600" } });
  }

  try {
    const record = await recordGauntletRun(user.tenantId, parsed.data.agentId, parsed.data.patchRef, parsed.data.gates);
    return NextResponse.json({
      ok: true,
      record,
      // PASSED is derived only from recorded exit codes; without recorded
      // evidence a patch is never treated as verified.
      verificationBasis: "recorded_gate_exit_codes",
    });
  } catch (error) {
    console.error("ELITZE agent gauntlet recording failed", error);
    return NextResponse.json({ ok: false, error: "agent_gauntlet_unavailable" }, { status: 503 });
  }
}
