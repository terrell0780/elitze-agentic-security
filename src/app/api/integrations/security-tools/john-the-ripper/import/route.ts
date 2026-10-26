import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { summarizeJohnOutput } from "@/lib/elitze-secure/security-tool-integrations";
import { recordGraphEvidence, upsertGraphNode } from "@/lib/elitze-secure/security-graph-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }

  const body = await request.json().catch(() => null) as {
    tenantId?: unknown;
    scanId?: unknown;
    output?: unknown;
    hashFormat?: unknown;
  } | null;
  if (!body || typeof body.tenantId !== "string" || !uuidPattern.test(body.tenantId)) {
    return NextResponse.json({ ok: false, error: "valid_tenant_id_required" }, { status: 400, headers: privateHeaders });
  }
  if (typeof body.output !== "string") {
    return NextResponse.json({ ok: false, error: "john_show_output_required" }, { status: 400, headers: privateHeaders });
  }

  const scanId = typeof body.scanId === "string" ? body.scanId.trim() : new Date().toISOString().replace(/[:.]/g, "-");
  if (!/^[A-Za-z0-9._:-]{1,100}$/.test(scanId)) {
    return NextResponse.json({ ok: false, error: "invalid_scan_id" }, { status: 400, headers: privateHeaders });
  }
  const hashFormat = typeof body.hashFormat === "string" && /^[A-Za-z0-9_+.-]{1,80}$/.test(body.hashFormat)
    ? body.hashFormat
    : "unspecified";

  let summary;
  try {
    summary = summarizeJohnOutput(body.output);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "john_output_invalid",
    }, { status: 400, headers: privateHeaders });
  }

  const observedAt = new Date().toISOString();
  try {
    const node = await upsertGraphNode({
      tenantId: body.tenantId,
      nodeType: "EVIDENCE_RECORD",
      subjectKey: `john-the-ripper-audit:${scanId}`,
      displayName: `John the Ripper password-audit summary ${scanId}`,
      source: "john-the-ripper-import",
      evidenceState: "OBSERVED",
      sourceRef: `john-the-ripper:${scanId}`,
      observedAt,
      metadata: {
        scanId,
        hashFormat,
        crackedCount: summary.crackedCount,
        remainingCount: summary.remainingCount,
        accountRecordsObserved: summary.accountRecordsObserved,
        summaryObserved: summary.summaryObserved,
        plaintextPasswordsStored: false,
        accountLabelsStored: false,
      },
    });
    await recordGraphEvidence({
      tenantId: body.tenantId,
      nodeId: String(node.id),
      evidenceKind: "OBSERVATION",
      source: "john-the-ripper-import",
      sourceRef: `john-the-ripper:${scanId}`,
      observedAt,
      payload: {
        scanId,
        hashFormat,
        crackedCount: summary.crackedCount,
        remainingCount: summary.remainingCount,
        accountRecordsObserved: summary.accountRecordsObserved,
        summaryObserved: summary.summaryObserved,
        plaintextPasswordsStored: false,
        accountLabelsStored: false,
      },
    });
  } catch (error) {
    console.error("ELITZE John the Ripper evidence import failed", error);
    return NextResponse.json({ ok: false, error: "john_evidence_persist_failed" }, { status: 503, headers: privateHeaders });
  }

  return NextResponse.json({
    ok: true,
    source: "john-the-ripper-import",
    evidenceState: "OBSERVED",
    scanId,
    hashFormat,
    crackedCount: summary.crackedCount,
    remainingCount: summary.remainingCount,
    accountRecordsObserved: summary.accountRecordsObserved,
    summaryObserved: summary.summaryObserved,
    plaintextPasswordsStored: false,
    accountLabelsStored: false,
    observedAt,
  }, { headers: privateHeaders });
}
