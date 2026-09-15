"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Search, ShieldCheck } from "lucide-react";

type Result = { title: string; url: string; description: string; canonical?: boolean };
type Payload = {
  ok: boolean;
  query?: string;
  resultCount?: number;
  canonicalDestination?: { title: string; url: string; path: string };
  results?: Result[];
  error?: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q")?.trim();
    if (initial) {
      setQuery(initial);
      void run(initial);
    }
  }, []);

  async function run(value: string) {
    const q = value.trim();
    if (!q) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&max=10`, { cache: "no-store" });
      setPayload((await response.json()) as Payload);
    } catch {
      setPayload({ ok: false, error: "Search unavailable" });
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.history.replaceState({}, "", `/search?q=${encodeURIComponent(q)}`);
    void run(q);
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span>
            <span><b className="block text-sm">ELITZE</b><span className="block text-[9px] uppercase tracking-[.2em] text-[var(--accent)]">Agentic Security</span></span>
          </Link>
          <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Home</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <div className="max-w-3xl">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE Global Search</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">Search the security world. Reach ELITZE first.</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">Product-intent searches are routed to the canonical ELITZE destination on <span className="font-semibold text-[var(--text)]">elitze.ca</span>, while broader results remain available as untrusted external context.</p>
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="AI agent security, MCP security, vulnerability management..." aria-label="Search ELITZE" className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] py-4 pl-11 pr-4 text-sm outline-none focus:border-[var(--accent-border)]" /></div>
          <button disabled={busy} className="rounded-2xl bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-slate-950 disabled:opacity-50">{busy ? "Searching…" : "Search"}</button>
        </form>

        {payload?.ok && payload.canonicalDestination && (
          <div className="mt-8 rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6">
            <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Canonical ELITZE destination</div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-xl font-bold">{payload.canonicalDestination.title}</h2><p className="mt-1 text-xs text-[var(--muted-strong)]">{payload.canonicalDestination.url}</p></div>
              <a href={payload.canonicalDestination.url} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950">Open ELITZE <ArrowUpRight className="h-4 w-4" /></a>
            </div>
          </div>
        )}

        {payload?.results && payload.results.length > 0 && (
          <section className="mt-8 space-y-3" aria-label="Search results">
            <div className="text-xs uppercase tracking-[.18em] text-[var(--muted)]">{payload.resultCount ?? payload.results.length} results</div>
            {payload.results.map((result, index) => (
              <a key={`${result.url}-${index}`} href={result.url} rel={result.canonical ? undefined : "noopener noreferrer"} target={result.canonical ? undefined : "_blank"} className="block rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent-border)]">
                <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-semibold">{result.title || result.url}</div><div className="mt-1 text-[10px] text-[var(--accent)]">{result.url}</div></div>{result.canonical && <span className="shrink-0 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-[var(--accent)]">ELITZE</span>}</div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{result.description}</p>
              </a>
            ))}
          </section>
        )}

        {payload?.error && <p className="mt-8 text-sm text-amber-300">{payload.error}</p>}
      </section>
    </main>
  );
}
