import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool, isDatabaseConfigured } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "database_unconfigured", evidenceState: "UNMEASURABLE" }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  try {
    const db = getPgPool();
    const tenantId = user.tenantId;
    const [agents, mcpServers, policies, approvals, decisions, graph, tests] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM agent_identities WHERE tenant_id=$1 AND active=true`, [tenantId]),
      db.query(`SELECT COUNT(*)::int AS count FROM mcp_gateway_servers WHERE tenant_id=$1 AND active=true`, [tenantId]),
      db.query(`SELECT COUNT(*)::int AS count FROM security_policies WHERE tenant_id=$1 AND active=true AND (expires_at IS NULL OR expires_at>now())`, [tenantId]),
      db.query(`SELECT
          COUNT(*) FILTER (WHERE status='PENDING' AND (expires_at IS NULL OR expires_at>now()))::int AS pending,
          COUNT(*)::int AS total
        FROM security_approvals WHERE tenant_id=$1`, [tenantId]),
      db.query(`SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE decision='DENY')::int AS denied,
          COUNT(*) FILTER (WHERE decision='REQUIRE_APPROVAL')::int AS approval_required,
          MAX(created_at) AS latest_at
        FROM mcp_gateway_decisions WHERE tenant_id=$1`, [tenantId]),
      db.query(`SELECT
          (SELECT COUNT(*)::int FROM security_graph_nodes WHERE tenant_id=$1 AND active=true) AS nodes,
          (SELECT COUNT(*)::int FROM security_graph_edges WHERE tenant_id=$1 AND active=true) AS edges,
          (SELECT COUNT(*)::int FROM security_graph_evidence WHERE tenant_id=$1) AS evidence`, [tenantId]),
      db.query(`SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status='QUEUED')::int AS queued,
          COUNT(*) FILTER (WHERE status='RUNNING')::int AS running,
          COUNT(*) FILTER (WHERE status='COMPLETED')::int AS completed,
          COUNT(*) FILTER (WHERE status='FAILED')::int AS failed,
          MAX(updated_at) AS latest_at
        FROM security_test_requests WHERE tenant_id=$1`, [tenantId]),
    ]);

    const row = <T>(result: { rows: unknown[] }) => (result.rows[0] ?? {}) as T;
    const a = row<{ count:number }>(agents);
    const m = row<{ count:number }>(mcpServers);
    const p = row<{ count:number }>(policies);
    const ap = row<{ pending:number; total:number }>(approvals);
    const d = row<{ total:number; denied:number; approval_required:number; latest_at:string|null }>(decisions);
    const g = row<{ nodes:number; edges:number; evidence:number }>(graph);
    const t = row<{ total:number; queued:number; running:number; completed:number; failed:number; latest_at:string|null }>(tests);

    return NextResponse.json({
      ok: true,
      tenantId,
      source: "tenant-scoped PostgreSQL records",
      evidenceState: "OBSERVED",
      metrics: {
        agentIdentities: Number(a.count ?? 0),
        activeMcpServers: Number(m.count ?? 0),
        activePolicies: Number(p.count ?? 0),
        pendingApprovals: Number(ap.pending ?? 0),
        approvalRequests: Number(ap.total ?? 0),
        gatewayDecisions: Number(d.total ?? 0),
        deniedGatewayDecisions: Number(d.denied ?? 0),
        approvalRequiredDecisions: Number(d.approval_required ?? 0),
        graphNodes: Number(g.nodes ?? 0),
        graphEdges: Number(g.edges ?? 0),
        graphEvidence: Number(g.evidence ?? 0),
        securityTests: Number(t.total ?? 0),
        queuedTests: Number(t.queued ?? 0),
        runningTests: Number(t.running ?? 0),
        completedTests: Number(t.completed ?? 0),
        failedTests: Number(t.failed ?? 0),
        latestDecisionAt: d.latest_at ?? null,
        latestTestAt: t.latest_at ?? null,
      },
      measurementPolicy: "All values come from the authenticated tenant PostgreSQL boundary. Empty counts are real zero-record states; unavailable measurements are not substituted with synthetic values.",
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE tenant overview load failed", error);
    return NextResponse.json({ ok: false, error: "tenant_overview_unavailable", evidenceState: "UNMEASURABLE" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}