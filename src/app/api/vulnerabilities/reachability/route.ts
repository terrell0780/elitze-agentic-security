import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { adjustPrioritySignal, traceReachability } from "@/lib/vulnerability-triage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedLanguages = new Set(["python", "javascript"]);
const allowedVulnerabilityTypes = new Set([
  "sql-injection",
  "xss",
  "command-injection",
  "deserialization",
  "path-traversal",
]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({
      ok: false,
      error: "unauthorized",
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      ok: false,
      error: "invalid_json",
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({
      ok: false,
      error: "invalid_request",
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const code = typeof input.code === "string" ? input.code : "";
  const language = typeof input.language === "string" ? input.language.toLowerCase() : "";
  const vulnerabilityType = typeof input.vuln_type === "string" ? input.vuln_type.toLowerCase() : undefined;

  if (!code.trim()) {
    return NextResponse.json({
      ok: false,
      error: "code_required",
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 400 });
  }
  if (code.length > 100_000) {
    return NextResponse.json({
      ok: false,
      error: "code_too_large",
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 413 });
  }
  if (!allowedLanguages.has(language)) {
    return NextResponse.json({
      ok: false,
      error: "unsupported_language",
      supported_languages: [...allowedLanguages],
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 400 });
  }
  if (vulnerabilityType && !allowedVulnerabilityTypes.has(vulnerabilityType)) {
    return NextResponse.json({
      ok: false,
      error: "unsupported_vulnerability_type",
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 400 });
  }

  const observedAt = new Date().toISOString();
  const sourceHash = createHash("sha256").update(code, "utf8").digest("hex");
  const trace = traceReachability(code, language as "python" | "javascript", vulnerabilityType);
  const cvss = typeof input.cvss_score === "number" && Number.isFinite(input.cvss_score) && input.cvss_score >= 0 && input.cvss_score <= 10
    ? input.cvss_score
    : null;
  const sinkBoost = Math.max(0, ...trace.sinks.map((sink) => sink.sinkBoost ?? 0));
  const prioritySignal = cvss === null ? null : adjustPrioritySignal(cvss, trace.verdict, sinkBoost);

  return NextResponse.json({
    ok: true,
    truth_state: trace.truth_state,
    evidence_reference: {
      kind: "submitted_source_snippet",
      sha256: sourceHash,
      observed_at: observedAt,
      persisted: false,
      source: "Authenticated caller-supplied code; analyzed in-process without execution or external egress",
    },
    analysis_method: "ELITZE_SOURCE_SINK_PATTERN_TRIAGE_V1",
    analysis_limitations: [
      "This is a pattern-based triage heuristic, not AST-based data-flow proof.",
      "Source/sink co-occurrence does not prove a reachable path or exploitability.",
      "Sanitizer matches are candidates only; their data-flow effectiveness is not verified.",
      "No code is executed, persisted or sent to an external provider by this endpoint.",
    ],
    language,
    vulnerability_type: vulnerabilityType ?? null,
    observedAt,
    reachability_state: trace.reachability_state,
    verdict: trace.verdict,
    sources: trace.sources,
    sinks: trace.sinks,
    sanitizer_candidates: trace.sanitizerCandidates,
    note: trace.note,
    priority_signal_score: prioritySignal,
    priority_signal_truth_state: prioritySignal === null ? "UNMEASURABLE" : "INFERRED",
    priority_signal_method: "ELITZE flow-triage adjustment based on caller-supplied CVSS and highest matched sink boost; heuristic only, not a VPR score.",
  }, { headers: { "cache-control": "no-store" } });
}
