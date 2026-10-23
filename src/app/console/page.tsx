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
import SecurityBrainGraph from "@/components/security-brain-graph";

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
const quickLinks = [
  { href: "/console/analyst", label: "Autonomous analyst", description: "Investigate connected evidence and findings.", icon: Bot },
  { href: "/console/threat-detection", label: "Runtime threat detection", description: "Review observed signals and response evidence.", icon: Activity },
  { href: "/console/vulnerabilities", label: "Vulnerability intelligence", description: "Prioritize CVE, KEV and exposure findings.", icon: ShieldX },
  { href: "/console/adversary-emulation", label: "Adversary emulation", description: "Run authorized validation with scope controls.", icon: Workflow },
  { href: "/console/google-ads", label: "Google Ads governance", description: "Check truthful purchase and advertising controls before publication.", icon: ShieldCheck },
  { href: "/console/readiness", label: "Production readiness", description: "Check dependencies and proof gates.", icon: CheckCircle2 },
  { href: "/console/integrations", label: "Connected integrations", description: "Configure and verify security data sources.", icon: Database },
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
        fetch("/api/console/health", { cache: "no-store" }),
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

  const nodes = useMemo(() => graph?.nodes ?? [], [graph]);
  const edges = useMemo(() => graph?.edges ?? [], [graph]);
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

  if (authorized === null) return <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]"><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-[0_18px_50px_rgba(17,24,39,0.08)]"><div className="mx-auto size-10 animate-spin rounded-full border-2 border-cyan-300 border-r-transparent" /><p className="mt-4 text-sm text-slate-400">Checking secure access…</p></div></main>;

  const current = navigation.find((item) => item.id === view) ?? navigation[0];

  return (
    <main className="min-h-screen bg-[#070b10] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#070b10]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="ELITZE home"><span className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/[.08] text-cyan-200"><ShieldCheck className="h-4 w-4" /></span><div className="leading-none"><div className="text-sm font-black tracking-[.18em] text-white">ELITZE</div><div className="mt-1 text-[7px] uppercase tracking-[.22em] text-slate-500">Security operations</div></div></Link>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.025] px-3 py-2 md:flex"><span className={`h-1.5 w-1.5 rounded-full ${health?.ok ? "bg-cyan-300" : "bg-amber-300"}`} /><span className="text-[10px] uppercase tracking-[.16em] text-slate-400">{health?.ok ? "Tenant online" : "Awaiting signal"}</span></div>
          <div className="flex items-center gap-2"><Link href="/console/analyst" className="hidden rounded-lg border border-cyan-300/20 bg-cyan-300/[.06] px-3 py-2 text-[11px] font-semibold text-cyan-100 md:inline-flex">Open analyst</Link><button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.02] px-3 py-2 text-[11px] font-semibold text-slate-200"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />Refresh</button></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] gap-5 px-3 py-4 sm:px-5 lg:grid-cols-[228px_minmax(0,1fr)] lg:px-8 lg:py-7">
        <aside className="h-fit rounded-2xl border border-white/[.08] bg-[#0b1118] p-2 lg:sticky lg:top-[88px]">
          <div className="px-3 pb-3 pt-3"><div className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">Workspace</div><div className="mt-1 text-sm font-semibold">Security operations</div></div>
          <nav aria-label="Security workspace" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {navigation.map((item) => { const Icon = item.icon; const active = view === item.id; return <button key={item.id} type="button" onClick={() => setView(item.id)} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${active ? "border-cyan-300/30 bg-cyan-300/[.06]" : "border-white/[.06] bg-white/[.02] hover:border-white/[.08]"}`}><Icon className={`h-4 w-4 ${active ? "text-cyan-200" : "text-slate-400"}`} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-100">{item.label}</span><span className="mt-0.5 block text-[9px] text-slate-500">{item.hint}</span></span>{active && <span className="size-1.5 rounded-full bg-cyan-200" />}</button>; })}
          </nav>
          <div className="mt-3 border-t border-white/[.07] px-2 pb-2 pt-3"><div className="px-1 text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">Specialist consoles</div><nav aria-label="Specialist consoles" className="mt-2 grid gap-1">
            {[{ href: "/console/adversary-emulation", label: "Adversary emulation" }, { href: "/console/threat-detection", label: "Threat detection" }, { href: "/console/vulnerabilities", label: "Vulnerabilities" }, { href: "/console/readiness", label: "Readiness" }, { href: "/console/google-ads", label: "Google Ads governance" }].map(({ href, label }) => <Link key={href} href={href} className="rounded-xl border border-white/[.05] bg-white/[.02] px-3 py-2 text-[11px] text-slate-300 transition hover:border-cyan-300/20 hover:text-cyan-100">{label}</Link>)}
          </nav></div>
          <div className="mt-1 border-t border-white/[.07] p-3"><div className="flex items-center gap-2 text-[10px] text-slate-500"><Database className="h-3.5 w-3.5" /> Database <span className="ml-auto text-cyan-200">{health?.ok ? "Connected" : "Pending"}</span></div></div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[.23em] text-cyan-300">ELITZE / security operations</div><div className="mt-2 text-2xl font-semibold tracking-[-.04em]">{current.label}</div></div><div className="rounded-full border border-white/[.08] bg-white/[.02] px-2.5 py-1 text-[9px] uppercase tracking-[.2em] text-slate-500">{refreshing ? "Refreshing" : "Live"}</div></div>

          {!overview?.ok && <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-3 text-xs text-amber-100"><X className="mt-0.5 h-4 w-4 shrink-0" /><span>{overview?.error ? "Tenant data unavailable. Authentication and policy state may be incomplete." : "Tenant data unavailable."}</span></div>}

          {view === "overview" && <div className="space-y-4">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricsCards.map((card) => { const Icon = card.icon; const value = overview?.metrics?.[card.key]; return <article key={card.key} className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 transition hover:border-cyan-300/20"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-cyan-300" /><span className="text-[8px] font-bold uppercase tracking-[.16em] text-slate-600">Tenant data</span></div><div className="mt-5 font-mono text-3xl font-semibold tracking-tight">{typeof value === "number" ? value.toLocaleString() : "UNMEASURABLE"}</div><div className="mt-1 text-[10px] uppercase tracking-[.12em] text-slate-400">{card.label}</div></article>; })}</section>
            <section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[.18em] text-cyan-300">Security workspaces</div><h2 className="mt-2 text-lg font-semibold">Choose the control surface you need.</h2><p className="mt-1 text-[10px] text-slate-500">Each capability has its own focused workspace so operators can work without dashboard overload.</p></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[.14em] text-slate-500">7 focused pages</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{quickLinks.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="group rounded-xl border border-white/[.07] bg-white/[.02] p-3.5 transition hover:border-cyan-300/25 hover:bg-cyan-300/[.05]"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-cyan-300" /><ChevronRight className="h-3.5 w-3.5 text-slate-700 transition group-hover:text-cyan-200" /></div><div className="mt-4 text-xs font-semibold text-slate-200">{label}</div><p className="mt-1 text-[10px] leading-5 text-slate-500">{description}</p></Link>)}</div></section>
            <section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Control-plane activity</h2><p className="mt-1 text-[10px] text-slate-500">Values from the current authenticated tenant</p></div><button type="button" onClick={() => setView("evidence")} className="text-[10px] font-semibold text-cyan-200 hover:text-cyan-100">Inspect evidence →</button></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{label:"Gateway decisions",key:"gatewayDecisions" as const,icon:Activity},{label:"Denied",key:"deniedGatewayDecisions" as const,icon:ShieldX},{label:"Security tests",key:"securityTests" as const,icon:Workflow},{label:"Graph evidence",key:"graphEvidence" as const,icon:FileCheck2}].map((item) => { const Icon=item.icon; const value=overview?.metrics?.[item.key]; return <button type="button" key={item.key} onClick={() => setView(item.key === "securityTests" ? "validate" : item.key === "graphEvidence" ? "evidence" : "govern")} className="rounded-xl border border-white/[.07] bg-white/[.02] p-3 text-left hover:border-cyan-300/20"><Icon className="h-4 w-4 text-slate-400" /><div className="mt-3 font-mono text-xl font-semibold">{typeof value === "number" ? value.toLocaleString() : "—"}</div><div className="mt-1 text-[9px] text-slate-500">{item.label}</div></button>; })}</div></section>
            <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Observed security relationships</h2><p className="mt-1 text-[10px] text-slate-500">Select a record to inspect its source and evidence state</p></div><button type="button" onClick={() => setView("graph")} className="shrink-0 text-[10px] font-semibold text-cyan-200">Open graph →</button></div><div className="mt-4 space-y-2">{nodes.slice(0,4).map((node,index)=><button type="button" key={`${node.nodeType}:${node.displayName}:${index}`} onClick={()=>{setSelectedNode(node);setView("graph");}} className="flex w-full items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-left hover:border-cyan-300/20"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-300/[.07] text-cyan-200"><Network className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{node.displayName}</span><span className="mt-1 block truncate text-[9px] text-slate-500">{node.nodeType} · {node.evidenceState}</span></span><ChevronRight className="h-3.5 w-3.5 text-slate-600" /></button>)}{nodes.length===0&&<div className="rounded-xl border border-dashed border-white/10 p-5 text-xs text-slate-500">No observed graph nodes available.</div>}</div></div><div className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><h2 className="text-sm font-semibold">Data plane</h2><div className="mt-4 space-y-3">{[{label:"Database",value:health?.ok?"Reachable":health?.checks?.database??"Unavailable",ok:health?.ok===true},{label:"Schema",value:health?.checks?.schema??"UNKNOWN",ok:health?.checks?.schema==="ok"||health?.checks?.schema==="ready"},{label:"Security graph",value:graph?.ok?`${nodes.length} nodes · ${edges.length} edges`:"Unavailable",ok:graph?.ok===true},{label:"Synthetic telemetry",value:"Disabled",ok:true}].map((item)=><div key={item.label} className="flex items-center justify-between gap-3 border-b border-white/[.05] pb-3 text-[10px]"><span className="text-slate-500">{item.label}</span><span className={item.ok?"text-cyan-200":"text-amber-200"}>{item.value}</span></div>)}</div></div></section>
            <section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex items-center gap-2"><Search className="h-4 w-4 text-cyan-300"/><h2 className="text-sm font-semibold">Security intelligence search</h2></div><form onSubmit={runSearch} className="mt-3 flex gap-2"><input value={query} onChange={(e)=>setQuery(e.target.value)} maxLength={500} placeholder="Search public security intelligence" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs outline-none placeholder:text-slate-600 focus:border-cyan-300/40" /><button disabled={busy} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50">{busy?"Searching…":"Search"}</button></form>{searchError&&<p className="mt-3 text-xs text-rose-300">{searchError}</p>}{results.length>0&&<div className="mt-3 space-y-2">{results.map((result)=><article key={result.url} className="rounded-xl border border-white/[.07] p-3"><a href={result.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-cyan-100 hover:underline">{result.title}</a><p className="mt-1 text-[10px] text-slate-500">{result.description}</p><span className="mt-2 inline-block text-[8px] uppercase tracking-wider text-amber-200">External content · untrusted</span></article>)}</div>}</section>
          </div>}

          {view === "graph" && <div className="space-y-4"><SecurityBrainGraph /><section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Graph controls</h2><p className="mt-1 text-[10px] text-slate-500">Filter and inspect reachable relationships</p></div><div className="flex gap-2"><input value={graphFilter} onChange={(e)=>setGraphFilter(e.target.value)} placeholder="Filter graph" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] outline-none placeholder:text-slate-600 focus:border-cyan-300/40" /><button type="button" onClick={() => setGraphMode(graphMode === "nodes" ? "paths" : "nodes")} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-semibold text-cyan-200">{graphMode === "nodes" ? "Paths" : "Nodes"}</button></div></div><div className="mt-4 grid gap-3 md:grid-cols-2">{(graphMode === "nodes" ? filteredNodes : filteredNodes).slice(0,8).map((node, index) => <button type="button" key={`${node.nodeType}:${node.displayName}:${index}`} onClick={() => setSelectedNode(node)} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-left hover:border-cyan-300/20"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-200">{node.displayName}</span><span className="text-[9px] uppercase tracking-[.12em] text-slate-500">{node.nodeType}</span></div><div className="mt-2 text-[10px] text-slate-500">Evidence: {node.evidenceState}</div></button>)}</div>{filteredNodes.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-xs text-slate-500">No graph nodes match the current filter.</div>}</section></div>}

          {view === "validate" && <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-2"><Link href="/console/pentesting" className="group rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 transition hover:border-cyan-300/20"><div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-300">Testing</span><ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-200" /></div><div className="mt-4 text-base font-semibold">Pentesting</div><p className="mt-1 text-[10px] text-slate-500">Validate the effectiveness of security controls under realistic conditions.</p></Link><Link href="/console/google-ads" className="group rounded-2xl border border-white/[.08] bg-[#0b1118] p-4 transition hover:border-cyan-300/20"><div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-300">Governance</span><ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-200" /></div><div className="mt-4 text-base font-semibold">Google Ads governance</div><p className="mt-1 text-[10px] text-slate-500">Review truthful publication and targeting controls before campaign activation.</p></Link></section></div>}

          {view === "govern" && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3">{[{label:"Gateway decisions",value:overview?.metrics?.gatewayDecisions},{label:"Denied",value:overview?.metrics?.deniedGatewayDecisions},{label:"Approval requests",value:overview?.metrics?.approvalRequests}].map((item) => <div key={item.label} className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4"><div className="text-[9px] uppercase tracking-[.18em] text-slate-500">{item.label}</div><div className="mt-4 font-mono text-3xl font-semibold">{typeof item.value === "number" ? item.value.toLocaleString() : "—"}</div></div>)}</div><div className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4"><h2 className="text-sm font-semibold">Access and policy review</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{["/console/skills","/console/google-ads","/console/roi","/security"].map((href) => <Link key={href} href={href} className="rounded-xl border border-white/[.05] bg-white/[.02] px-3 py-3 text-sm text-slate-200 hover:border-cyan-300/20">{href.replace("/","")}</Link>)}</div></div></div>}

          {view === "evidence" && <div className="space-y-4"><section className="grid gap-3 sm:grid-cols-3">{[{label:"Graph evidence",value:overview?.metrics?.graphEvidence},{label:"Evidence records",value:overview?.metrics?.evidenceRecords},{label:"Latest evidence",value:overview?.metrics?.latestEvidenceAt ? new Date(overview.metrics.latestEvidenceAt).toLocaleString() : "Unavailable"}].map((item) => <div key={item.label} className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4"><div className="text-[9px] uppercase tracking-[.18em] text-slate-500">{item.label}</div><div className="mt-4 text-sm font-medium text-slate-100">{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</div></div>)}</section><EvidenceExpressionDebugger /></div>}

          {view === "analyst" && <div className="space-y-4"><GovernedChat /><SmartChatHierarchy /><section className="rounded-2xl border border-white/[.08] bg-[#0b1118] p-4"><h2 className="text-sm font-semibold">Analyst workflow</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[.05] bg-white/[.02] p-3 text-[10px] text-slate-400">Session guardrails remain enforced before any tool or network action is permitted.</div><div className="rounded-xl border border-white/[.05] bg-white/[.02] p-3 text-[10px] text-slate-400">Evidence and policy provenance are surfaced when decisions are made.</div></div></section></div>}

          {view === "team" && <TeamCollaboration/>}
        </section>
      </div>
    </main>
  );
}

function CrosshairIcon() { return <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[.07] text-cyan-200"><Workflow className="h-5 w-5"/></span>; }
