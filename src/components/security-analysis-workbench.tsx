"use client";

import { useState } from "react";
import { Activity, Braces, FileSearch, LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";

type Match = { category: string; label: string; line: number; snippet: string; sinkBoost?: number };
type ApiResult = {
  ok?: boolean;
  error?: string;
  truth_state?: string;
  evidence_reference?: Record<string, string | number | boolean | null>;
  reachability_state?: string;
  verdict?: string;
  sources?: Match[];
  sinks?: Match[];
  sanitizer_candidates?: Match[];
  note?: string;
  priority_signal_score?: number | null;
  priority_signal_truth_state?: string;
  syntaxState?: string;
  beforeSyntaxErrors?: number;
  afterSyntaxErrors?: number;
  beforeNodeCount?: number;
  afterNodeCount?: number;
  addedNodeCount?: number;
  removedNodeCount?: number;
  changedLeafTokenCount?: number;
  nodeDeltas?: Array<{ kind: string; added: number; removed: number }>;
  leafTokenDeltas?: Array<{ kind: string; valueHash: string; added: number; removed: number }>;
  limitations?: string[];
  analysis_limitations?: string[];
};

function TruthPill({ value }: { value?: string }) {
  const state = value ?? "UNKNOWN";
  const style = state === "OBSERVED" || state === "INFERRED"
    ? "border-cyan-300/25 bg-cyan-300/[.06] text-cyan-100"
    : state === "UNMEASURABLE" || state === "UNKNOWN"
      ? "border-amber-300/25 bg-amber-300/[.05] text-amber-100"
      : "border-white/15 bg-white/[.03] text-slate-300";
  return <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] ${style}`}>TRUTH: {state}</span>;
}

export default function SecurityAnalysisWorkbench() {
  const [mode, setMode] = useState<"reachability" | "ast-diff">("reachability");
  const [reachLanguage, setReachLanguage] = useState("python");
  const [vulnType, setVulnType] = useState("");
  const [code, setCode] = useState("");
  const [cvss, setCvss] = useState("");
  const [astLanguage, setAstLanguage] = useState("typescript");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitReachability() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/vulnerabilities/reachability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          code,
          language: reachLanguage,
          ...(vulnType ? { vuln_type: vulnType } : {}),
          ...(cvss.trim() ? { cvss_score: Number(cvss) } : {}),
        }),
      });
      const payload = await response.json() as ApiResult;
      setResult(payload);
    } catch {
      setResult({ ok: false, error: "reachability_service_unavailable", truth_state: "UNMEASURABLE" });
    } finally {
      setBusy(false);
    }
  }

  async function submitAstDiff() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/vulnerabilities/ast-diff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ before, after, language: astLanguage }),
      });
      const payload = await response.json() as ApiResult;
      setResult(payload);
    } catch {
      setResult({ ok: false, error: "ast_diff_service_unavailable", truth_state: "UNMEASURABLE" });
    } finally {
      setBusy(false);
    }
  }

  const evidence = result?.evidence_reference;
  const limitations = result?.analysis_limitations ?? result?.limitations ?? [];

  return (
    <section aria-labelledby="security-analysis-heading" className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">ELITZE // SOURCE ANALYSIS</div>
          <h2 id="security-analysis-heading" className="mt-2 text-xl font-black">Security Analysis Workbench</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">Analyze caller-supplied code for source/sink pattern candidates or compare JavaScript/TypeScript AST structure. Code is not executed or persisted by these endpoints. Heuristic output is not proof of exploitability or patch safety.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setMode("reachability"); setResult(null); }} aria-pressed={mode === "reachability"} className={`rounded-xl border px-3 py-2 text-[10px] font-bold ${mode === "reachability" ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}><span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />Reachability</span></button>
          <button type="button" onClick={() => { setMode("ast-diff"); setResult(null); }} aria-pressed={mode === "ast-diff"} className={`rounded-xl border px-3 py-2 text-[10px] font-bold ${mode === "ast-diff" ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}><span className="inline-flex items-center gap-1.5"><Braces className="h-3.5 w-3.5" />AST diff</span></button>
        </div>
      </div>

      {mode === "reachability" ? (
        <div className="mt-5 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Language
              <select value={reachLanguage} onChange={(event) => setReachLanguage(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]"><option value="python">Python</option><option value="javascript">JavaScript / TypeScript</option></select>
            </label>
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Vulnerability class
              <select value={vulnType} onChange={(event) => setVulnType(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]"><option value="">Auto / all configured sinks</option><option value="sql-injection">SQL injection</option><option value="xss">Cross-site scripting</option><option value="command-injection">Command injection</option><option value="deserialization">Unsafe deserialization</option><option value="path-traversal">Path traversal</option></select>
            </label>
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Optional CVSS base score
              <input type="number" min="0" max="10" step="0.1" value={cvss} onChange={(event) => setCvss(event.target.value)} placeholder="0.0–10.0" className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]" />
            </label>
          </div>
          <label className="grid gap-2 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Source snippet (maximum 100,000 characters)
            <textarea value={code} onChange={(event) => setCode(event.target.value.slice(0, 100000))} rows={8} spellCheck={false} placeholder="Paste an authorized code snippet for static pattern triage…" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 font-mono text-xs leading-5 text-[var(--text)] outline-none placeholder:text-[var(--muted)]" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-[10px] leading-4 text-[var(--muted)]">A source and sink in the same snippet is only a candidate. The analyzer does not prove a data-flow path and cannot confirm exploitability.</p>
            <button type="button" disabled={busy || !code.trim()} onClick={() => void submitReachability()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}Run reachability triage</button>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Source language
            <select value={astLanguage} onChange={(event) => setAstLanguage(event.target.value)} className="max-w-sm rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]"><option value="typescript">TypeScript</option><option value="tsx">TSX / React</option><option value="javascript">JavaScript</option><option value="jsx">JSX / React</option></select>
          </label>
          <div className="grid gap-3 lg:grid-cols-2">
            <label className="grid gap-2 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Before revision
              <textarea value={before} onChange={(event) => setBefore(event.target.value.slice(0, 100000))} rows={8} spellCheck={false} placeholder="Paste the original source revision…" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 font-mono text-xs leading-5 text-[var(--text)] outline-none placeholder:text-[var(--muted)]" />
            </label>
            <label className="grid gap-2 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">After revision
              <textarea value={after} onChange={(event) => setAfter(event.target.value.slice(0, 100000))} rows={8} spellCheck={false} placeholder="Paste the changed source revision…" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 font-mono text-xs leading-5 text-[var(--text)] outline-none placeholder:text-[var(--muted)]" />
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-[10px] leading-4 text-[var(--muted)]">The comparison returns syntax diagnostics, node-count deltas and hashed leaf-token changes. It is not a semantic diff or regression test.</p>
            <button type="button" disabled={busy || !before.trim() || !after.trim()} onClick={() => void submitAstDiff()} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black text-slate-950 disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Braces className="h-4 w-4" />}Compare AST structure</button>
          </div>
        </div>
      )}

      {result && (
        <div aria-live="polite" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-black">{result.ok ? "Analysis result" : "Analysis unavailable"}</div>
            <TruthPill value={result.truth_state} />
          </div>
          {result.error && <p className="mt-3 text-xs text-amber-200">{result.error}</p>}
          {result.reachability_state && <div className="mt-3 text-sm font-bold">{result.reachability_state} · {result.verdict}</div>}
          {result.note && <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{result.note}</p>}
          {result.priority_signal_score != null && <p className="mt-2 text-xs">Priority signal: <strong>{result.priority_signal_score.toFixed(1)}</strong> · <TruthPill value={result.priority_signal_truth_state} /></p>}
          {result.syntaxState && <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {[
              ["Syntax", result.syntaxState],
              ["Changed tokens", String(result.changedLeafTokenCount ?? 0)],
              ["Nodes added", String(result.addedNodeCount ?? 0)],
              ["Nodes removed", String(result.removedNodeCount ?? 0)],
            ].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--border)] p-3"><div className="text-[8px] uppercase tracking-[.12em] text-[var(--muted)]">{label}</div><div className="mt-1 text-xs font-bold">{value}</div></div>)}
          </div>}
          {(result.sources?.length || result.sinks?.length || result.sanitizer_candidates?.length) ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {[
                ["Sources", result.sources ?? []],
                ["Sinks", result.sinks ?? []],
                ["Sanitizer candidates", result.sanitizer_candidates ?? []],
              ].map(([label, matches]) => <div key={String(label)} className="rounded-xl border border-[var(--border)] p-3">
                <div className="text-[9px] font-bold uppercase tracking-[.12em]">{String(label)}</div>
                <div className="mt-2 space-y-2">{(matches as Match[]).slice(0, 8).map((match, index) => <div key={match.category + match.line + index} className="border-t border-[var(--border)] pt-2">
                  <div className="text-[10px] font-semibold">{match.label} · line {match.line}</div>
                  <code className="mt-1 block break-all text-[9px] leading-4 text-[var(--muted)]">{match.snippet}</code>
                </div>)}</div>
              </div>)}
            </div>
          ) : null}
          {result.nodeDeltas && result.nodeDeltas.length > 0 && <div className="mt-4">
            <div className="text-[9px] font-bold uppercase tracking-[.12em]">AST node-kind deltas</div>
            <div className="mt-2 flex flex-wrap gap-2">{result.nodeDeltas.slice(0, 12).map((delta) => <span key={delta.kind} className="rounded-lg border border-[var(--border)] px-2 py-1 font-mono text-[9px]">{delta.kind} +{delta.added} / -{delta.removed}</span>)}</div>
          </div>}
          {result.leafTokenDeltas && result.leafTokenDeltas.length > 0 && <div className="mt-4">
            <div className="text-[9px] font-bold uppercase tracking-[.12em]">Changed token fingerprints (source text not disclosed)</div>
            <div className="mt-2 flex flex-wrap gap-2">{result.leafTokenDeltas.slice(0, 12).map((delta) => <span key={delta.kind + delta.valueHash} className="rounded-lg border border-[var(--border)] px-2 py-1 font-mono text-[9px]">{delta.kind} #{delta.valueHash} +{delta.added} / -{delta.removed}</span>)}</div>
          </div>}
          {evidence && <div className="mt-4 break-all border-t border-[var(--border)] pt-3 font-mono text-[9px] leading-4 text-[var(--muted)]">Evidence reference: {Object.entries(evidence).map(([key, value]) => key + "=" + String(value)).join(" · ")}</div>}
          {limitations.length > 0 && <ul className="mt-4 grid gap-1 text-[10px] leading-4 text-[var(--muted)]">{limitations.map((item) => <li key={item}>• {item}</li>)}</ul>}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[.12em] text-[var(--muted)]"><ShieldCheck className="h-3.5 w-3.5" />Analysis requires authenticated ELITZE session · no automatic remediation</div>
    </section>
  );
}
