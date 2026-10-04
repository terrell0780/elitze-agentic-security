import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import {
  claimAgentWorkflowRun,
  completeAgentWorkflowRun,
  createAgentWorkflow,
  createAgentWorkflowRun,
  delegateAgent,
  listAgentWorkflowState,
  recordAgentMemory,
} from "@/lib/elitze-secure/agent-workflow";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const agentId = request.nextUrl.searchParams.get("agentId") ?? undefined;
  try {
    return NextResponse.json({ ok: true, ...await listAgentWorkflowState(user.tenantId, agentId) });
  } catch (error) {
    console.error("ELITZE agent workflow state failed", error);
    return NextResponse.json({ ok: false, error: "agent_workflow_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.operation !== "string") {
    return NextResponse.json({ ok: false, error: "operation_required" }, { status: 400 });
  }

  try {
    switch (body.operation) {
      case "create_workflow":
        return NextResponse.json({
          ok: true,
          workflow: await createAgentWorkflow({
            tenantId: user.tenantId,
            createdBy: user.id,
            workflowKey: String(body.workflowKey ?? ""),
            name: String(body.name ?? ""),
            description: String(body.description ?? ""),
            triggerKind: String(body.triggerKind ?? "MANUAL") as "MANUAL" | "SCHEDULED" | "EVENT",
            schedule: body.schedule == null ? null : String(body.schedule),
            timezone: body.timezone == null ? "UTC" : String(body.timezone),
            enabled: body.enabled === true,
            autonomyMode: body.autonomyMode == null ? "APPROVAL_GATED" : String(body.autonomyMode) as "READ_ONLY" | "APPROVAL_GATED" | "AUTONOMOUS",
            allowedSkillIds: Array.isArray(body.allowedSkillIds) ? body.allowedSkillIds.map(String) : [],
            allowedChannels: Array.isArray(body.allowedChannels) ? body.allowedChannels.map(String) : [],
            maxDelegationDepth: typeof body.maxDelegationDepth === "number" ? body.maxDelegationDepth : 1,
            definition: body.definition && typeof body.definition === "object" ? body.definition as Record<string, unknown> : {},
          }),
        }, { status: 201 });

      case "run_workflow":
        return NextResponse.json({
          ok: true,
          run: await createAgentWorkflowRun({
            tenantId: user.tenantId,
            workflowId: String(body.workflowId ?? ""),
            agentId: String(body.agentId ?? ""),
            objective: String(body.objective ?? ""),
            requestedAction: body.requestedAction == null ? null : String(body.requestedAction),
            triggerKind: body.triggerKind == null ? undefined : String(body.triggerKind) as "MANUAL" | "SCHEDULED" | "EVENT",
            parentRunId: body.parentRunId == null ? null : String(body.parentRunId),
          }),
        }, { status: 202 });

      case "claim_run": {
        const run = await claimAgentWorkflowRun(user.tenantId, String(body.runId ?? ""));
        return run
          ? NextResponse.json({ ok: true, run })
          : NextResponse.json({ ok: false, error: "run_not_claimable" }, { status: 409 });
      }

      case "complete_run": {
        const run = await completeAgentWorkflowRun({
          tenantId: user.tenantId,
          runId: String(body.runId ?? ""),
          status: String(body.status ?? "COMPLETED") as "COMPLETED" | "FAILED" | "BLOCKED",
          evidenceState: String(body.evidenceState ?? "UNMEASURABLE") as "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE",
          retestStatus: body.retestStatus == null ? undefined : String(body.retestStatus) as "NOT_RUN" | "PENDING" | "PASSED" | "FAILED" | "UNMEASURABLE",
          resultSummary: body.resultSummary && typeof body.resultSummary === "object" ? body.resultSummary as Record<string, unknown> : {},
        });
        return run
          ? NextResponse.json({ ok: true, run })
          : NextResponse.json({ ok: false, error: "run_not_running" }, { status: 409 });
      }

      case "remember":
        return NextResponse.json({
          ok: true,
          memory: await recordAgentMemory({
            tenantId: user.tenantId,
            agentId: String(body.agentId ?? ""),
            memoryKey: String(body.memoryKey ?? ""),
            content: String(body.content ?? ""),
            sourceRefs: Array.isArray(body.sourceRefs) ? body.sourceRefs.map(String) : [],
            evidenceIds: Array.isArray(body.evidenceIds) ? body.evidenceIds.map(String) : [],
            expiresAt: body.expiresAt == null ? null : String(body.expiresAt),
            metadata: body.metadata && typeof body.metadata === "object" ? body.metadata as Record<string, unknown> : {},
          }),
        }, { status: 201 });

      case "delegate":
        return NextResponse.json({
          ok: true,
          delegation: await delegateAgent({
            tenantId: user.tenantId,
            sourceAgentId: String(body.sourceAgentId ?? ""),
            targetAgentId: String(body.targetAgentId ?? ""),
            purpose: String(body.purpose ?? ""),
            scope: body.scope && typeof body.scope === "object" ? body.scope as Record<string, unknown> : {},
            workflowId: body.workflowId == null ? null : String(body.workflowId),
            maxDepth: typeof body.maxDepth === "number" ? body.maxDepth : 1,
            expiresAt: String(body.expiresAt ?? ""),
            createdBy: user.id,
          }),
        }, { status: 201 });

      default:
        return NextResponse.json({ ok: false, error: "unsupported_operation" }, { status: 400 });
    }
  } catch (error) {
    console.error("ELITZE agent workflow operation failed", error);
    const message = error instanceof Error ? error.message : "agent_workflow_operation_failed";
    const clientErrors = new Set([
      "invalid_workflow_input",
      "unknown_security_skill",
      "workflow_not_found",
      "workflow_disabled",
      "agent_identity_unavailable",
      "self_delegation_forbidden",
      "delegation_agent_identity_unavailable",
      "delegation_expiry_invalid",
      "invalid_workflow_channel",
      "invalid_workflow_trigger",
      "scheduled_workflow_requires_schedule",
      "invalid_workflow_autonomy",
    ]);
    return NextResponse.json({ ok: false, error: clientErrors.has(message) ? message : "agent_workflow_operation_failed" }, { status: clientErrors.has(message) ? 400 : 503 });
  }
}
