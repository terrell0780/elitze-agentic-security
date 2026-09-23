import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";
import { verifyEvidenceReceipt } from "@/lib/elitze-secure/evidence-receipt";
import { evaluateProgressiveProof } from "@/lib/elitze-secure/progressive-proofing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DecisionRow = {
  decision_ref: string;
  request_id: string;
  tool_name: string;
  action: string;
  decision: string;
  evidence_state: string | null;
  source_ref: string | null;
  observed_at: string | null;
  requested_at: string | null;
  previous_evidence_hash: string | null;
  evidence_hash: string | null;
  evidence_signature: string | null;
  evidence_event: Record<string, unknown> | null;
  verification_status: string | null;
  upstream_result_hash: string | null;
  retest_status: string | null;
};

function subject(row: DecisionRow) {
  return row.tool_name || row.action || row.decision_ref;
}

function receiptVerified(row: DecisionRow) {
  if (row.verification_status === "VERIFIED") return true;
  const secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET;
  if (!secret || !row.evidence_hash || !row.evidence_signature || !row.evidence_event) return false;

  return verifyEvidenceReceipt(
    {
      event: row.evidence_event,
      previousRecordHash: row.previous_evidence_hash ?? null,
      recordHash: row.evidence_hash,
      signature: row.evidence_signature,
    },
    secret,
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const result = await getPgPool().query<DecisionRow>(
      `SELECT
        d.decision_ref,
        d.request_id,
        d.tool_name,
        d.action,
        d.decision,
        d.evidence_state,
        d.source_ref,
        d.observed_at,
        d.observed_at AS requested_at,
        d.previous_evidence_hash,
        d.evidence_hash,
        d.evidence_signature,
        d.evidence_event,
        d.verification_status,
        d.upstream_result_hash,
        r.retest_status
       FROM mcp_gateway_decisions d
       LEFT JOIN runtime_action_requests r
         ON r.id::text = d.request_id
        AND r.tenant_id = d.tenant_id
       WHERE d.tenant_id = $1
       ORDER BY d.created_at DESC
       LIMIT 50`,
      [user.tenantId],
    );

    const records = result.rows.map((row) => evaluateProgressiveProof({
      evidenceState: row.evidence_state,
      sourceRef: row.source_ref,
      observedAt: row.observed_at ?? row.requested_at,
      recordHash: row.evidence_hash,
      retestStatus: row.retest_status,
      upstreamResultHash: row.upstream_result_hash,
      receiptVerified: receiptVerified(row),
    }));

    const proofRecords = result.rows.map((row, index) => ({
      decisionRef: row.decision_ref,
      requestId: row.request_id,
      subject: subject(row),
      decision: row.decision,
      observedAt: row.observed_at ?? row.requested_at,
      ...records[index],
    }));

    const counts = proofRecords.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = (acc[item.stage] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      source: "tenant-scoped MCP evidence",
      progressiveProofing: true,
      records: proofRecords,
      counts,
      measurementPolicy: "Proof advances only from persisted evidence, signed receipt verification, an actual retest result, and an observed upstream result hash. Missing evidence remains UNMEASURABLE.",
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE progressive proofing load failed", error);
    return NextResponse.json(
      { ok: false, error: "progressive_proofing_unavailable", evidenceState: "UNMEASURABLE" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
