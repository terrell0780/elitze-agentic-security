import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";
import { runnerConfigured } from "@/lib/security-validation/runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const db = getPgPool();
    const [nodes, edges, requests, requestStatuses, completedEvidence, findings, severities, events, runnerIsConfigured] = await Promise.all([
      db.query("SELECT count(*)::int AS count FROM security_graph_nodes WHERE tenant_id=$1 AND active=true", [user.tenantId]),
      db.query("SELECT count(*)::int AS count FROM security_graph_edges WHERE tenant_id=$1 AND active=true", [user.tenantId]),
      db.query("SELECT count(*)::int AS count FROM security_test_requests WHERE tenant_id=$1", [user.tenantId]),
      db.query("SELECT status, count(*)::int AS count FROM security_test_requests WHERE tenant_id=$1 GROUP BY status ORDER BY status", [user.tenantId]),
      db.query("SELECT count(*)::int AS count, max(completed_at) AS last_completed_at FROM security_test_requests WHERE tenant_id=$1 AND status='COMPLETED' AND evidence_state='AVAILABLE'", [user.tenantId]),
      db.query("SELECT count(*)::int AS count FROM security_test_findings WHERE tenant_id=$1", [user.tenantId]),
      db.query("SELECT severity, evidence_state AS \"evidenceState\", count(*)::int AS count FROM security_test_findings WHERE tenant_id=$1 GROUP BY severity,evidence_state ORDER BY severity,evidence_state", [user.tenantId]),
      db.query("SELECT count(*)::int AS count, max(created_at) AS last_observed_at FROM security_validation_events WHERE tenant_id=$1", [user.tenantId]),
      runnerConfigured().catch(() => false),
    ]);

    const graphNodeCount = Number(nodes.rows[0]?.count ?? 0);
    const graphEdgeCount = Number(edges.rows[0]?.count ?? 0);
    const requestCount = Number(requests.rows[0]?.count ?? 0);
    const completedCount = Number(completedEvidence.rows[0]?.count ?? 0);
    const findingCount = Number(findings.rows[0]?.count ?? 0);
    const eventCount = Number(events.rows[0]?.count ?? 0);
    const generatedAt = new Date().toISOString();

    const packet = {
      schemaVersion: "elitze.evidence-snapshot.v1",
      product: "ELITZE Agentic Security",
      generatedAt,
      scope: "Current authenticated tenant; aggregate counts only",
      tenantReference: user.tenantId,
      evidence: {
        securityGraph: { state: "OBSERVED", activeNodes: graphNodeCount, activeEdges: graphEdgeCount, source: "security_graph_nodes + security_graph_edges" },
        validation: {
          state: completedCount > 0 ? "OBSERVED" : "INSUFFICIENT_EVIDENCE",
          totalRequests: requestCount,
          completedWithAvailableEvidence: completedCount,
          statuses: requestStatuses.rows,
          lastCompletedWithEvidenceAt: completedEvidence.rows[0]?.last_completed_at ?? null,
          source: "security_test_requests",
        },
        findings: { state: findingCount > 0 ? "OBSERVED" : "NO_FINDINGS_RECORDED", total: findingCount, bySeverityAndEvidenceState: severities.rows, source: "security_test_findings" },
        telemetry: { state: eventCount > 0 ? "OBSERVED" : "NO_EVENTS_RECORDED", eventCount, lastObservedAt: events.rows[0]?.last_observed_at ?? null, source: "security_validation_events" },
        runner: { state: runnerIsConfigured ? "CONFIGURED_NOT_LIVE_VERIFIED" : "NOT_CONFIGURED", liveHealthVerified: false, endToEndScanVerifiedByThisSnapshot: false },
      },
      notVerifiedByThisSnapshot: [
        { control: "production_password_reset_delivery", state: "NOT_RUNTIME_VERIFIED" },
        { control: "external_integrations_end_to_end", state: "NOT_RUNTIME_VERIFIED" },
        { control: "agent_and_mcp_runtime_enforcement", state: "NOT_RUNTIME_VERIFIED" },
        { control: "independent_security_assessment", state: "NOT_PROVIDED" },
        { control: "customer_revenue_and_buyer_interest", state: "OUT_OF_BAND_EVIDENCE_REQUIRED" },
        { control: "intellectual_property_assignment_and_provenance", state: "OUT_OF_BAND_EVIDENCE_REQUIRED" },
      ],
      integrityNotes: [
        "This is a tenant-scoped operational snapshot, not a certification or independent audit.",
        "Counts describe records stored in the database; they do not prove external systems are currently healthy.",
        "No targets, credentials, finding descriptions, raw event payloads, or secrets are included.",
        "An empty result means no evidence was recorded in the queried tables; it does not prove the environment is secure.",
      ],
    };

    return new NextResponse(JSON.stringify(packet, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename=elitze-evidence-snapshot-${generatedAt.slice(0, 10)}.json`,
        "cache-control": "no-store, private",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("ELITZE evidence snapshot generation failed", error);
    return NextResponse.json({ ok: false, error: "evidence_snapshot_unavailable", evidenceState: "UNAVAILABLE" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
