import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

function ratioMetric(numerator: number, denominator: number) {
  if (denominator === 0) return { value: null, state: "UNMEASURABLE" } as const;
  return { value: Number(((numerator / denominator) * 100).toFixed(2)), state: "MEASURABLE" } as const;
}

export async function GET() {
  try {
    const db = getDb();
    const [events, decisions, feedback, approvals] = await Promise.all([
      db.execute(sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE severity IN ('critical','high'))::int AS high_impact,
        AVG(latency_ms)::float AS avg_latency_ms,
        COUNT(*) FILTER (WHERE intent_mismatch = true)::int AS intent_mismatches
        FROM enforcement_events`),
      db.execute(sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE decision = 'allow')::int AS allowed,
        COUNT(*) FILTER (WHERE decision = 'deny')::int AS denied,
        COUNT(*) FILTER (WHERE decision = 'hitl')::int AS hitl
        FROM security_decisions`),
      db.execute(sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE verdict IN ('malicious','confirmed_malicious'))::int AS malicious,
        COUNT(*) FILTER (WHERE verdict IN ('benign','confirmed_benign'))::int AS benign
        FROM analyst_feedback`),
      db.execute(sql`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status IN ('approved','rejected','denied'))::int AS decided
        FROM hitl_approvals`),
    ]);

    const event = events.rows[0] as Record<string, number | null>;
    const decision = decisions.rows[0] as Record<string, number | null>;
    const fb = feedback.rows[0] as Record<string, number | null>;
    const approval = approvals.rows[0] as Record<string, number | null>;

    const autonomousRate = ratioMetric(Number(decision.allowed ?? 0), Number(decision.total ?? 0));
    const analystCoverage = ratioMetric(Number(fb.total ?? 0), Number(decision.total ?? 0));
    const falsePositiveProxy = fb.total
      ? ratioMetric(Number(fb.benign ?? 0), Number(fb.total ?? 0))
      : { value: null, state: "UNMEASURABLE" as const };

    return NextResponse.json({
      ok: true,
      source: "database",
      metrics: {
        enforcementEvents: Number(event.total ?? 0),
        highImpactEvents: Number(event.high_impact ?? 0),
        averageEnforcementLatencyMs: event.avg_latency_ms === null ? null : Number(event.avg_latency_ms),
        intentMismatches: Number(event.intent_mismatches ?? 0),
        securityDecisions: Number(decision.total ?? 0),
        deniedDecisions: Number(decision.denied ?? 0),
        humanReviewDecisions: Number(decision.hitl ?? 0),
        autonomousDecisionRate: autonomousRate,
        analystFeedbackCount: Number(fb.total ?? 0),
        analystCoverage,
        feedbackBenignShare: falsePositiveProxy,
        pendingApprovals: Number(approval.pending ?? 0),
        decidedApprovals: Number(approval.decided ?? 0),
      },
      measurementPolicy: "Metrics with insufficient observations are returned as null with UNMEASURABLE; no synthetic values are generated.",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "SOC metrics data plane unavailable." }, { status: 503 });
  }
}
