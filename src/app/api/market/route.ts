import { db } from "@/db";
import {
  agents,
  asiControls,
  discoveries,
  enforcementEvents,
  hitlApprovals,
  marketGaps,
} from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { asc, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();

    const [
      gapRows,
      agentRows,
      discoveryRows,
      approvalRows,
      asiRows,
      eventRows,
      stats,
    ] = await Promise.all([
      db.select().from(marketGaps).orderBy(desc(marketGaps.differentiator), asc(marketGaps.id)),
      db.select().from(agents).orderBy(desc(agents.riskScore)),
      db.select().from(discoveries).orderBy(desc(discoveries.discoveredAt)),
      db
        .select()
        .from(hitlApprovals)
        .orderBy(desc(hitlApprovals.requestedAt)),
      db.select().from(asiControls).orderBy(asc(asiControls.code)),
      db
        .select()
        .from(enforcementEvents)
        .orderBy(desc(enforcementEvents.createdAt))
        .limit(12),
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
        headline:
          "Buyers are past chatbot guardrails. They want discovery, containment, NHI, HITL, and ASI-mapped evidence.",
        sources: [
          "Palo Alto 2026 Agentic AI Security POC checklist",
          "OWASP ASI Top 10 for Agentic Applications 2026",
          "Gartner AI Security Platforms / AI TRiSM",
          "NIST AI Agent Standards Initiative",
          "MintMCP governance-containment gap study",
          "CISA / DoD careful adoption of agentic AI",
        ],
        overTheTop: [
          "Intent-mismatch detection + purpose binding (not just allow/deny logs)",
          "Shadow agent & MCP discovery with auto-quarantine",
          "Per-agent non-human identity + short-lived vaulted credentials",
          "Escalation-only HITL for irreversible / financial / external actions",
          "Memory integrity (ASI06) — still a rare differentiator",
          "Full OWASP ASI01–ASI10 control matrix with live coverage scores",
          "Insurance-ready MTTR + evidence packs (planned)",
        ],
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Failed to load market intelligence" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as {
      action?: string;
      id?: number;
      decidedBy?: string;
    };

    if (body.action === "approve" || body.action === "deny") {
      if (!body.id) {
        return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
      }
      await db
        .update(hitlApprovals)
        .set({
          status: body.action === "approve" ? "approved" : "denied",
          decidedAt: new Date(),
          decidedBy: body.decidedBy ?? "operator@elitze.io",
        })
        .where(eq(hitlApprovals.id, body.id));
      return NextResponse.json({ ok: true });
    }

    if (body.action === "claim-discovery") {
      if (!body.id) {
        return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
      }
      await db
        .update(discoveries)
        .set({ status: "claimed" })
        .where(eq(discoveries.id, body.id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: "Mutation failed" }, { status: 500 });
  }
}
