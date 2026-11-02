import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSameOrigin, consumeRateLimit, getCurrentUser, getRateLimitKey } from "@/lib/auth";
import { listGauntletRuns } from "@/lib/elitze-secure/agent-workforce-db";
import { evaluatePublisherGuard, type PublisherInput } from "@/lib/elitze-secure/agent-publisher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const publishSchema = z.object({
  agentId: z.string().trim().regex(/^wf-[0-9a-f]{8}$/),
  bountyId: z.string().trim().min(1).max(120),
  runId: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const parsed = publishSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_publish_request" }, { status: 400 });

  if (!(await consumeRateLimit(await getRateLimitKey("workforce-publish", user.tenantId), 10, 60 * 60))) {
    return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "3600" } });
  }

  try {
    const runs = await listGauntletRuns(user.tenantId, parsed.data.agentId);
    const run = parsed.data.runId
      ? runs.find((candidate) => candidate.id === parsed.data.runId)
      : runs[0];

    if (!run) {
      return NextResponse.json({ ok: false, error: "publisher_bypassed_failed_sandbox_gates", detail: "no gauntlet record for this agent" }, { status: 409 });
    }

    // Presence check only: the token is never read, echoed or stored here.
    const githubTokenConfigured = Boolean(process.env.GITHUB_TOKEN?.trim());
    const input: PublisherInput = {
      gauntletStatus: run.status,
      githubTokenConfigured,
      bountyId: parsed.data.bountyId,
      workspaceRef: run.patchRef,
      seed: `${run.id}-${parsed.data.agentId}`,
    };
    const decision = evaluatePublisherGuard(input);
    return NextResponse.json({
      ok: true,
      decision,
      gauntletRunId: run.id,
      // The handoff is a plan, not an outcome. Only the runner's reportback
      // recorded afterwards counts as publication evidence.
      publicationEvidence: "runner_reportback_required",
    });
  } catch (error) {
    console.error("ELITZE agent publisher handoff failed", error);
    return NextResponse.json({ ok: false, error: "agent_publisher_unavailable" }, { status: 503 });
  }
}
