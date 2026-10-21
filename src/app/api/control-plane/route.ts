import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { authorizeTenantAction, buildPrincipal } from "@/lib/elitze-secure/tenant-security";
import { AgentMcpControlPlane } from "@/lib/elitze-secure/agent-mcp-control-plane";

export const dynamic = "force-dynamic";

const controlPlane = new AgentMcpControlPlane();

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const principal = buildPrincipal({ tenantId: user.tenantId, subjectId: user.id, roles: [user.role] });
  const authz = authorizeTenantAction(principal, { tenantId: user.tenantId, permission: "security:read" });
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: 403 });
  return NextResponse.json(await controlPlane.snapshot(user.tenantId));
}

export async function POST(request: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  const principal = buildPrincipal({ tenantId: user.tenantId, subjectId: user.id, roles: [user.role] });
  const authz = authorizeTenantAction(principal, { tenantId: user.tenantId, permission: "security:write" });
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.operation !== "string") {
    return NextResponse.json({ error: "operation_required" }, { status: 400 });
  }

  try {
    switch (body.operation) {
      case "register_identity": {
        const result = await controlPlane.registerIdentity({
          tenantId: user.tenantId,
          name: typeof body.name === "string" ? body.name : "",
          kind: body.kind as "AGENT" | "MODEL" | "MCP_SERVER" | "TOOL",
          metadata: typeof body.metadata === "object" && body.metadata !== null ? body.metadata as Record<string, unknown> : {},
        });
        return NextResponse.json(result, { status: 201 });
      }
      case "observe_reachability":
        return NextResponse.json(await controlPlane.recordReachability({
          tenantId: user.tenantId,
          agentId: String(body.agentId ?? ""),
          resources: Array.isArray(body.resources) ? body.resources as never[] : [],
        }), { status: 201 });
      case "evaluate_action":
        return NextResponse.json(await controlPlane.evaluateAction({
          tenantId: user.tenantId,
          agentId: String(body.agentId ?? ""),
          action: String(body.action ?? ""),
          mcpServerId: typeof body.mcpServerId === "string" ? body.mcpServerId : undefined,
          toolId: typeof body.toolId === "string" ? body.toolId : undefined,
          modelId: typeof body.modelId === "string" ? body.modelId : undefined,
          providerId: typeof body.providerId === "string" ? body.providerId : undefined,
          dataClassification: body.dataClassification as "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | undefined,
          constraint: typeof body.constraint === "object" && body.constraint !== null ? body.constraint as Record<string, unknown> : {},
        }), { status: 201 });
      case "record_result":
        return NextResponse.json(await controlPlane.recordResult({
          tenantId: user.tenantId,
          actionRequestId: String(body.actionRequestId ?? ""),
          status: body.status as "EXECUTED" | "DENIED" | "FAILED" | "CONSTRAINED",
          summary: typeof body.summary === "string" ? body.summary : undefined,
        }), { status: 200 });
      case "retest":
        return NextResponse.json(await controlPlane.retest({
          tenantId: user.tenantId,
          actionRequestId: String(body.actionRequestId ?? ""),
          passed: body.passed === true,
          reason: typeof body.reason === "string" ? body.reason : undefined,
        }), { status: 200 });
      default:
        return NextResponse.json({ error: "unsupported_operation" }, { status: 400 });
    }
  } catch (error) {
    console.error("ELITZE control-plane operation failed", error);
    return NextResponse.json({ error: "control_plane_operation_failed" }, { status: 503 });
  }
}
