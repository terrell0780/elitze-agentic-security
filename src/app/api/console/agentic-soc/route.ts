import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, assertSameOrigin } from "@/lib/auth";
import { getPgPool } from "@/db";
import { runAgenticSocGraph, testTenantNimConnection } from "@/lib/elitze-secure/agentic-soc-graph";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const db = getPgPool();
    const [modelRows, eventCounts, latestRun] = await Promise.all([
      db.query(
        `SELECT id,name,model,base_url,metadata
         FROM ai_connections
         WHERE tenant_id=$1 AND enabled=true AND kind='model'
           AND (
             metadata->>'provider'='NVIDIA_NIM'
             OR name ILIKE '%NVIDIA NIM%'
             OR base_url ILIKE '%integrate.api.nvidia.com%'
           )
         ORDER BY updated_at DESC,created_at DESC LIMIT 1`,
        [user.tenantId],
      ),
      db.query(
        `SELECT count(*)::int AS total,
           count(*) FILTER (WHERE evidence_state='OBSERVED')::int AS observed,
           max(observed_at) FILTER (WHERE evidence_state='OBSERVED') AS latest_observed_at
         FROM security_fabric_events
         WHERE tenant_id=$1 AND observed_at > now() - interval '30 days'`,
        [user.tenantId],
      ),
      db.query(
        `SELECT id,status,evidence_state AS "evidenceState",started_at AS "startedAt",completed_at AS "completedAt",summary
         FROM autonomous_analyst_runs WHERE tenant_id=$1 ORDER BY started_at DESC,id DESC LIMIT 1`,
        [user.tenantId],
      ),
    ]);
    const model = modelRows.rows[0] ?? null;
    const modelMetadata = model?.metadata && typeof model.metadata === "object"
      ? model.metadata as Record<string, unknown>
      : {};
    const lastProbeStatus = modelMetadata.lastProbeStatus === "CONNECTED" || modelMetadata.lastProbeStatus === "ERROR"
      ? modelMetadata.lastProbeStatus
      : "CONFIGURED_NOT_VERIFIED";
    const counts = eventCounts.rows[0] ?? {};
    return NextResponse.json({
      ok: true,
      orchestration: "LangGraph StateGraph",
      recursiveReviewLimit: 2,
      evidencePolicy: "Only tenant-scoped OBSERVED events are analyzed. Recursive model review cannot add findings or change source severity.",
      modelProvider: {
        name: model ? "NVIDIA NIM" : "NVIDIA NIM",
        configured: Boolean(model),
        status: model ? lastProbeStatus : "NOT_CONFIGURED",
        model: model?.model ?? null,
        baseUrl: model?.base_url ?? null,
        secretStoredEncrypted: Boolean(model),
        note: "Connection configuration is not a successful inference test. Use Probe NIM to verify the selected model endpoint.",
      },
      evidence: {
        state: Number(counts.observed ?? 0) > 0 ? "OBSERVED" : Number(counts.total ?? 0) > 0 ? "UNKNOWN" : "UNMEASURABLE",
        observedEventCount: Number(counts.observed ?? 0),
        nonObservedEventCount: Math.max(0, Number(counts.total ?? 0) - Number(counts.observed ?? 0)),
        latestObservedAt: counts.latest_observed_at ?? null,
        windowDays: 30,
      },
      latestRun: latestRun.rows[0] ?? null,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE agentic SOC status failed", error);
    return NextResponse.json({ ok: false, error: "agentic_soc_unavailable", evidenceState: "UNMEASURABLE" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!(await assertSameOrigin(request))) return NextResponse.json({ ok: false, error: "csrf_rejected" }, { status: 403 });

  const body = await request.json().catch(() => null) as { action?: unknown; trigger?: unknown } | null;
  const action = typeof body?.action === "string" ? body.action : "run";

  if (action === "probe-nim") {
    try {
      const result = await testTenantNimConnection(user.tenantId);
      return NextResponse.json(result, {
        status: result.ok ? 200 : 503,
        headers: { "cache-control": "no-store" },
      });
    } catch (error) {
      console.error("ELITZE NVIDIA NIM probe failed", error);
      return NextResponse.json({ ok: false, status: "ERROR", error: "nim_connection_configuration_invalid" }, { status: 503 });
    }
  }

  if (action !== "run") return NextResponse.json({ ok: false, error: "unsupported_action" }, { status: 400 });
  const trigger = body?.trigger === "EVENT" || body?.trigger === "SCHEDULED" ? body.trigger : "MANUAL";

  try {
    const result = await runAgenticSocGraph(user.tenantId, user.id, trigger);
    return NextResponse.json({ ok: true, ...result }, { status: 202, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE LangGraph security analysis failed", error);
    return NextResponse.json({ ok: false, error: "agentic_soc_run_failed", evidenceState: "UNMEASURABLE" }, { status: 503 });
  }
}
