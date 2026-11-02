import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, consumeRateLimit, getCurrentUser, getRateLimitKey } from "@/lib/auth";
import { hireAgent } from "@/lib/elitze-secure/agent-workforce-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const hireSchema = z.object({
  brief: z.string().trim().min(1).max(4000),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const parsed = hireSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_hire_request" }, { status: 400 });

  if (!(await consumeRateLimit(await getRateLimitKey("workforce-hire", user.tenantId), 20, 60 * 60))) {
    return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "3600" } });
  }

  try {
    const outcome = await hireAgent(user.tenantId, parsed.data.brief, parsed.data.reason);
    return NextResponse.json({
      ok: true,
      created: outcome.created,
      agent: {
        agentId: outcome.agent.agentId,
        name: outcome.agent.name,
        avatarUrl: outcome.agent.avatarUrl,
        specialty: outcome.agent.specialty,
        // Identity is a DECLARED catalog entry; runtime execution state is UNKNOWN.
        catalogTruthState: "DECLARED",
        runtimeTruthState: "UNKNOWN",
      },
    });
  } catch (error) {
    console.error("ELITZE agent workforce hiring failed", error);
    return NextResponse.json({ ok: false, error: "agent_workforce_unavailable" }, { status: 503 });
  }
}
