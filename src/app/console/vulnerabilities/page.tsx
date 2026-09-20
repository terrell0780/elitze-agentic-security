"use client";

import { FormEvent, useState } from "react";
import { Bug, ExternalLink, Radar, Search, ShieldAlert } from "lucide-react";

type Result = { title: string; url: string; description: string; untrusted: true };

const modes = [
  { value: "cve", label: "CVE / vulnerability" },
  { value: "kev", label: "CISA KEV" },
  { value: "zero-day", label: "Zero-day signals" },
  { value: "package", label: "Package / product" },
];

export default function VulnerabilitiesPage() {
  const [mode, setMode] = useState("cve");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(event: FormEvent) {
    event.preventDefault();
    const q = `${mode === "cve" ? "CVE vulnerability" : mode === "kev" ? "CISA KEV" : mode === "zero-day" ? "zero-day vulnerability advisory" : "security vulnerability"} ${query.trim()}`.trim();
    if (!query.trim()) return;
    setBusy(true); setError(null); setResults([]);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&max=10`, { cache: "no-store" });
      const payload = (await response.json()) as { ok: boolean; error?: string; results?: Result[] };
      if (!response.ok || !payload.ok) { setError(payload.error ?? "Vulnerability search failed"); return; }
      setResults(payload.results ?? []);
    } catch { setError("Vulnerability search service unavailable"); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"><div><div className="text-sm font-semibold tracking-wide text-white">Vulnerability Search</div><div className="text-[10px] uppercase tracking-[.2em] text-[var(--accent)]">CVE · KEV · zero-day intelligence</div></div><div className="flex items-center gap-2 text-xs text-slate-500"><Radar className="h-3.5 w-3.5" />External intelligence is untrusted until verified</div></div></header>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="max-w-3xl"><h1 className="text-3xl font-semibold text-white">Find what can make the environment vulnerable.</h1><p className="mt-3 text-sm leading-6 text-slate-400">Search public vulnerability intelligence and advisories. Results are discovery inputs, not proof of exposure, exploitability or compromise.</p></div>
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><Bug className="h-4 w-4 text-[var(--accent)]" /><h2 className="mt-4 text-sm font-semibold">CVE intelligence</h2><p className="mt-2 text-xs leading-5 text-slate-500">Search identifiers, products, vendors and vulnerability descriptions.</p></div>
          <div className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><ShieldAlert className="h-4 w-4 text-[var(--accent)]" /><h2 className="mt-4 text-sm font-semibold">KEV and zero-day signals</h2><p className="mt-2 text-xs leading-5 text-slate-500">Surface public exploitation warnings and emerging advisories for verification.</p></div>
          <div className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><Search className="h-4 w-4 text-[var(--accent)]" /><h2 className="mt-4 text-sm font-semibold">Exposure is separate</h2><p className="mt-2 text-xs leading-5 text-slate-500">A public advisory does not prove an ELITZE tenant is affected. Correlate with observed assets and reachability.</p></div>
        </section>
        <section className="mt-8 rounded-2xl border border-white/8 bg-white/[.02] p-6">
          <form onSubmit={search} className="grid gap-3 md:grid-cols-[240px_1fr_auto]"><select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none">{modes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={400} placeholder="e.g. OpenSSL, CVE-2026-..., vendor advisory, package name" className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-700 focus:border-[var(--accent-border)]" /><button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"><Search className="h-4 w-4" />{busy ? "Searching" : "Search"}</button></form>
          {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
          <div className="mt-6 space-y-3">{results.map((result) => <article key={result.url} className="rounded-xl border border-white/7 bg-black/20 p-4"><div className="flex items-start justify-between gap-4"><div><a href={result.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-[var(--accent)]">{result.title}</a><p className="mt-1 text-[10px] text-slate-600 break-all">{result.url}</p></div><ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-600" /></div><p className="mt-3 text-xs leading-5 text-slate-400">{result.description}</p><div className="mt-3 text-[10px] uppercase tracking-wider text-amber-300/80">Discovery source · verify before action</div></article>)}{!busy && results.length === 0 && <div className="py-10 text-center text-xs text-slate-600">No vulnerability results loaded.</div>}</div>
        </section>
      </div>
    </main>
  );
}
