import { getDb } from "@/db";
import { agents, asiControls, discoveries, enforcementEvents, hitlApprovals, marketGaps } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY);
}

export async function GET() {
  try {
    const db = getDb();
    const [gapRows, agentRows, discoveryRows, approvalRows, asiRows, eventRows, stats] = await Promise.all([
      db.select().from(marketGaps).orderBy(desc(marketGaps.differentiator), asc(marketGaps.id)),
      db.select().from(agents).orderBy(desc(agents.riskScore), desc(agents.id)),
      db.select().from(discoveries).orderBy(desc(discoveries.discoveredAt)),
      db.select().from(hitlApprovals).orderBy(desc(hitlApprovals.requestedAt)),
      db.select().from(asiControls).orderBy(asc(asiControls.code)),
      db.select().from(enforcementEvents).orderBy(desc(enforcementEvents.createdAt)).limit(50),
      db.execute(sql`
        SELECT
          (SELECT count(*) FROM agents) AS agents,
          (SELECT count(*) FROM agents WHERE status = 'shadow') AS shadow_agents,
          (SELECT count(*) FROM discoveries WHERE status = 'open') AS open_discoveries,
          (SELECT count(*) FROM hitl_approvals WHERE status = 'pending') AS pending_approvals,
          (SELECT coalesce(avg(coverage), 0) FROM asi_controls) AS asi_avg,
          (SELECT count(*) FROM market_gaps WHERE elitze_status = 'shipped') AS shipped_gaps,
          (SELECT count(*) FROM market_gaps WHERE differentiator = true) AS differentiators
      `),
    ]);
    const s = (stats.rows[0] ?? {}) as Record<string, string | number>;
    return NextResponse.json({
      ok: true,
      stats: {
        agents: Number(s.agents ?? 0),
        shadowAgents: Number(s.shadow_agents ?? 0),
        openDiscoveries: Number(s.open_discoveries ?? 0),
        pendingApprovals: Number(s.pending_approvals ?? 0),
        asiAvg: Math.round(Number(s.asi_avg ?? 0)),
        shippedGaps: Number(s.shipped_gaps ?? 0),
        differentiators: Number(s.differentiators ?? 0),
      },
      gaps: gapRows,
      agents: agentRows,
      discoveries: discoveryRows,
      approvals: approvalRows,
      asi: asiRows,
      events: eventRows,
      insights: {
        headline: "ELITZE operational intelligence is sourced from configured security records, not fabricated telemetry.",
        sources: ["OWASP", "NIST", "CISA", "CVE / NVD", "EPSS"],
      },
    });
  } catch (error) {
    console.error("ELITZE market intelligence load failed", error);
    return NextResponse.json({ ok: false, error: "market_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const db = getDb();
    const body = (await request.json()) as { action?: unknown; id?: unknown; decidedBy?: unknown };
    const id = typeof body.id === "number" && Number.isInteger(body.id) && body.id > 0 ? body.id : null;
    const decidedBy = typeof body.decidedBy === "string" && body.decidedBy.length <= 120 ? body.decidedBy : "operator";

    if ((body.action === "approve" || body.action === "deny") && id) {
      await db.update(hitlApprovals).set({ status: body.action === "approve" ? "approved" : "denied", decidedAt: new Date(), decidedBy }).where(eq(hitlApprovals.id, id));
      return NextResponse.json({ ok: true });
    }
    if (body.action === "claim-discovery" && id) {
      await db.update(discoveries).set({ status: "claimed" }).where(eq(discoveries.id, id));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  } catch (error) {
    console.error("ELITZE market mutation failed", error);
    return NextResponse.json({ ok: false, error: "mutation_failed" }, { status: 503 });
  }
}
