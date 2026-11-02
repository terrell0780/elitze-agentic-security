import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { listGauntletRuns, listWorkforce } from "@/lib/elitze-secure/agent-workforce-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pipelineQuery = z.object({
  agentId: z.string().trim().regex(/^wf-[0-9a-f]{8}$/),
});

/**
 * State-propagation view of the zero-trust evaluation train:
 * EvaluateInfrastructure -> RunGauntletSandbox -> PublishVerifiedPatch.
 * Read-only; states come from recorded rows, never from assumptions.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const parsed = pipelineQuery.safeParse({ agentId: request.nextUrl.searchParams.get("agentId") ?? "" });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_pipeline_query" }, { status: 400 });

  try {
    const workforce = await listWorkforce(user.tenantId);
    const identity = workforce.find((agent) => agent.agentId === parsed.data.agentId) ?? null;
    const runs = await listGauntletRuns(user.tenantId, parsed.data.agentId);
    const latestGauntlet = runs[0] ?? null;

    const pipeline = {
      agentId: parsed.data.agentId,
      identity,
      latestGauntlet,
      train: [
        {
          node: "EvaluateInfrastructure",
          endpoint: "POST /api/agent/workforce/hire",
          state: identity ? "hired" : "not_hired",
        },
        {
          node: "RunGauntletSandbox",
          endpoint: "POST /api/agent/workforce/gauntlet",
          state: latestGauntlet ? latestGauntlet.status : "UNKNOWN",
          detail: latestGauntlet ? `failing gate: ${latestGauntlet.failingGate ?? "none"}` : "no gauntlet record",
        },
        {
          node: "PublishVerifiedPatch",
          endpoint: "POST /api/agent/workforce/publish",
          // Coarse state on purpose: token configuration is operator knowledge
          // and must not leak as an env-status oracle to tenant members.
          state: latestGauntlet?.status === "PASSED" ? "ready_pending_publish" : "blocked_pending_gauntlet",
        },
      ],
    };

    return NextResponse.json({ ok: true, pipeline });
  } catch (error) {
    console.error("ELITZE agent pipeline view failed", error);
    return NextResponse.json({ ok: false, error: "agent_pipeline_unavailable" }, { status: 503 });
  }
}
