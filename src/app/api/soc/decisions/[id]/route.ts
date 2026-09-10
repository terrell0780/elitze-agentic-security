import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { decisionEvidence, evidenceRecords, securityDecisions } from "@/db/schema";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const decisionId = Number(id);
  if (!Number.isInteger(decisionId) || decisionId <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid decision id." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [decision] = await db.select({
      id: securityDecisions.id,
      requestHash: securityDecisions.requestHash,
      actorId: securityDecisions.actorId,
      agentId: securityDecisions.agentId,
      action: securityDecisions.action,
      decision: securityDecisions.decision,
      reasons: securityDecisions.reasons,
      policyVersion: securityDecisions.policyVersion,
      createdAt: securityDecisions.createdAt,
    }).from(securityDecisions).where(eq(securityDecisions.id, decisionId)).limit(1);

    if (!decision) return NextResponse.json({ ok: false, error: "Decision not found." }, { status: 404 });

    const evidence = await db.select({
      id: evidenceRecords.id,
      eventType: evidenceRecords.eventType,
      subject: evidenceRecords.subject,
      contentHash: evidenceRecords.contentHash,
      payload: evidenceRecords.payload,
      createdAt: evidenceRecords.createdAt,
      relationship: decisionEvidence.relationship,
      note: decisionEvidence.note,
    }).from(decisionEvidence)
      .innerJoin(evidenceRecords, eq(evidenceRecords.id, decisionEvidence.evidenceId))
      .where(and(eq(decisionEvidence.decisionId, decisionId)))
      .orderBy(asc(evidenceRecords.createdAt));

    return NextResponse.json({
      ok: true,
      decision,
      evidence,
      explainability: {
        mode: "evidence_backed",
        evidenceCount: evidence.length,
        explanation: evidence.length
          ? "The decision is accompanied by linked evidence records. Review the relationship, event type, subject, hash, and payload before relying on the conclusion."
          : "No linked evidence records are currently attached to this decision.",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Decision evidence data plane unavailable." }, { status: 503 });
  }
}
