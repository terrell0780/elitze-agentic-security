import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { compareAstStructure, type AstDiffLanguage } from "@/lib/ast-diff";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedLanguages = new Set<AstDiffLanguage>(["typescript", "tsx", "javascript", "jsx"]);

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
  const before = typeof input.before === "string" ? input.before : "";
  const after = typeof input.after === "string" ? input.after : "";
  const language = typeof input.language === "string" ? input.language.toLowerCase() as AstDiffLanguage : "typescript";

  if (!before.trim() || !after.trim()) {
    return NextResponse.json({
      ok: false,
      error: "before_and_after_required",
      truth_state: "UNMEASURABLE",
      evidence_reference: null,
    }, { status: 400 });
  }
  if (before.length + after.length > 200_000) {
    return NextResponse.json({
      ok: false,
      error: "source_pair_too_large",
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

  const observedAt = new Date().toISOString();
  const beforeHash = createHash("sha256").update(before, "utf8").digest("hex");
  const afterHash = createHash("sha256").update(after, "utf8").digest("hex");
  const result = compareAstStructure(before, after, language);

  return NextResponse.json({
    ok: true,
    ...result,
    language,
    observedAt,
    evidence_reference: {
      kind: "caller_supplied_source_pair",
      before_sha256: beforeHash,
      after_sha256: afterHash,
      observed_at: observedAt,
      persisted: false,
    },
    limitations: [
      "The source pair is parsed but never executed or persisted by this endpoint.",
      "Node-count deltas are structural summaries, not a semantic AST edit script.",
      "A clean parse does not prove a patch is secure, equivalent or regression-free.",
      "Run unit, integration, security and authorized runtime tests before accepting a patch.",
    ],
  }, { headers: { "cache-control": "no-store" } });
}
