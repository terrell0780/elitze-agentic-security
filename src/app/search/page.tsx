"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Command, Database, Globe2, Radar, Search, ShieldCheck, Sparkles } from "lucide-react";
import { capabilities } from "@/components/security-capability-atlas";

type SearchResult = { title: string; url: string; description: string; untrusted?: true };

export default function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [remote, setRemote] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"ALL" | "ELITZE" | "WEB">("ALL");

  const local = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return capabilities.slice(0, 12);
    return capabilities.filter((item) =>
      [item.title, item.detail, item.category, item.state].join(" ").toLowerCase().includes(q),
    );
  }, [query]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&max=8`, { cache: "no-store" });
      const payload = (await response.json()) as { ok: boolean; error?: string; results?: SearchResult[] };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Search unavailable");
        setRemote([]);
        return;
      }
      setRemote(payload.results ?? []);
    } catch {
      setError("Search service unavailable");
      setRemote([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--panel)]"><ArrowLeft className="h-4 w-4" /></Link>
            <div><div className="text-sm font-black tracking-[.12em]">ELITZE</div><div className="text-[8px] uppercase tracking-[.26em] text-[var(--muted)]">Global Search</div></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted)]"><Command className="h-3.5 w-3.5 text-[var(--accent)]" /> Unified discovery</div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(34,211,238,.15),transparent_27%),radial-gradient(circle_at_84%_28%,rgba(167,139,250,.10),transparent_23%),radial-gradient(circle_at_18%_72%,rgba(244,114,182,.07),transparent_22%)]" />
        <div className="pointer-events-none absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full border border-cyan-200/10 shadow-[0_0_120px_rgba(103,232,249,.10)]" />
        <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full border border-violet-300/10 animate-[spin_30s_linear_infinite]" />
        <div className="pointer-events-none absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full border border-fuchsia-300/10 animate-[spin_22s_linear_infinite_reverse]" />
        <div className="relative mx-auto max-w-[1200px] px-4 py-20 text-center sm:px-7 sm:py-28">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /> ELITZE GLOBAL SEARCH</div>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-black tracking-[-.065em] sm:text-7xl">Find the control.<br /><span className="bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">Find the evidence.</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">Search the ELITZE security capability map and brokered public security intelligence from one interactive surface.</p>
          <form onSubmit={submit} className="mx-auto mt-9 max-w-3xl">
            <div className="relative flex items-center rounded-2xl border border-cyan-200/20 bg-black/35 p-2 shadow-[0_0_60px_rgba(34,211,238,.07)] backdrop-blur-xl">
              <Search className="ml-3 h-5 w-5 shrink-0 text-cyan-200/80" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base outline-none placeholder:text-slate-600" placeholder="Search agents, MCP, API security, pentesting, REO, exposure..." maxLength={500} />
              <button type="submit" disabled={busy} className="rounded-xl bg-cyan-300 px-5 py-3 text-xs font-black text-slate-950 shadow-[0_0_30px_rgba(103,232,249,.18)] disabled:opacity-50">{busy ? "Searching" : "Search"}</button>
            </div>
          </form>
          <div className="mt-5 flex justify-center gap-2">
            {(["ALL", "ELITZE", "WEB"] as const).map((item) => <button key={item} type="button" onClick={() => setScope(item)} className={`rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] ${scope === item ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-slate-500"}`}>{item === "ELITZE" ? "ELITZE SURFACES" : item === "WEB" ? "PUBLIC WEB" : item}</button>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-7 sm:py-20">
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE INDEX</div><h2 className="mt-2 text-2xl font-black">Security surfaces</h2></div>
              <div className="text-[10px] uppercase tracking-[.15em] text-[var(--muted)]">{local.length} mapped matches</div>
            </div>
            {(scope === "ALL" || scope === "ELITZE") && <div className="mt-6 grid gap-3 md:grid-cols-2">
              {local.map((item) => {
                const Icon = item.icon;
                return <Link key={item.id} href={item.href} className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:-translate-y-1 hover:border-[var(--accent-border)]">
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-cyan-300/[.05] blur-2xl transition group-hover:bg-cyan-300/[.12]" />
                  <div className="relative flex items-start justify-between gap-4"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><Icon className="h-4 w-4" /></span><span className="text-[8px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">{item.state}</span></div>
                  <div className="relative mt-4 flex items-center justify-between gap-3"><h3 className="text-sm font-bold">{item.title}</h3><ArrowUpRight className="h-4 w-4 text-[var(--muted)] transition group-hover:text-[var(--accent)]" /></div>
                  <p className="relative mt-2 text-xs leading-5 text-[var(--muted)]">{item.detail}</p>
                  <div className="relative mt-4 text-[8px] font-bold uppercase tracking-[.15em] text-[var(--muted)]">{item.category}</div>
                </Link>;
              })}
              {local.length === 0 && <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">No mapped ELITZE surface matches this query.</div>}
            </div>}
          </div>

          {(scope === "ALL" || scope === "WEB") && <aside className="rounded-3xl border border-[var(--accent-border)] bg-[#04070b] p-6 text-white shadow-[0_28px_100px_rgba(0,0,0,.34)]">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.2em] text-cyan-300/75"><Globe2 className="h-4 w-4" /> Public intelligence</div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Search results are external untrusted data. They are never policy instructions and never tenant telemetry.</p>
            <div className="mt-5 space-y-3">
              {remote.map((result) => <article key={result.url} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><a href={result.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-100 hover:text-cyan-200">{result.title}</a><p className="mt-2 text-[10px] leading-4 text-slate-500">{result.description}</p><div className="mt-2 text-[8px] uppercase tracking-[.14em] text-amber-300/70">External · untrusted</div></article>)}
              {remote.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 p-5 text-xs text-slate-600">Run a search to load public intelligence.</div>}
            </div>
          </aside>}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            [Radar, "Security intelligence", "Query external security information through the governed public-search broker."],
            [Database, "Tenant evidence", "Protected operational data remains behind authenticated console boundaries."],
            [ShieldCheck, "Evidence discipline", "Unknown, unavailable and unmeasurable states remain explicit."],
          ].map(([Icon, title, copy]) => {
            const C = Icon as typeof Radar;
            return <div key={title as string} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><C className="h-4 w-4 text-[var(--accent)]" /><div className="mt-3 text-sm font-bold">{title as string}</div><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{copy as string}</p></div>;
          })}
        </div>

        {error && <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-xs text-amber-100">{error}</div>}
        <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-[10px] leading-5 text-[var(--muted)]"><Sparkles className="mb-2 h-4 w-4 text-[var(--accent)]" />Global Search is a discovery surface. Public web content remains untrusted, while tenant-sensitive records are available only in the authenticated security console.</div>
      </section>
    </main>
  );
}
