import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { observeMetasploitBridge } from "@/lib/elitze-secure/security-tool-integrations";
import { upsertGraphNode } from "@/lib/elitze-secure/security-graph-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }

  const body = await request.json().catch(() => null) as { tenantId?: unknown; operation?: unknown } | null;
  if (!body || typeof body.tenantId !== "string" || !uuidPattern.test(body.tenantId)) {
    return NextResponse.json({ ok: false, error: "valid_tenant_id_required" }, { status: 400, headers: privateHeaders });
  }
  if (body.operation !== "health" && body.operation !== "sessions") {
    return NextResponse.json({
      ok: false,
      error: "operation_must_be_health_or_sessions",
      supportedOperations: ["health", "sessions"],
      moduleExecution: "not_exposed_by_this_endpoint",
    }, { status: 400, headers: privateHeaders });
  }

  const result = await observeMetasploitBridge(body.operation, body.tenantId);
  if (!result.ok) {
    const status = result.status === "NOT_CONFIGURED" ? 503 : result.status === "UNAVAILABLE" ? 502 : 502;
    return NextResponse.json({
      ok: false,
      source: "metasploit-rpc-bridge",
      status: result.status,
      error: result.error,
      setup: "Configure ELITZE_METASPLOIT_BRIDGE_URL and ELITZE_METASPLOIT_BRIDGE_TOKEN for the separately deployed HTTPS bridge.",
    }, { status, headers: privateHeaders });
  }

  const observedAt = new Date().toISOString();
  if (result.operation === "health") {
    try {
      await upsertGraphNode({
        tenantId: body.tenantId,
        nodeType: "SERVICE_ACCOUNT",
        subjectKey: "metasploit-rpc-bridge",
        displayName: "Metasploit RPC bridge",
        source: "metasploit-rpc-bridge",
        evidenceState: "OBSERVED",
        sourceRef: "metasploit:bridge:health",
        observedAt,
        metadata: { connected: true, version: result.version, operations: ["health", "sessions"], moduleExecutionExposed: false },
      });
    } catch (error) {
      console.error("ELITZE Metasploit health evidence persistence failed", error);
      return NextResponse.json({ ok: false, error: "metasploit_evidence_persist_failed" }, { status: 503, headers: privateHeaders });
    }
    return NextResponse.json({
      ok: true,
      source: "metasploit-rpc-bridge",
      operation: result.operation,
      status: "CONNECTED",
      version: result.version,
      moduleExecutionExposed: false,
      observedAt,
    }, { headers: privateHeaders });
  }

  try {
    for (const session of result.sessions) {
      await upsertGraphNode({
        tenantId: body.tenantId,
        nodeType: "RUNTIME_ACTION",
        subjectKey: `metasploit-session:${session.id}`,
        displayName: `Metasploit session ${session.id}`,
        source: "metasploit-rpc-bridge",
        evidenceState: "OBSERVED",
        sourceRef: `metasploit:session:${session.id}`,
        observedAt,
        metadata: {
          sessionId: session.id,
          sessionType: session.type,
          target: session.target,
          openedAt: session.openedAt,
          commandsOrCredentialsStored: false,
        },
      });
    }
  } catch (error) {
    console.error("ELITZE Metasploit session evidence persistence failed", error);
    return NextResponse.json({ ok: false, error: "metasploit_evidence_persist_failed" }, { status: 503, headers: privateHeaders });
  }

  return NextResponse.json({
    ok: true,
    source: "metasploit-rpc-bridge",
    operation: result.operation,
    status: "CONNECTED",
    sessionsObserved: result.sessions.length,
    sessions: result.sessions,
    moduleExecutionExposed: false,
    observedAt,
  }, { headers: privateHeaders });
}
