import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export async function GET() {
  try {
    const db = getDb();
    const [decisions, events, paths, redTeam, evidence] = await Promise.all([
      db.execute(sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE decision = 'deny')::int AS denied
        FROM security_decisions`),
      db.execute(sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE severity IN ('critical','high'))::int AS high_impact
        FROM enforcement_events`),
      db.execute(sql`SELECT
        COUNT(*)::int AS resolved
        FROM attack_paths
        WHERE status IN ('resolved','closed')`),
      db.execute(sql`SELECT
        COUNT(*) FILTER (WHERE status IN ('completed','complete','succeeded'))::int AS completed
        FROM red_team_runs`),
      db.execute(sql`SELECT COUNT(*)::int AS total FROM evidence_records`),
    ]);

    const decision = decisions.rows[0] as Record<string, number | null>;
    const event = events.rows[0] as Record<string, number | null>;
    const path = paths.rows[0] as Record<string, number | null>;
    const team = redTeam.rows[0] as Record<string, number | null>;
    const evidenceRow = evidence.rows[0] as Record<string, number | null>;

    return NextResponse.json({
      ok: true,
      source: "database",
      observed: {
        securityDecisions: Number(decision.total ?? 0),
        deniedDecisions: Number(decision.denied ?? 0),
        highImpactEvents: Number(event.high_impact ?? 0),
        resolvedAttackPaths: Number(path.resolved ?? 0),
        completedRedTeamRuns: Number(team.completed ?? 0),
        evidenceRecords: Number(evidenceRow.total ?? 0),
        enforcementEvents: Number(event.total ?? 0),
      },
      measurementPolicy: "Observed signals come only from persisted ELITZE records. Dollar value requires customer-supplied assumptions and is never inferred from synthetic data.",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "ROI data plane unavailable." }, { status: 503 });
  }
}
