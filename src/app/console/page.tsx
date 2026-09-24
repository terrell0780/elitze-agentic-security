"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Database, Network, Search, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import SmartChatHierarchy from "@/components/smart-chat-hierarchy";
import SecurityRoleMap from "@/components/security-role-map";
import TeamCollaboration from "@/components/team-collaboration";
import GovernedChat from "@/components/governed-chat";
import ProgressiveProofPanel from "@/components/progressive-proof-panel";
import EvidenceExpressionDebugger from "@/components/evidence-expression-debugger";

type Health = { ok: boolean; checks?: { database?: string; schema?: string } };
type Overview = { ok: boolean; metrics?: { agentIdentities: number; activeMcpServers: number; activePolicies: number; pendingApprovals: number; approvalRequests: number; gatewayDecisions: number; deniedGatewayDecisions: number; approvalRequiredDecisions: number; graphNodes: number; graphEdges: number; graphEvidence: number; securityTests: number; queuedTests: number; runningTests: number; completedTests: number; failedTests: number; evidenceRecords: number; latestDecisionAt: string | null; latestTestAt: string | null; latestEvidenceAt: string | null }; error?: string };
type SearchResult = { title: string; url: string; description: string; untrusted: true };
type Metrics = { ok: boolean; metrics?: { averageEnforcementLatencyMs: number | null; intentMismatches: number; autonomousDecisionRate: { value: number | null; state: string }; analystCoverage: { value: number | null; state: string } } };
type Graph = { ok: boolean; nodes?: Array<{ nodeType: string; displayName: string; evidenceState: string; source: string; observedAt: string | null }>; edges?: Array<{ relation: string; from: string; to: string; evidenceState: string; source: string }>; error?: string };

const cards = [
  [Activity, "Agent identities", (d: Overview) => d.metrics ? String(d.metrics.agentIdentities) : "UNMEASURABLE"],
  [Network, "Active MCP servers", (d: Overview) => d.metrics ? String(d.metrics.activeMcpServers) : "UNMEASURABLE"],
  [Users, "Pending approvals", (d: Overview) => d.metrics ? String(d.metrics.pendingApprovals) : "UNMEASURABLE"],
  [ShieldCheck, "Active policies", (d: Overview) => d.metrics ? String(d.metrics.activePolicies) : "UNMEASURABLE"],
] as const;

function metricValue(metric?: { value: number | null; state: string }, suffix = "") {
  if (!metric || metric.state !== "MEASURABLE" || metric.value === null) return "UNMEASURABLE";
  return `${metric.value}${suffix}`;
}

export default function ConsolePage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ ok: boolean; user: unknown | null }>)
      .then((session) => {
        if (!active) return;
        if (!session.ok || !session.user) {
          router.replace("/login?next=%2Fconsole");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => router.replace("/login?next=%2Fconsole"));
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (authorized !== true) return;
    void Promise.all([
      fetch("/api/health", { cache: "no-store" }).then((r) => r.json() as Promise<Health>).catch(() => ({ ok: false })),
      fetch("/api/console/overview", { cache: "no-store" }).then((r) => r.json() as Promise<Overview>).catch(() => ({ ok: false })),
      fetch("/api/console/security-graph", { cache: "no-store" }).then((r) => r.json() as Promise<Graph>).catch(() => ({ ok: false, error: "security_graph_unavailable" })),
    ]).then(([h, o, g]) => { setHealth(h); setOverview(o); setGraph(g); });
  }, [authorized]);

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

  if (authorized === null) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]"><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center"><div className="text-xs font-bold tracking-[.28em] text-[var(--accent)]">ELITZE</div><div className="mt-3 text-sm font-semibold">Checking secure session…</div></div></main>;
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><div><div className="text-sm font-bold tracking-wide">ELITZE</div><div className="text-[10px] uppercase tracking-[.22em] text-[var(--accent)]">Agentic Security Console</div></div><div className="flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${health?.ok ? "bg-emerald-400" : "bg-amber-400"}`} /><span className="text-[var(--muted)]">{health?.ok ? "Database connected" : "Database unavailable"}</span></div></div></header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-7 flex flex-col gap-2"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Live security state</div><h1 className="text-3xl font-black tracking-[-.04em] sm:text-4xl">Security Console</h1><p className="max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">Live state comes only from configured ELITZE services and database. Empty means empty; unavailable means unavailable.</p></div>

        {!overview?.ok && <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-sm text-amber-200">The tenant data plane is not currently available. Database connectivity and completed migrations are required before live security records can be displayed.</div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([Icon, label, value]) => <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-[var(--accent)]" /><span className="font-mono text-[9px] text-[var(--muted)]">TENANT LIVE</span></div><div className="mt-5 font-mono text-2xl font-semibold">{overview ? value(overview) : "UNMEASURABLE"}</div><div className="mt-1 text-xs uppercase tracking-wider text-[var(--muted)]">{label}</div></div>)}</section>

        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--accent)]" /><h2 className="text-sm font-semibold">Tenant control-plane state</h2></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><div className="font-mono text-xl font-semibold">{overview?.metrics ? String(overview.metrics.gatewayDecisions) : "UNMEASURABLE"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">Gateway decisions</div></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><div className="font-mono text-xl font-semibold">{overview?.metrics ? String(overview.metrics.deniedGatewayDecisions) : "UNMEASURABLE"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">Denied decisions</div></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><div className="font-mono text-xl font-semibold">{overview?.metrics ? String(overview.metrics.securityTests) : "UNMEASURABLE"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">Security test requests</div></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><div className="font-mono text-xl font-semibold">{overview?.metrics ? String(overview.metrics.evidenceRecords + overview.metrics.graphEvidence) : "UNMEASURABLE"}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">Evidence records</div></div>
          </div>
          <p className="mt-4 text-[10px] text-[var(--muted)]">All values are derived from authenticated records belonging to the current tenant. No cross-tenant aggregate or synthetic metric is rendered.</p>
        </section>

        <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7"><div className="flex items-center gap-2"><Network className="h-4 w-4 text-[var(--accent)]" /><h2 className="text-sm font-semibold">Security graph — observed records</h2></div>{graph?.ok ? <><div className="mt-3 text-xs text-[var(--muted)]">{graph.nodes?.length ?? 0} nodes · {graph.edges?.length ?? 0} edges. No risk score is calculated from missing evidence.</div><div className="mt-4 grid gap-3 lg:grid-cols-2"><div><div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">Observed nodes</div><div className="max-h-72 space-y-2 overflow-auto">{(graph.nodes ?? []).slice(0, 20).map((node, index) => <div key={`${node.nodeType}:${node.displayName}:${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3"><div className="text-xs font-medium">{node.displayName}</div><div className="mt-1 text-[10px] text-[var(--muted)]">{node.nodeType} · {node.source} · {node.evidenceState}</div></div>)}{(graph.nodes ?? []).length === 0 && <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-xs text-[var(--muted)]">UNKNOWN — no graph records are available.</div>}</div></div><div><div className="mb-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">Observed relationships</div><div className="max-h-72 space-y-2 overflow-auto">{(graph.edges ?? []).slice(0, 20).map((edge, index) => <div key={`${edge.relation}:${edge.from}:${edge.to}:${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3"><div className="text-xs font-medium">{edge.from} → {edge.to}</div><div className="mt-1 text-[10px] text-[var(--muted)]">{edge.relation} · {edge.source} · {edge.evidenceState}</div></div>)}{(graph.edges ?? []).length === 0 && <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-xs text-[var(--muted)]">UNAVAILABLE — no observed relationships are available.</div>}</div></div></div></> : <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-xs text-amber-300">{graph?.error ?? "UNAVAILABLE"}. The console will not substitute simulated graph data.</div>}</section>

        <ProgressiveProofPanel />

        <EvidenceExpressionDebugger />

        <GovernedChat />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-[var(--accent)]" /><h2 className="text-sm font-semibold">Brokered security search</h2></div><form onSubmit={runSearch} className="mt-4 flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={500} placeholder="Search public security information" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent-border)]" /><button disabled={busy} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Searching" : "Search"}</button></form>{searchError && <p className="mt-3 text-xs text-rose-300">{searchError}</p>}<div className="mt-5 space-y-3">{results.map((result) => <article key={result.url} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><a href={result.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-[var(--accent)]">{result.title}</a><p className="mt-1 break-all text-[10px] text-[var(--muted)]">{result.url}</p><p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{result.description}</p><div className="mt-2 text-[10px] uppercase tracking-wider text-amber-300/80">External data · untrusted</div></article>)}{!busy && results.length === 0 && <p className="py-8 text-center text-xs text-[var(--muted)]">No search results loaded.</p>}</div></div><div className="space-y-6"><div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6"><div className="flex items-center gap-2 text-sm font-semibold"><Database className="h-4 w-4 text-[var(--accent)]" />Data plane</div><div className="mt-4 space-y-3 text-xs text-[var(--muted)]"><div className="flex justify-between"><span>Database</span><span className={health?.ok ? "text-emerald-300" : "text-amber-300"}>{health?.ok ? "connected" : health?.checks?.database ?? "unavailable"}</span></div><div className="flex justify-between"><span>Schema</span><span>{health?.checks?.schema ?? "unknown"}</span></div><div className="flex justify-between"><span>Tenant evidence</span><span>{overview?.metrics ? "loaded" : "unavailable"}</span></div><div className="flex justify-between"><span>Synthetic data</span><span>disabled</span></div></div></div><div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6"><h2 className="text-sm font-semibold">Operational boundary</h2><p className="mt-3 text-xs leading-5 text-[var(--muted)]">Internal decision and containment APIs require the ELITZE internal API key. Browser clients never receive that key.</p></div></div></section>

        <SecurityRoleMap />
        <SmartChatHierarchy />
        <TeamCollaboration />
      </div>
    </main>
  );
}
