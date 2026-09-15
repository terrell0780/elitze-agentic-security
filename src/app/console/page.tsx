"use client";

import { FormEvent, useEffect, useState } from "react";
import { Activity, Database, Network, Search, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import SmartChatHierarchy from "@/components/smart-chat-hierarchy";
import SecurityRoleMap from "@/components/security-role-map";
import TeamCollaboration from "@/components/team-collaboration";
import GovernedChat from "@/components/governed-chat";

type Health = { ok: boolean };
type Market = { ok: boolean; stats?: { agents: number; shadowAgents: number; openDiscoveries: number; pendingApprovals: number; asiAvg: number }; events?: Array<{ id: number; severity: string; eventType: string; summary: string; createdAt: string }> };
type SearchResult = { title: string; url: string; description: string; untrusted: true };
type Metrics = { ok: boolean; metrics?: { enforcementEvents: number; highImpactEvents: number; averageEnforcementLatencyMs: number | null; intentMismatches: number; securityDecisions: number; deniedDecisions: number; humanReviewDecisions: number; autonomousDecisionRate: { value: number | null; state: string }; analystFeedbackCount: number; analystCoverage: { value: number | null; state: string }; feedbackBenignShare: { value: number | null; state: string }; pendingApprovals: number; decidedApprovals: number } };
type Graph = { ok: boolean; nodes?: Array<{ nodeType: string; displayName: string; evidenceState: string; source: string; observedAt: string | null }>; edges?: Array<{ relation: string; from: string; to: string; evidenceState: string; source: string }>; error?: string };

const cards = [
  [Activity, "Agents", (d: Market) => d.stats?.agents ?? 0],
  [TriangleAlert, "Open discoveries", (d: Market) => d.stats?.openDiscoveries ?? 0],
  [Users, "Pending approvals", (d: Market) => d.stats?.pendingApprovals ?? 0],
  [ShieldCheck, "ASI coverage", (d: Market) => `${d.stats?.asiAvg ?? 0}%`],
] as const;

function metricValue(metric?: { value: number | null; state: string }, suffix = "") {
  if (!metric || metric.state !== "MEASURABLE" || metric.value === null) return "UNMEASURABLE";
  return `${metric.value}${suffix}`;
}

export default function ConsolePage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/health", { cache: "no-store" }).then((r) => r.json() as Promise<Health>).catch(() => ({ ok: false })),
      fetch("/api/market", { cache: "no-store" }).then((r) => r.json() as Promise<Market>).catch(() => ({ ok: false })),
      fetch("/api/soc/metrics", { cache: "no-store" }).then((r) => r.json() as Promise<Metrics>).catch(() => ({ ok: false })),
      fetch("/api/console/security-graph", { cache: "no-store" }).then((r) => r.json() as Promise<Graph>).catch(() => ({ ok: false, error: "security_graph_unavailable" })),
    ]).then(([h, m, s, g]) => { setHealth(h); setMarket(m); setMetrics(s); setGraph(g); });
  }, []);

  async function runSearch(event: FormEvent) {
    event.preventDefault(); setSearchError(null); setResults([]); if (!query.trim()) return; setBusy(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&max=8`, { cache: "no-store" });
      const payload = (await response.json()) as { ok: boolean; error?: string; results?: SearchResult[] };
      if (!response.ok || !payload.ok) { setSearchError(payload.error ?? "Search failed"); return; }
      setResults(payload.results ?? []);
    } catch { setSearchError("Search service unavailable"); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="border-b border-red-950/40 bg-[#09050a]"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"><div><div className="text-sm font-semibold tracking-wide text-white">ELITZE</div><div className="text-[10px] uppercase tracking-[0.2em] text-red-300">Agentic Security Console</div></div><div className="flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${health?.ok ? "bg-emerald-400" : "bg-amber-400"}`} /><span className="text-slate-400">{health?.ok ? "Database healthy" : "Database unavailable"}</span></div></div></header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-2"><h1 className="text-3xl font-semibold text-white">Security Console</h1><p className="text-sm text-slate-400">Live state comes only from configured ELITZE services and database. Empty means empty; unavailable means unavailable.</p></div>

        {!market?.ok && <div className="mb-6 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-sm text-amber-200">The security data plane is not currently available. Configure DATABASE_URL and apply the database migration before expecting inventory or event data.</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([Icon, label, value]) => <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><Icon className="h-4 w-4 text-red-300" /><div className="mt-5 font-mono text-2xl font-semibold text-white">{market ? value(market) : "—"}</div><div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{label}</div></div>)}</section>

        <section className="mt-8 rounded-2xl border border-white/8 bg-white/[0.02] p-6"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-red-300" /><h2 className="text-sm font-semibold text-white">SOC performance — measured from ELITZE records</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-white/7 bg-black/20 p-4"><div className="font-mono text-xl font-semibold">{metrics?.metrics ? metricValue(metrics.metrics.autonomousDecisionRate, "%") : "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Autonomous decision rate</div></div><div className="rounded-xl border border-white/7 bg-black/20 p-4"><div className="font-mono text-xl font-semibold">{metrics?.metrics ? metricValue(metrics.metrics.analystCoverage, "%") : "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Analyst feedback coverage</div></div><div className="rounded-xl border border-white/7 bg-black/20 p-4"><div className="font-mono text-xl font-semibold">{metrics?.metrics?.averageEnforcementLatencyMs === null ? "UNMEASURABLE" : metrics?.metrics ? `${Math.round(metrics.metrics.averageEnforcementLatencyMs ?? 0)} ms` : "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Average enforcement latency</div></div><div className="rounded-xl border border-white/7 bg-black/20 p-4"><div className="font-mono text-xl font-semibold">{metrics?.metrics?.intentMismatches ?? "—"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Intent mismatches recorded</div></div></div><p className="mt-4 text-[10px] text-slate-600">No synthetic measurements. A metric without sufficient observations remains UNMEASURABLE.</p></section>

        <section className="mt-8 rounded-2xl border border-white/8 bg-white/[0.02] p-6"><div className="flex items-center gap-2"><Network className="h-4 w-4 text-red-300" /><h2 className="text-sm font-semibold text-white">Security graph — observed records</h2></div>{graph?.ok ? <><div className="mt-3 text-xs text-slate-500">{graph.nodes?.length ?? 0} nodes · {graph.edges?.length ?? 0} edges. No risk score is calculated from missing evidence.</div><div className="mt-4 grid gap-3 lg:grid-cols-2"><div><div className="mb-2 text-[10px] uppercase tracking-wider text-slate-600">Observed nodes</div><div className="max-h-72 space-y-2 overflow-auto">{(graph.nodes ?? []).slice(0, 20).map((node, index) => <div key={`${node.nodeType}:${node.displayName}:${index}`} className="rounded-lg border border-white/7 bg-black/20 p-3"><div className="text-xs font-medium text-white">{node.displayName}</div><div className="mt-1 text-[10px] text-slate-500">{node.nodeType} · {node.source} · {node.evidenceState}</div></div>)}{(graph.nodes ?? []).length === 0 && <div className="rounded-lg border border-dashed border-white/10 p-4 text-xs text-slate-600">UNKNOWN — no graph records are available.</div>}</div></div><div><div className="mb-2 text-[10px] uppercase tracking-wider text-slate-600">Observed relationships</div><div className="max-h-72 space-y-2 overflow-auto">{(graph.edges ?? []).slice(0, 20).map((edge, index) => <div key={`${edge.relation}:${edge.from}:${edge.to}:${index}`} className="rounded-lg border border-white/7 bg-black/20 p-3"><div className="text-xs font-medium text-white">{edge.from} → {edge.to}</div><div className="mt-1 text-[10px] text-slate-500">{edge.relation} · {edge.source} · {edge.evidenceState}</div></div>)}{(graph.edges ?? []).length === 0 && <div className="rounded-lg border border-dashed border-white/10 p-4 text-xs text-slate-600">UNAVAILABLE — no observed relationships are available.</div>}</div></div></div></> : <div className="mt-4 rounded-lg border border-dashed border-white/10 p-4 text-xs text-amber-300">{graph?.error ?? "UNAVAILABLE"}. The console will not substitute simulated graph data.</div>}</section>

        <GovernedChat />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-red-300" /><h2 className="text-sm font-semibold text-white">Brokered security search</h2></div><form onSubmit={runSearch} className="mt-4 flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={500} placeholder="Search public security information" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500/40" /><button disabled={busy} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Searching" : "Search"}</button></form>{searchError && <p className="mt-3 text-xs text-rose-300">{searchError}</p>}<div className="mt-5 space-y-3">{results.map((result) => <article key={result.url} className="rounded-xl border border-white/7 bg-black/20 p-4"><a href={result.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-red-200">{result.title}</a><p className="mt-1 break-all text-[10px] text-slate-600">{result.url}</p><p className="mt-2 text-xs leading-5 text-slate-400">{result.description}</p><div className="mt-2 text-[10px] uppercase tracking-wider text-amber-300/80">External data · untrusted</div></article>)}{!busy && results.length === 0 && <p className="py-8 text-center text-xs text-slate-600">No search results loaded.</p>}</div></div><div className="space-y-6"><div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6"><div className="flex items-center gap-2 text-sm font-semibold text-white"><Database className="h-4 w-4 text-red-300" />Data plane</div><div className="mt-4 space-y-3 text-xs text-slate-400"><div className="flex justify-between"><span>Database</span><span className={health?.ok ? "text-emerald-300" : "text-amber-300"}>{health?.ok ? "connected" : "unavailable"}</span></div><div className="flex justify-between"><span>Market records</span><span>{market?.stats ? "loaded" : "not loaded"}</span></div><div className="flex justify-between"><span>Seed data</span><span className="text-emerald-300">disabled</span></div></div></div><div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6"><h2 className="text-sm font-semibold text-white">Operational boundary</h2><p className="mt-3 text-xs leading-5 text-slate-500">Internal decision and containment APIs require the ELITZE internal API key. Browser clients never receive that key.</p></div></div></section>

        <SecurityRoleMap />
        <SmartChatHierarchy />
        <TeamCollaboration />
      </div>
    </main>
  );
}
