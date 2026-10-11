"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bot, CheckCircle2, ChevronRight, CircleHelp, Clock3, Database, FileCheck2, Fingerprint, Gauge, GitBranch, Network, RefreshCw, Search, ShieldCheck, ShieldX, Users, Workflow, X } from "lucide-react";
import SmartChatHierarchy from "@/components/smart-chat-hierarchy";
import SecurityRoleMap from "@/components/security-role-map";
import TeamCollaboration from "@/components/team-collaboration";
import GovernedChat from "@/components/governed-chat";
import ProgressiveProofPanel from "@/components/progressive-proof-panel";
import EvidenceExpressionDebugger from "@/components/evidence-expression-debugger";

type Health = { ok: boolean; checks?: { database?: string; schema?: string } };
type Metrics = { agentIdentities: number; activeMcpServers: number; activePolicies: number; pendingApprovals: number; approvalRequests: number; gatewayDecisions: number; deniedGatewayDecisions: number; approvalRequiredDecisions: number; graphNodes: number; graphEdges: number; graphEvidence: number; securityTests: number; queuedTests: number; runningTests: number; completedTests: number; failedTests: number; evidenceRecords: number; latestDecisionAt: string | null; latestTestAt: string | null; latestEvidenceAt: string | null };
type Overview = { ok: boolean; metrics?: Metrics; error?: string };
type SearchResult = { title: string; url: string; description: string; untrusted: true };
type GraphNode = { nodeType: string; displayName: string; evidenceState: string; source: string; observedAt: string | null };
type GraphEdge = { relation: string; from: string; to: string; evidenceState: string; source: string };
type Graph = { ok: boolean; nodes?: GraphNode[]; edges?: GraphEdge[]; error?: string };
type View = "overview" | "graph" | "validate" | "govern" | "evidence" | "analyst" | "team";

const navigation: Array<{ id: View; label: string; icon: typeof Activity; hint: string }> = [
  { id: "overview", label: "Command center", icon: Gauge, hint: "Live tenant posture" },
  { id: "graph", label: "Security graph", icon: Network, hint: "Observed assets & paths" },
  { id: "validate", label: "Validate & test", icon: Workflow, hint: "Release security" },
  { id: "govern", label: "Policy & access", icon: ShieldCheck, hint: "Governed decisions" },
  { id: "evidence", label: "Evidence vault", icon: FileCheck2, hint: "Proof & provenance" },
  { id: "analyst", label: "AI analyst", icon: Bot, hint: "Investigate with controls" },
  { id: "team", label: "Team workspace", icon: Users, hint: "Ownership & collaboration" },
];

const metricsCards: Array<{ key: keyof Metrics; label: string; icon: typeof Activity; format?: (value: number) => string }> = [
  { key: "agentIdentities", label: "Agent identities", icon: Fingerprint },
  { key: "activeMcpServers", label: "Active MCP servers", icon: Network },
  { key: "activePolicies", label: "Active policies", icon: ShieldCheck },
  { key: "pendingApprovals", label: "Pending approvals", icon: Clock3 },
];

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
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [graphFilter, setGraphFilter] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphMode, setGraphMode] = useState<"nodes" | "paths">("nodes");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ ok: boolean; user: unknown | null }>)
      .then((session) => {
        if (!active) return;
        if (!session.ok || !session.user) { router.replace("/login?next=%2Fconsole"); return; }
        setAuthorized(true);
      })
      .catch(() => router.replace("/login?next=%2Fconsole"));
    return () => { active = false; };
  }, [router]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [healthResponse, overviewResponse, graphResponse] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }),
        fetch("/api/console/overview", { cache: "no-store" }),
        fetch("/api/console/security-graph", { cache: "no-store" }),
      ]);
      const [h, o, g] = await Promise.all([
        healthResponse.json() as Promise<Health>,
        overviewResponse.json() as Promise<Overview>,
        graphResponse.json() as Promise<Graph>,
      ]);
      setHealth(h); setOverview(o); setGraph(g);
      if (!g.ok) setSelectedNode(null);
    } catch {
      setHealth({ ok: false }); setOverview({ ok: false, error: "tenant_data_unavailable" }); setGraph({ ok: false, error: "security_graph_unavailable" });
    } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { if (authorized === true) void refresh(); }, [authorized, refresh]);

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const filteredNodes = useMemo(() => nodes.filter((node) => `${node.displayName} ${node.nodeType} ${node.evidenceState} ${node.source}`.toLowerCase().includes(graphFilter.toLowerCase())), [nodes, graphFilter]);
  const filteredEdges = useMemo(() => edges.filter((edge) => `${edge.from} ${edge.to} ${edge.relation} ${edge.evidenceState} ${edge.source}`.toLowerCase().includes(graphFilter.toLowerCase())), [edges, graphFilter]);

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

  if (authorized === null) return <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]"><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center"><div className="text-xs font-bold tracking-[.28em] text-[var(--accent)]">ELITZE</div><div className="mt-3 text-sm font-semibold">Verifying secure session</div></div></main>;

  const current = navigation.find((item) => item.id === view) ?? navigation[0];

  return (
    <main className="min-h-screen bg-[#070b10] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#070b10]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="ELITZE home"><span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/[.08] text-cyan-200"><ShieldCheck className="h-5 w-5" /></span><span><b className="block text-sm tracking-[.14em]">ELITZE</b><span className="block text-[9px] uppercase tracking-[.22em] text-slate-500">Agentic security</span></span></Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.025] px-3 py-2 md:flex"><span className={`h-1.5 w-1.5 rounded-full ${health?.ok ? "bg-cyan-300" : "bg-amber-300"}`} /><span className="text-[10px] font-medium uppercase tracking-[.15em] text-slate-400">{health?.ok ? "Data plane reachable" : "Data plane unavailable"}</span></div>
          <div className="flex items-center gap-2"><Link href="/console/analyst" className="hidden rounded-lg border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-2 text-[11px] font-semibold text-cyan-100 hover:border-cyan-300/40 sm:inline-flex">Autonomous Analyst</Link><Link href="/console/readiness" className="hidden rounded-lg border border-white/10 px-3 py-2 text-[11px] font-medium text-slate-300 hover:border-cyan-300/30 sm:inline-flex">Readiness</Link><button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2.5 text-[11px] font-semibold text-slate-200 hover:border-cyan-300/30 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh data</span></button><Link href="/faq" aria-label="Help and FAQ" className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-300 hover:border-cyan-300/30"><CircleHelp className="h-4 w-4" /></Link></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] gap-5 px-3 py-4 sm:px-5 lg:grid-cols-[228px_minmax(0,1fr)] lg:px-8 lg:py-7">
        <aside className="h-fit rounded-2xl border border-white/[.08] bg-[#0b1118] p-2 lg:sticky lg:top-[88px]">
          <div className="px-3 pb-3 pt-3"><div className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">Workspace</div><div className="mt-1 text-sm font-semibold">Security operations</div></div>
          <nav aria-label="Security workspace" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {navigation.map((item) => { const Icon = item.icon; const active = view === item.id; return <button key={item.id} type="button" onClick={() => setView(item.id)} aria-current={active ? "page" : undefined} className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "border border-cyan-300/20 bg-cyan-300/[.08] text-cyan-100" : "border border-transparent text-slate-400 hover:bg-white/[.035] hover:text-slate-100"}`}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0"><span className="block truncate text-xs font-semibold">{item.label}</span><span className={`mt-1 hidden truncate text-[9px] sm:block ${active ? "text-cyan-100/60" : "text-slate-600"}`}>{item.hint}</span></span>{active && <ChevronRight className="ml-auto hidden h-3.5 w-3.5 lg:block" />}</button>; })}
          </nav>
          <div className="mt-3 border-t border-white/[.07] p-3"><div className="flex items-center gap-2 text-[10px] text-slate-500"><Database className="h-3.5 w-3.5" /> Database <span className={`ml-auto ${health?.ok ? "text-cyan-200" : "text-amber-300"}`}>{health?.ok ? "CONNECTED" : "UNAVAILABLE"}</span></div><div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500"><GitBranch className="h-3.5 w-3.5" /> Evidence <span className="ml-auto text-slate-300">{overview?.metrics ? "LOADED" : "UNKNOWN"}</span></div></div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[.23em] text-cyan-300">ELITZE / security operations</div><h1 className="mt-2 text-2xl font-bold tracking-[-.04em] sm:text-3xl">{current.label}</h1><p className="mt-1 text-xs text-slate-500">{current.hint} · authenticated tenant view</p></div><div className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.02] px-3 py-2 text-[10px] text-slate-400"><Activity className="h-3.5 w-3.5 text-cyan-300" /> {overview?.ok ? "LIVE DATA" : "DATA NOT VERIFIED"}</div></div>

          {!overview?.ok && <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-3 text-xs text-amber-100"><X className="mt-0.5 h-4 w-4 shrink-0" /><span>Tenant data is unavailable. Live records are withheld rather than replaced with simulated telemetry.</span></div>}

          {view === "overview" && <div className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricsCards.map((card) => { const Icon = card.icon; const value = overview?.metrics?.[card.key]; return <article key={card.key} className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 transition hover:border-cyan-300/20"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-cyan-300" /><span className="text-[8px] font-bold uppercase tracking-[.16em] text-slate-600">Tenant data</span></div><div className="mt-5 font-mono text-3xl font-semibold tracking-tight">{typeof value === "number" ? value.toLocaleString() : "UNMEASURABLE"}</div><div className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-400">{card.label}</div></article>; })}</section>
            <section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Control-plane activity</h2><p className="mt-1 text-[10px] text-slate-500">Values from the current authenticated tenant</p></div><button type="button" onClick={() => setView("evidence")} className="text-[10px] font-semibold text-cyan-200 hover:text-cyan-100">Inspect evidence →</button></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{label:"Gateway decisions",key:"gatewayDecisions" as const,icon:Activity},{label:"Denied",key:"deniedGatewayDecisions" as const,icon:ShieldX},{label:"Security tests",key:"securityTests" as const,icon:Workflow},{label:"Graph evidence",key:"graphEvidence" as const,icon:FileCheck2}].map((item) => { const Icon=item.icon; const value=overview?.metrics?.[item.key]; return <button type="button" key={item.key} onClick={() => setView(item.key === "securityTests" ? "validate" : item.key === "graphEvidence" ? "evidence" : "govern")} className="rounded-xl border border-white/[.07] bg-white/[.02] p-3 text-left hover:border-cyan-300/20"><Icon className="h-4 w-4 text-slate-400" /><div className="mt-3 font-mono text-xl font-semibold">{typeof value === "number" ? value.toLocaleString() : "—"}</div><div className="mt-1 text-[9px] text-slate-500">{item.label}</div></button>; })}</div></section>
            <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Observed security relationships</h2><p className="mt-1 text-[10px] text-slate-500">Select a record to inspect its source and evidence state</p></div><button type="button" onClick={() => setView("graph")} className="shrink-0 text-[10px] font-semibold text-cyan-200">Open graph →</button></div><div className="mt-4 space-y-2">{nodes.slice(0,4).map((node,index)=><button type="button" key={`${node.nodeType}:${node.displayName}:${index}`} onClick={()=>{setSelectedNode(node);setView("graph");}} className="flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-left hover:border-cyan-300/20"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-300/[.07] text-cyan-200"><Network className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{node.displayName}</span><span className="mt-1 block truncate text-[9px] text-slate-500">{node.nodeType} · {node.evidenceState}</span></span><ChevronRight className="h-3.5 w-3.5 text-slate-600" /></button>)}{nodes.length===0&&<div className="rounded-xl border border-dashed border-white/10 p-5 text-xs text-slate-500">No observed graph nodes available.</div>}</div></div><div className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><h2 className="text-sm font-semibold">Data plane</h2><div className="mt-4 space-y-3">{[{label:"Database",value:health?.ok?"Reachable":health?.checks?.database??"Unavailable",ok:health?.ok===true},{label:"Schema",value:health?.checks?.schema??"UNKNOWN",ok:health?.checks?.schema==="ok"||health?.checks?.schema==="ready"},{label:"Security graph",value:graph?.ok?`${nodes.length} nodes · ${edges.length} edges`:"Unavailable",ok:graph?.ok===true},{label:"Synthetic telemetry",value:"Disabled",ok:true}].map((item)=><div key={item.label} className="flex items-center justify-between gap-3 border-b border-white/[.05] pb-3 text-[10px]"><span className="text-slate-500">{item.label}</span><span className={item.ok?"text-cyan-200":"text-amber-200"}>{item.value}</span></div>)}</div></div></section>
            <section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-cyan-300"/><h2 className="text-sm font-semibold">Security intelligence search</h2></div><form onSubmit={runSearch} className="mt-3 flex gap-2"><input value={query} onChange={(e)=>setQuery(e.target.value)} maxLength={500} placeholder="Search public security intelligence" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs outline-none placeholder:text-slate-600 focus:border-cyan-300/40"/><button disabled={busy} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50">{busy?"Searching…":"Search"}</button></form>{searchError&&<p className="mt-3 text-xs text-rose-300">{searchError}</p>}{results.length>0&&<div className="mt-3 space-y-2">{results.map((result)=><article key={result.url} className="rounded-xl border border-white/[.07] p-3"><a href={result.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-100 hover:underline">{result.title}</a><p className="mt-1 text-[10px] text-slate-500">{result.description}</p><span className="mt-2 inline-block text-[8px] uppercase tracking-wider text-amber-200">External content · untrusted</span></article>)}</div>}</section>
          </div>}

          {view === "graph" && <div className="space-y-4"><section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-3"><div className="flex-1"><h2 className="text-sm font-semibold">Security relationship explorer</h2><p className="mt-1 text-[10px] text-slate-500">Only records returned by the tenant graph API appear here.</p></div><div className="flex rounded-xl border border-white/10 p-1"><button type="button" onClick={()=>setGraphMode("nodes")} className={`rounded-lg px-3 py-2 text-[10px] ${graphMode==="nodes"?"bg-cyan-300 text-slate-950":"text-slate-400"}`}>Nodes ({nodes.length})</button><button type="button" onClick={()=>setGraphMode("paths")} className={`rounded-lg px-3 py-2 text-[10px] ${graphMode==="paths"?"bg-cyan-300 text-slate-950":"text-slate-400"}`}>Relationships ({edges.length})</button></div></div><div className="mt-4"><input value={graphFilter} onChange={(e)=>setGraphFilter(e.target.value)} placeholder="Filter by asset, type, source or evidence" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs outline-none placeholder:text-slate-600 focus:border-cyan-300/40" /></div></section><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-3 sm:p-4"><div className="mb-3 flex items-center justify-between px-1 text-[10px] text-slate-500"><span>{graphMode==="nodes"?`${filteredNodes.length} matching nodes`:`${filteredEdges.length} matching relationships`}</span><span>{graph?.ok?"SOURCE-BOUND":"UNAVAILABLE"}</span></div><div className="max-h-[640px] space-y-2 overflow-auto">{graphMode==="nodes"?filteredNodes.map((node,index)=><button type="button" key={`${node.nodeType}:${node.displayName}:${index}`} onClick={()=>setSelectedNode(node)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selectedNode===node?"border-cyan-300/35 bg-cyan-300/[.06]":"border-white/[.06] bg-white/[.015] hover:border-white/15"}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-cyan-200"><Network className="h-4 w-4"/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{node.displayName}</span><span className="mt-1 block text-[9px] text-slate-500">{node.nodeType} · {node.source}</span></span><span className="rounded-full border border-white/10 px-2 py-1 text-[8px] text-slate-400">{node.evidenceState}</span></button>):filteredEdges.map((edge,index)=><article key={`${edge.relation}:${edge.from}:${edge.to}:${index}`} className="rounded-xl border border-white/[.06] bg-white/[.015] p-3"><div className="flex items-center gap-2 text-xs"><span className="min-w-0 truncate">{edge.from}</span><ChevronRight className="h-3 w-3 shrink-0 text-cyan-300"/><span className="min-w-0 truncate">{edge.to}</span></div><div className="mt-2 flex flex-wrap gap-2 text-[9px] text-slate-500"><span>{edge.relation}</span><span>·</span><span>{edge.source}</span><span>·</span><span>{edge.evidenceState}</span></div></article>)}{(graphMode==="nodes"?filteredNodes.length:filteredEdges.length)===0&&<div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">No matching observed records.</div>}</div></section><aside className="h-fit rounded-2xl border border-white/[.08] bg-[#0b1118] p-4"><div className="text-[9px] font-bold uppercase tracking-[.18em] text-cyan-300">Record inspector</div>{selectedNode?<><div className="mt-4 flex items-start justify-between gap-2"><h3 className="text-sm font-semibold">{selectedNode.displayName}</h3><button type="button" onClick={()=>setSelectedNode(null)} aria-label="Clear selected record" className="rounded-lg p-1 text-slate-500 hover:text-white"><X className="h-4 w-4"/></button></div><dl className="mt-4 space-y-3">{[{label:"Type",value:selectedNode.nodeType},{label:"Evidence",value:selectedNode.evidenceState},{label:"Source",value:selectedNode.source},{label:"Observed at",value:selectedNode.observedAt?new Date(selectedNode.observedAt).toLocaleString():"UNKNOWN"}].map(item=><div key={item.label} className="border-b border-white/[.06] pb-3"><dt className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</dt><dd className="mt-1 break-words text-xs text-slate-200">{item.value}</dd></div>)}</dl></>:<div className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-xs leading-5 text-slate-500">Select a node to inspect its source, timestamp and evidence state.</div>}<p className="mt-4 text-[9px] leading-4 text-slate-600">No reachability or risk is inferred from missing records.</p></aside></div></div>}

          {view === "validate" && <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2"><Link href="/console/pentesting" className="group rounded-2xl border border-white/[.08] bg-[#0b1118] p-5 hover:border-cyan-300/25"><CrosshairIcon/><h2 className="mt-4 text-sm font-semibold">Authorized security testing</h2><p className="mt-2 text-xs leading-5 text-slate-500">Open the test workspace to configure and inspect permitted validation requests.</p><span className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-200">Open test workspace <ChevronRight className="h-3 w-3"/></span></Link><Link href="/console/vulnerabilities" className="group rounded-2xl border border-white/[.08] bg-[#0b1118] p-5 hover:border-cyan-300/25"><ShieldX className="h-5 w-5 text-cyan-300"/><h2 className="mt-4 text-sm font-semibold">Vulnerability triage</h2><p className="mt-2 text-xs leading-5 text-slate-500">Review findings and remediation evidence from connected sources.</p><span className="mt-4 inline-flex items-center gap-2 text-[10px] font-semibold text-cyan-200">Open vulnerabilities <ChevronRight className="h-3 w-3"/></span></Link></section><section className="grid gap-3 sm:grid-cols-3">{[{label:"Queued",value:overview?.metrics?.queuedTests},{label:"Running",value:overview?.metrics?.runningTests},{label:"Failed",value:overview?.metrics?.failedTests}].map(item=><div key={item.label} className="rounded-xl border border-white/[.08] bg-[#0b1118] p-4"><div className="text-[9px] uppercase tracking-wider text-slate-500">{item.label} tests</div><div className="mt-2 font-mono text-2xl">{typeof item.value==="number"?item.value:"UNMEASURABLE"}</div></div>)}</section><ProgressiveProofPanel/></div>}

          {view === "govern" && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3">{[{label:"Gateway decisions",value:overview?.metrics?.gatewayDecisions},{label:"Denied",value:overview?.metrics?.deniedGatewayDecisions},{label:"Approval required",value:overview?.metrics?.approvalRequiredDecisions}].map(item=><div key={item.label} className="rounded-xl border border-white/[.08] bg-[#0b1118] p-4"><div className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</div><div className="mt-2 font-mono text-2xl">{typeof item.value==="number"?item.value:"UNMEASURABLE"}</div></div>)}</div><SecurityRoleMap/><GovernedChat/></div>}

          {view === "evidence" && <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-3">{[{label:"Graph evidence",value:overview?.metrics?.graphEvidence},{label:"Evidence records",value:overview?.metrics?.evidenceRecords},{label:"Latest test",value:overview?.metrics?.latestTestAt?new Date(overview.metrics.latestTestAt).toLocaleString():"UNKNOWN"}].map(item=><div key={item.label} className="rounded-xl border border-white/[.08] bg-[#0b1118] p-4"><div className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</div><div className="mt-2 break-words font-mono text-lg">{typeof item.value==="number"?item.value.toLocaleString():item.value}</div></div>)}</section><ProgressiveProofPanel/><EvidenceExpressionDebugger/></div>}

          {view === "analyst" && <div className="space-y-4"><GovernedChat/><SmartChatHierarchy/><section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4"><h2 className="text-sm font-semibold">Public security intelligence</h2><form onSubmit={runSearch} className="mt-3 flex gap-2"><input value={query} onChange={(e)=>setQuery(e.target.value)} maxLength={500} placeholder="Search threat intelligence, advisories, CVEs…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs outline-none placeholder:text-slate-600 focus:border-cyan-300/40"/><button disabled={busy} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50">{busy?"Searching…":"Search"}</button></form>{searchError&&<p className="mt-3 text-xs text-rose-300">{searchError}</p>}{results.map(result=><article key={result.url} className="mt-3 rounded-xl border border-white/[.07] p-3"><a href={result.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-100">{result.title}</a><p className="mt-1 text-[10px] text-slate-500">{result.description}</p><span className="mt-2 inline-block text-[8px] uppercase tracking-wider text-amber-200">External content · untrusted</span></article>)}</section></div>}

          {view === "team" && <TeamCollaboration/>}
        </section>
      </div>
    </main>
  );
}

function CrosshairIcon() { return <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[.07] text-cyan-200"><Workflow className="h-5 w-5"/></span>; }
