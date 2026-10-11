"use client";

import { FormEvent, useCallback, useState } from "react";
import { Activity, AlertTriangle, Bug, ExternalLink, RefreshCw, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import SecurityAnalysisWorkbench from "@/components/security-analysis-workbench";

type Result = {
  id: string;
  source: string;
  title: string;
  url: string;
  description: string;
  cvss?: number | null;
  epss?: number | null;
  epssPercentile?: number | null;
  kev?: boolean;
  published?: string | null;
  modified?: string | null;
  vendor?: string | null;
  product?: string | null;
  requiredAction?: string | null;
  dueDate?: string | null;
  references?: string[];
  external?: true;
  truth_state?: "OBSERVED" | "DECLARED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  evidence_reference?: { source?: string; source_url?: string; record_url?: string; observed_at?: string; external_record_only?: boolean } | null;
  reachability?: { truth_state: "OBSERVED" | "DECLARED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE"; reason: string };
  vpr_score?: number | null;
  vpr_truth_state?: "OBSERVED" | "DECLARED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  priority_signal_score?: number | null;
  priority_signal_truth_state?: "OBSERVED" | "DECLARED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
};

type Api = {
  ok: boolean;
  query?: string;
  mode?: string;
  observedAt?: string;
  sourceStates?: Record<string, string>;
  results?: Result[];
  resultCount?: number;
  truthNote?: string;
  truth_state?: "OBSERVED" | "DECLARED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  vpr_context_state?: "DECLARED" | "UNMEASURABLE";
  error?: string;
};

const modes = [
  { value: "cve", label: "CVE / vulnerability" },
  { value: "kev", label: "CISA KEV" },
  { value: "zero-day", label: "Zero-day signals" },
  { value: "package", label: "Package / product" },
];

function score(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—";
}

function sourceState(value?: string) {
  return value === "LIVE" ? "LIVE" : value ?? "UNKNOWN";
}

export default function VulnerabilitiesPage() {
  const [mode, setMode] = useState("cve");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [sourceStates, setSourceStates] = useState<Record<string, string>>({});
  const [observedAt, setObservedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assetCriticality, setAssetCriticality] = useState("");
  const [networkExposure, setNetworkExposure] = useState("");
  const [dataClassification, setDataClassification] = useState("");
  const [exploitAvailable, setExploitAvailable] = useState("");
  const [vprContextState, setVprContextState] = useState<"DECLARED" | "UNMEASURABLE">("UNMEASURABLE");

  const runSearch = useCallback(async (value = query, selectedMode = mode) => {
    const q = value.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mode: selectedMode, q });
      const contextReady = Boolean(assetCriticality && networkExposure && dataClassification && exploitAvailable !== "");
      if (contextReady) {
        params.set("asset_criticality", assetCriticality);
        params.set("network_exposure", networkExposure);
        params.set("data_classification", dataClassification);
        params.set("exploit_available", exploitAvailable);
      }
      const response = await fetch(`/api/vulnerabilities?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as Api;
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Vulnerability intelligence unavailable");
        setResults([]);
        return;
      }
      setResults(payload.results ?? []);
      setSourceStates(payload.sourceStates ?? {});
      setObservedAt(payload.observedAt ?? null);
      setVprContextState(payload.vpr_context_state ?? "UNMEASURABLE");
    } catch {
      setError("Vulnerability intelligence service unavailable");
      setResults([]);
    } finally {
      setBusy(false);
    }
  }, [mode, query, assetCriticality, networkExposure, dataClassification, exploitAvailable]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void runSearch();
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><Bug className="h-5 w-5" /></div>
            <div><div className="text-sm font-black tracking-wide">ELITZE Vulnerability Intelligence</div><div className="text-[9px] uppercase tracking-[.2em] text-[var(--accent)]">Live CVE · KEV · EPSS · emerging threats</div></div>
          </div>
          <button type="button" onClick={() => void runSearch()} disabled={busy || !query.trim()} className="rounded-xl border border-[var(--border)] p-2 text-[var(--muted)] disabled:opacity-40" title="Refresh"><RefreshCw className={"h-4 w-4 " + (busy ? "animate-spin" : "")} /></button>
        </div>
      </header>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="max-w-4xl">
            <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Live external security intelligence</div>
            <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">Find what can make the environment vulnerable.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-strong)]">Query authoritative vulnerability sources in real time, enrich CVEs with exploit-prediction context, surface known-exploited vulnerabilities, and keep emerging-threat research visible without confusing public intelligence with tenant exposure.</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            {[
              ["NVD", sourceState(sourceStates.nvd), "CVE metadata"],
              ["CISA KEV", sourceState(sourceStates.cisaKev), "Known exploited"],
              ["EPSS", sourceState(sourceStates.epss ?? (results.some((r) => r.epss != null) ? "LIVE" : undefined)), "Exploit prediction"],
              ["Evidence", "EXTERNAL", "Verify against assets"],
            ].map(([label, state, copy]) => (
              <article key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                <div className="flex items-center justify-between gap-3"><div className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">{label}</div><span className={"text-[8px] font-black uppercase " + (state === "LIVE" ? "text-emerald-300" : "text-amber-300")}>{state}</span></div>
                <div className="mt-3 text-xs text-[var(--muted)]">{copy}</div><div className={"mt-2 text-[8px] font-bold uppercase tracking-[.14em] " + (state === "LIVE" ? "text-emerald-300/80" : "text-amber-200/80")}>{state === "LIVE" ? "OBSERVED source response" : "UNMEASURABLE / NOT VERIFIED"}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <form onSubmit={submit} className="rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 sm:p-7">
          <div className="grid gap-3 lg:grid-cols-[230px_1fr_auto]">
            <select value={mode} onChange={(e) => { const nextMode = e.target.value; setMode(nextMode); if (query.trim()) void runSearch(query, nextMode); }} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm outline-none">{modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={240} required placeholder="CVE identifier, OpenSSL, Microsoft, npm package, vendor advisory" className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm outline-none placeholder:text-[var(--muted)]" />
            <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50"><Search className="h-4 w-4" />{busy ? "Searching live sources" : "Search live sources"}</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Asset criticality
              <select value={assetCriticality} onChange={(e) => setAssetCriticality(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]"><option value="">Not supplied</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select>
            </label>
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Network exposure
              <select value={networkExposure} onChange={(e) => setNetworkExposure(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]"><option value="">Not supplied</option><option value="PUBLIC">Public</option><option value="INTERNAL">Internal</option><option value="ISOLATED">Isolated</option></select>
            </label>
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Data classification
              <select value={dataClassification} onChange={(e) => setDataClassification(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]"><option value="">Not supplied</option><option value="PII">PII</option><option value="SENSITIVE">Sensitive</option><option value="PUBLIC">Public</option></select>
            </label>
            <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Exploit available
              <select value={exploitAvailable} onChange={(e) => setExploitAvailable(e.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs text-[var(--text)]"><option value="">Not supplied</option><option value="true">Yes</option><option value="false">No</option></select>
            </label>
          </div>
          <p className="mt-3 text-[9px] leading-4 text-[var(--muted)]">Optional ELITZE VPR context. All four values are caller-declared inputs; without them, VPR remains UNMEASURABLE. Public intelligence alone cannot establish tenant reachability.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-[.13em] text-[var(--muted)]">
            <span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-[var(--accent)]" />{observedAt ? "Observed " + new Date(observedAt).toLocaleString() : "Awaiting live query"}</span>
            <span>Results: {results.length}</span>
            <span>External intelligence only</span>
            <span>VPR context: {vprContextState}</span>
          </div>
        </form>

        {error && <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-4 text-xs text-amber-100">{error}</div>}

        <div className="mt-6 grid gap-4">
          {results.map((result) => (
            <article key={result.source + ":" + result.id + ":" + result.title} className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[8px] font-black uppercase tracking-[.13em] text-[var(--accent)]">{result.source}</span>
                    {result.kev && <span className="rounded-full border border-rose-300/20 bg-rose-300/[.05] px-2 py-1 text-[8px] font-black uppercase tracking-[.13em] text-rose-200">Known exploited</span>}
                  </div>
                  <a href={result.url} target="_blank" rel="noreferrer" className="mt-3 block text-base font-black hover:text-[var(--accent)]">{result.title}</a>
                  {result.id && <div className="mt-1 font-mono text-[9px] text-[var(--muted)]">{result.id}</div>}
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-[var(--muted)]" />
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">{result.description}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["CVSS", score(result.cvss)],
                  ["EPSS", result.epss != null ? (result.epss * 100).toFixed(2) + "%" : "—"],
                  ["EPSS percentile", result.epssPercentile != null ? (result.epssPercentile * 100).toFixed(2) + "%" : "—"],
                  ["ELITZE VPR", typeof result.vpr_score === "number" ? result.vpr_score.toFixed(1) : "UNMEASURABLE"],
                  ["VPR truth", result.vpr_truth_state ?? "UNMEASURABLE"],
                  ["Reachability", result.reachability?.truth_state ?? "UNMEASURABLE"],
                  ["Finding truth", result.truth_state ?? "UNKNOWN"],
                ].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3"><div className="text-[8px] uppercase tracking-[.14em] text-[var(--muted)]">{label}</div><div className="mt-2 font-mono text-sm font-black">{value}</div></div>)}
              </div>

              {(result.vendor || result.product || result.requiredAction || result.dueDate) && <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {result.vendor && <div className="text-[10px] text-[var(--muted)]">Vendor: <span className="text-[var(--text)]">{result.vendor}</span></div>}
                {result.product && <div className="text-[10px] text-[var(--muted)]">Product: <span className="text-[var(--text)]">{result.product}</span></div>}
                {result.requiredAction && <div className="text-[10px] text-[var(--muted)]">Action: <span className="text-[var(--text)]">{result.requiredAction}</span></div>}
                {result.dueDate && <div className="text-[10px] text-[var(--muted)]">Due: <span className="text-[var(--text)]">{result.dueDate}</span></div>}
              </div>}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4 text-[9px] text-[var(--muted)]">
                <span className="rounded-full border border-[var(--border)] px-2 py-1">TRUTH: {result.truth_state ?? "UNKNOWN"}</span>
                <span className="break-all">Evidence: {result.evidence_reference?.source_url ?? result.url}</span>
                <span>Published {result.published ? new Date(result.published).toLocaleString() : "—"}</span>
                <span>Modified {result.modified ? new Date(result.modified).toLocaleString() : "—"}</span>
                <span className="inline-flex items-center gap-1 text-amber-200/80"><ShieldAlert className="h-3 w-3" />Public intelligence does not prove tenant exposure</span>
              </div>
            </article>
          ))}

          {!busy && results.length === 0 && <div className="rounded-3xl border border-dashed border-[var(--border)] p-12 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-[var(--accent)]" />
            <div className="mt-3 text-sm font-bold">No live results loaded</div>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[var(--muted)]">Run a query above. ELITZE will identify which sources responded and keep unavailable sources explicit rather than substituting synthetic results.</p>
          </div>}
        </div>

        <SecurityAnalysisWorkbench />

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-[10px] leading-5 text-[var(--muted)]">
          <div className="font-black uppercase tracking-[.16em] text-[var(--text)]">Evidence boundary</div>
          <div className="mt-2">NVD/CISA/EPSS data is live external intelligence. ELITZE still requires observed tenant assets and authorized validation before treating public intelligence as an environment-specific finding. VPR context is caller-declared; reachability remains UNMEASURABLE unless code or runtime evidence is separately analyzed.</div>
        </div>
      </section>
    </main>
  );
}
