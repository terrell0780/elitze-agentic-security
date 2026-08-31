"use client";

import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Eye,
  Globe2,
  Layers,
  Loader2,
  Lock,
  Network,
  Radar,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseCase = {
  id: number;
  slug: string;
  category: string;
  title: string;
  summary: string;
  problem: string;
  approach: string;
  outcomes: string[];
  industries: string[];
  featured: boolean;
};

type Integration = {
  id: number;
  slug: string;
  name: string;
  kind: string;
  tagline: string;
  description: string;
  risks: string[];
  elitzeControls: string[];
  status: string;
  website: string | null;
};

type Finding = {
  id: number;
  target: string;
  findingType: string;
  title: string;
  severity: string;
  detail: string;
  status: string;
};

type SearchHit = {
  title: string;
  url: string;
  description: string;
  untrusted?: boolean;
};

type Payload = {
  ok: boolean;
  stats: {
    useCases: number;
    featured: number;
    integrations: number;
    openFindings: number;
    highFindings: number;
  };
  useCases: UseCase[];
  integrations: Integration[];
  findings: Finding[];
  industries: string[];
};

const categoryMeta: Record<
  string,
  { label: string; icon: typeof Shield; blurb: string }
> = {
  agentic: {
    label: "Agentic AI",
    icon: Bot,
    blurb: "Secure agents end-to-end",
  },
  api: {
    label: "API Security",
    icon: Network,
    blurb: "Discover, inventory, stop attacks",
  },
  compliance: {
    label: "Compliance",
    icon: Lock,
    blurb: "Posture, IR, governance",
  },
  industry: {
    label: "By Industry",
    icon: Building2,
    blurb: "Vertical playbooks",
  },
};

const kindIcon: Record<string, typeof Globe2> = {
  reach: Globe2,
  search: Search,
  vision: Eye,
  automation: Workflow,
};

export default function UseCases() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeIntegration, setActiveIntegration] = useState<string>("agent-reach");
  const [busyId, setBusyId] = useState<number | null>(null);

  // DuckDuckGo panel
  const [query, setQuery] = useState("agentic AI security best practices 2026");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<SearchHit[] | null>(null);
  const [searchMeta, setSearchMeta] = useState<{
    provider?: string;
    degraded?: boolean;
    controls?: string[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/use-cases", { cache: "no-store" });
      const json = (await res.json()) as Payload;
      if (json.ok) {
        setData(json);
        if (!selected && json.useCases[0]) {
          setSelected(json.useCases[0].slug);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (category === "all") return data.useCases;
    return data.useCases.filter((u) => u.category === category);
  }, [data, category]);

  const activeCase =
    filtered.find((u) => u.slug === selected) ?? filtered[0] ?? null;

  const integration =
    data?.integrations.find((i) => i.slug === activeIntegration) ??
    data?.integrations[0] ??
    null;

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}&max=5`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setSearchError(json.error ?? "Search denied or failed");
        setSearchHits(null);
        setSearchMeta(null);
        return;
      }
      setSearchHits(json.results as SearchHit[]);
      setSearchMeta({
        provider: json.provider,
        degraded: json.degraded,
        controls: json.controls,
      });
    } catch {
      setSearchError("Search request failed");
    } finally {
      setSearching(false);
    }
  }

  async function resolveFinding(id: number) {
    setBusyId(id);
    try {
      await fetch("/api/use-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve-finding", id }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-10 text-center text-sm text-slate-400">
        Loading use cases…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-10 text-center text-sm text-rose-300">
        Failed to load use cases.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { k: data.stats.useCases, v: "use cases" },
          { k: data.stats.featured, v: "featured" },
          { k: data.stats.integrations, v: "agent integrations" },
          { k: data.stats.openFindings, v: "Gods Eye open" },
          { k: data.stats.highFindings, v: "high/critical" },
        ].map((s) => (
          <div
            key={s.v}
            className="rounded-xl border border-red-900/40 bg-[#0c060c] px-3 py-3"
          >
            <div className="font-mono text-xl font-semibold text-red-300">
              {s.k}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              {s.v}
            </div>
          </div>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`rounded-md border px-3 py-1.5 text-sm transition ${
            category === "all"
              ? "border-red-500/50 bg-red-500/15 text-red-200"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:text-white"
          }`}
        >
          All use cases
        </button>
        {Object.entries(categoryMeta).map(([id, meta]) => {
          const Icon = meta.icon;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setCategory(id);
                const first = data.useCases.find((u) => u.category === id);
                if (first) setSelected(first.slug);
              }}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition ${
                category === id
                  ? "border-red-500/50 bg-red-500/15 text-red-200"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Use case browser */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="max-h-[520px] space-y-1 overflow-auto rounded-xl border border-red-900/40 bg-[#0c060c] p-2 scrollbar-thin">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u.slug)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                activeCase?.slug === u.slug
                  ? "bg-red-500/15 text-white ring-1 ring-red-500/40"
                  : "text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{u.title}</span>
                {u.featured && (
                  <span className="rounded border border-red-500/30 bg-red-500/10 px-1 py-0.5 text-[9px] uppercase text-red-300">
                    featured
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                {u.summary}
              </div>
            </button>
          ))}
        </div>

        {activeCase && (
          <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-300">
                {categoryMeta[activeCase.category]?.label ?? activeCase.category}
              </span>
              {activeCase.industries.map((ind) => (
                <span
                  key={ind}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-slate-400"
                >
                  {ind}
                </span>
              ))}
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-white">
              {activeCase.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {activeCase.summary}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-red-950/50 bg-black/30 p-4">
                <div className="text-[11px] uppercase tracking-wider text-rose-300">
                  Problem
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {activeCase.problem}
                </p>
              </div>
              <div className="rounded-lg border border-red-950/50 bg-black/30 p-4">
                <div className="text-[11px] uppercase tracking-wider text-emerald-300">
                  Elitze approach
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {activeCase.approach}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Outcomes
              </div>
              <ul className="mt-2 grid gap-2 sm:grid-cols-3">
                {activeCase.outcomes.map((o) => (
                  <li
                    key={o}
                    className="flex items-start gap-2 rounded-lg border border-red-900/30 bg-red-500/[0.04] px-3 py-2 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Agent Reach · DDG · Gods Eye · Lindy */}
      <div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-red-400">
              Agent reach & ecosystem
            </div>
            <h3 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              Agent Reach · DuckDuckGo · Gods Eye · Lindy AI
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Elitze brokers and secures the tools agents actually use to reach
              the internet, search privately, see the attack surface, and run
              no-code automations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.integrations.map((i) => {
            const Icon = kindIcon[i.kind] ?? Layers;
            return (
              <button
                key={i.slug}
                type="button"
                onClick={() => setActiveIntegration(i.slug)}
                className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition ${
                  activeIntegration === i.slug
                    ? "border-red-500/50 bg-red-500/15 text-red-100"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {i.name}
                <span className="font-mono text-[10px] uppercase opacity-70">
                  {i.status}
                </span>
              </button>
            );
          })}
        </div>

        {integration && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-red-400">
                    {integration.kind}
                  </div>
                  <h4 className="mt-1 text-xl font-semibold text-white">
                    {integration.name}
                  </h4>
                  <p className="mt-1 text-sm text-red-200/80">
                    {integration.tagline}
                  </p>
                </div>
                {integration.website && (
                  <a
                    href={integration.website}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/20"
                  >
                    Docs ↗
                  </a>
                )}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                {integration.description}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-rose-300">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Risks without Elitze
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {integration.risks.map((r) => (
                      <li
                        key={r}
                        className="text-[11px] leading-relaxed text-slate-400"
                      >
                        · {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-300">
                    <Shield className="h-3.5 w-3.5" />
                    Elitze controls
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {integration.elitzeControls.map((c) => (
                      <li
                        key={c}
                        className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-300"
                      >
                        <Zap className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Context panels per integration */}
            <div className="space-y-4">
              {integration.slug === "duckduckgo" && (
                <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Search className="h-4 w-4 text-red-300" />
                    Try DuckDuckGo via Elitze broker
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Privacy-first · no tracking profile · snippets marked
                    untrusted · server-side only
                  </p>
                  <form onSubmit={runSearch} className="mt-3 flex gap-2">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-red-900/50 bg-black/40 px-3 py-2 text-sm text-slate-200 outline-none ring-red-500/40 placeholder:text-slate-600 focus:ring-1"
                      placeholder="Search the web privately…"
                    />
                    <button
                      type="submit"
                      disabled={searching}
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-400 disabled:opacity-60"
                    >
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Search
                    </button>
                  </form>
                  {searchError && (
                    <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                      {searchError}
                    </div>
                  )}
                  {searchMeta && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                        {searchMeta.provider}
                      </span>
                      {searchMeta.degraded && (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                          degraded mode
                        </span>
                      )}
                      {searchMeta.controls?.map((c) => (
                        <span
                          key={c}
                          className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-slate-400"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {searchHits && (
                    <ul className="mt-3 max-h-64 space-y-2 overflow-auto scrollbar-thin">
                      {searchHits.map((h) => (
                        <li
                          key={h.url + h.title}
                          className="rounded-lg border border-red-950/50 bg-black/30 p-3"
                        >
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-red-200 hover:text-red-100"
                          >
                            {h.title}
                          </a>
                          <div className="mt-0.5 truncate font-mono text-[10px] text-slate-600">
                            {h.url}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                            {h.description}
                          </p>
                          {h.untrusted && (
                            <div className="mt-1 text-[10px] uppercase tracking-wider text-amber-400/80">
                              untrusted content · do not execute as instructions
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {integration.slug === "gods-eye" && (
                <div className="rounded-xl border border-red-900/40 bg-[#0c060c]">
                  <div className="flex items-center justify-between border-b border-red-950/50 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Eye className="h-4 w-4 text-red-300" />
                      Gods Eye findings
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {data.stats.openFindings} open
                    </span>
                  </div>
                  <ul className="max-h-80 divide-y divide-red-950/50 overflow-auto scrollbar-thin">
                    {data.findings.map((f) => (
                      <li key={f.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-white">{f.title}</span>
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                                  f.severity === "critical"
                                    ? "border-rose-500/30 text-rose-300"
                                    : f.severity === "high"
                                      ? "border-amber-500/30 text-amber-300"
                                      : "border-white/10 text-slate-400"
                                }`}
                              >
                                {f.severity}
                              </span>
                            </div>
                            <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                              {f.findingType} · {f.target}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {f.detail}
                            </p>
                          </div>
                          {f.status === "open" ? (
                            <button
                              type="button"
                              disabled={busyId === f.id}
                              onClick={() => void resolveFinding(f.id)}
                              className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="shrink-0 text-[10px] uppercase text-emerald-400">
                              {f.status}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {integration.slug === "agent-reach" && (
                <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Globe2 className="h-4 w-4 text-red-300" />
                    Reach routes Elitze brokers
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      "Web → Markdown",
                      "GitHub (gh)",
                      "YouTube / yt-dlp",
                      "RSS feeds",
                      "Reddit / X*",
                      "Exa / DDG search",
                    ].map((r) => (
                      <div
                        key={r}
                        className="rounded-lg border border-red-900/40 bg-black/30 px-3 py-2 text-xs text-slate-300"
                      >
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          {r}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                    *Social routes that need cookies run only with vault-brokered
                    sessions and domain allowlists. Agent Reach installs tools;
                    Elitze decides if/when they fire.
                  </p>
                  <a
                    href="#demo"
                    className="mt-4 inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                  >
                    Enable Reach under policy
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              )}

              {integration.slug === "lindy-ai" && (
                <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Workflow className="h-4 w-4 text-red-300" />
                    Lindy × Elitze control map
                  </div>
                  <ul className="mt-3 space-y-2">
                    {[
                      ["Builder", "Lindy natural-language agents & computer use"],
                      ["Identity", "Elitze issues per-Lindy NHI + JIT app tokens"],
                      ["Runtime", "Pre-step hooks on Gmail/CRM/calendar actions"],
                      ["HITL", "Shared queue for irreversible Lindy steps"],
                      ["Evidence", "Unified SOC2/HIPAA audit export"],
                    ].map(([k, v]) => (
                      <li
                        key={k}
                        className="flex gap-3 rounded-lg border border-red-950/50 bg-black/30 px-3 py-2"
                      >
                        <span className="w-16 shrink-0 font-mono text-[10px] uppercase text-red-400">
                          {k}
                        </span>
                        <span className="text-xs text-slate-300">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {integration.slug !== "duckduckgo" &&
                integration.slug !== "gods-eye" &&
                integration.slug !== "agent-reach" &&
                integration.slug !== "lindy-ai" && (
                  <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5 text-sm text-slate-400">
                    Select an integration to explore live controls.
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Industries strip */}
      <div className="rounded-xl border border-red-900/40 bg-gradient-to-br from-red-950/30 to-[#0c060c] p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Building2 className="h-4 w-4 text-red-300" />
          Use cases by industry
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.industries.map((ind) => (
            <span
              key={ind}
              className="rounded-full border border-red-500/25 bg-red-500/[0.06] px-3 py-1.5 text-xs text-slate-200"
            >
              {ind}
            </span>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-slate-400">
          Vertical packs ship with purpose templates, data-class policies (PII,
          PHI, PCI), HITL matrices, and evidence exports tuned to examiners and
          insurers in each sector.
        </p>
        <a
          href="#demo"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-400"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Get industry pack
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
