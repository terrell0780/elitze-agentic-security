import { getDb } from "@/db";
import {
  agents,
  asiControls,
  discoveries,
  enforcementEvents,
  hitlApprovals,
  marketGaps,
} from "@/db/schema";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { asc, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
      db.select().from(agents).orderBy(desc(agents.riskScore)),
      db.select().from(discoveries).orderBy(desc(discoveries.discoveredAt)),
      db.select().from(hitlApprovals).orderBy(desc(hitlApprovals.requestedAt)),
      db.select().from(asiControls).orderBy(asc(asiControls.code)),
      db.select().from(enforcementEvents).orderBy(desc(enforcementEvents.createdAt)).limit(100),
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
    });
  } catch (error) {
    console.error("ELITZE market data load failed", error);
    return NextResponse.json({ ok: false, error: "market_data_unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });

  const { action, id, decidedBy } = body as { action?: unknown; id?: unknown; decidedBy?: unknown };
  if (!Number.isInteger(id) || Number(id) < 1) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  if (action !== "approve" && action !== "deny" && action !== "claim-discovery") {
    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  }
  if (decidedBy !== undefined && (typeof decidedBy !== "string" || decidedBy.length > 200)) {
    return NextResponse.json({ ok: false, error: "invalid_decided_by" }, { status: 400 });
  }

  try {
    const db = getDb();
    if (action === "claim-discovery") {
      await db.update(discoveries).set({ status: "claimed" }).where(eq(discoveries.id, id as number));
    } else {
      await db.update(hitlApprovals).set({
        status: action === "approve" ? "approved" : "denied",
        decidedAt: new Date(),
        decidedBy: typeof decidedBy === "string" ? decidedBy : "internal-operator",
      }).where(eq(hitlApprovals.id, id as number));
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ELITZE market mutation failed", error);
    return NextResponse.json({ ok: false, error: "mutation_failed" }, { status: 503 });
  }
}
