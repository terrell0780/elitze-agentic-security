import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";
import { verifyEvidenceReceipt } from "@/lib/elitze-secure/evidence-receipt";
import { evaluateProgressiveProof } from "@/lib/elitze-secure/progressive-proofing";
import { evaluateEvidenceExpression, type EvidenceExpressionRecord } from "@/lib/elitze-secure/evidence-expression";

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

function toRecord(row: DecisionRow): EvidenceExpressionRecord {
  const proof = evaluateProgressiveProof({
    evidenceState: row.evidence_state,
    sourceRef: row.source_ref,
    observedAt: row.observed_at ?? row.requested_at,
    recordHash: row.evidence_hash,
    retestStatus: row.retest_status,
    upstreamResultHash: row.upstream_result_hash,
    receiptVerified: receiptVerified(row),
  });
  return {
    decisionRef: row.decision_ref,
    requestId: row.request_id,
    subject: row.tool_name || row.action || row.decision_ref,
    decision: row.decision,
    evidenceState: row.evidence_state ?? "UNKNOWN",
    stage: proof.stage,
    nextAction: proof.nextAction,
    observedAt: row.observed_at ?? row.requested_at ?? null,
  };
}

async function loadRecords(tenantId: string): Promise<EvidenceExpressionRecord[]> {
  const result = await getPgPool().query<DecisionRow>(
    \`SELECT
      d.decision_ref,
      d.request_id,
      d.tool_name,
      d.action,
      d.decision,
      d.evidence_state,
      d.source_ref,
      d.observed_at,
      d.requested_at,
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
     LIMIT 50\`,
    [tenantId],
  );
  return result.rows.map(toRecord);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const records = await loadRecords(user.tenantId);
    return NextResponse.json({ ok: true, records, fieldSet: ["decisionRef", "requestId", "subject", "decision", "evidenceState", "stage", "nextAction", "observedAt"] }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE evidence debugger load failed", error);
    return NextResponse.json({ ok: false, error: "evidence_expression_unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { decisionRef?: unknown; expression?: unknown };
    const decisionRef = typeof body.decisionRef === "string" ? body.decisionRef.trim() : "";
    const expression = typeof body.expression === "string" ? body.expression.trim() : "";
    if (!decisionRef || !expression || expression.length > 500) {
      return NextResponse.json({ ok: false, error: "decision_ref_and_expression_required" }, { status: 400 });
    }

    const records = await loadRecords(user.tenantId);
    const record = records.find((item) => item.decisionRef === decisionRef);
    if (!record) return NextResponse.json({ ok: false, error: "evidence_record_not_found" }, { status: 404 });

    try {
      const result = evaluateEvidenceExpression(expression, record);
      return NextResponse.json({ ok: true, result, record, expression }, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "invalid_expression";
      return NextResponse.json({ ok: false, error: message, expression }, { status: 400 });
    }
  } catch (error) {
    console.error("ELITZE evidence debugger evaluation failed", error);
    return NextResponse.json({ ok: false, error: "evidence_expression_unavailable" }, { status: 503 });
  }
}
