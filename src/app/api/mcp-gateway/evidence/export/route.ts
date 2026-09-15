import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX ?? 10) });
function authorized(request: NextRequest) { return authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY); }
function pdfEscape(value: string) { return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r?\n/g, " "); }
function buildPdf(lines: string[]) {
  const safe = lines.slice(0, 120).map((line) => pdfEscape(line).slice(0, 150));
  let body = "BT /F1 8 Tf 40 760 Td 10 TL\n";
  for (const line of safe) body += `(${line}) Tj T*\n`;
  body += "ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    `<< /Length ${Buffer.byteLength(body, "utf8")} >>\nstream\n${body}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n"; const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i += 1) { offsets.push(Buffer.byteLength(pdf, "utf8")); pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  const decisionId = request.nextUrl.searchParams.get("decisionId")?.trim();
  const format = (request.nextUrl.searchParams.get("format") ?? "json").toLowerCase();
  if (!tenantId) return NextResponse.json({ ok: false, error: "tenant_id_required" }, { status: 400 });
  if (format !== "json" && format !== "pdf") return NextResponse.json({ ok: false, error: "format_must_be_json_or_pdf" }, { status: 400 });

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT decision_ref, request_id, tenant_id, human_owner_id, application_id, agent_identity_id, workload_session_id,
              delegation_source, purpose, requested_capability, tool_name, action, resource_type, resource_id,
              decision, policy_id, policy_version, constraints, approval_reference, requested_at, evidence_source,
              evidence_state, source_ref, freshness_at, observed_at, previous_evidence_hash, evidence_hash,
              evidence_signature, upstream_status, upstream_result_hash, evidence_event
       FROM mcp_gateway_decisions
       WHERE tenant_id = $1 AND ($2::text IS NULL OR decision_ref = $2)
       ORDER BY created_at ASC`,
      [tenantId, decisionId ?? null],
    );
    const evidence = result.rows.map((row) => ({
      decisionId: row.decision_ref,
      requestId: row.request_id,
      tenantId: row.tenant_id,
      humanOwnerId: row.human_owner_id,
      applicationId: row.application_id,
      agentId: row.agent_identity_id,
      workloadSessionId: row.workload_session_id,
      delegationSource: row.delegation_source,
      purpose: row.purpose,
      requestedCapability: row.requested_capability,
      tool: row.tool_name,
      action: row.action,
      resource: row.resource_id,
      resourceType: row.resource_type,
      decision: row.decision,
      policyId: row.policy_id,
      policyVersion: row.policy_version,
      constraints: row.constraints,
      approvalReference: row.approval_reference,
      requestedAt: row.requested_at,
      evidenceSource: row.evidence_source,
      evidenceState: row.evidence_state,
      sourceRef: row.source_ref,
      freshnessAt: row.freshness_at,
      observedAt: row.observed_at,
      previousRecordHash: row.previous_evidence_hash,
      recordHash: row.evidence_hash,
      signature: row.evidence_signature,
      upstreamStatus: row.upstream_status,
      upstreamResultHash: row.upstream_result_hash,
      evidenceEvent: row.evidence_event,
    }));

    if (format === "json") return NextResponse.json({ ok: true, tenantId, evidence });
    const lines = ["ELITZE Agentic Security — Evidence Export", `Tenant: ${tenantId}`, `Records: ${evidence.length}`, ""];
    for (const record of evidence) {
      lines.push(`Decision ${record.decisionId} | ${record.decision} | ${record.tool}`);
      lines.push(`Agent ${record.agentId} | Owner ${record.humanOwnerId} | Session ${record.workloadSessionId}`);
      lines.push(`Resource ${record.resource ?? "UNKNOWN"} | Policy ${record.policyId ?? "NONE"} | State ${record.evidenceState}`);
      lines.push(`Requested ${String(record.requestedAt)} | Observed ${String(record.observedAt)} | Source ${record.evidenceSource}`);
      lines.push(`Previous ${record.previousRecordHash ?? "GENESIS"}`);
      lines.push(`Hash ${record.recordHash}`);
      lines.push(`Signature ${record.signature}`);
      lines.push("");
    }
    const pdf = buildPdf(lines);
    return new NextResponse(pdf as any, { status: 200, headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="elitze-evidence-${tenantId}.pdf"`, "cache-control": "no-store" } });
  } finally { client.release(); }
}
