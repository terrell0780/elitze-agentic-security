"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowDownToLine, ArrowUpRight, Network, RefreshCw, ShieldAlert } from "lucide-react";

type GraphNode = {
  id: string;
  nodeType: string;
  subjectKey: string;
  displayName: string;
  evidenceState: string;
  source: string;
  observedAt: string | null;
};
type GraphEdge = {
  id: string;
  relation: string;
  accessMode?: string | null;
  policyEffect?: string | null;
  evidenceState: string;
  source: string;
  from: string;
  to: string;
};
type GraphPayload = { ok: boolean; nodes?: GraphNode[]; edges?: GraphEdge[]; source?: string; error?: string };
type PositionedNode = GraphNode & { x: number; y: number };

function positionNodes(nodes: GraphNode[]): PositionedNode[] {
  const count = nodes.length;
  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / Math.max(count, 1) - Math.PI / 2;
    const ring = count > 16 ? 0.28 + (index % 3) * 0.17 : 0.68;
    return { ...node, x: 500 + Math.cos(angle) * 390 * ring, y: 270 + Math.sin(angle) * 205 * ring };
  });
}

export default function SecurityBrainGraph() {
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/console/security-graph", { cache: "no-store" });
      const result = (await response.json()) as GraphPayload;
      if (!response.ok || !result.ok) {
        setPayload({ ok: false, error: result.error ?? `http_${response.status}` });
        return;
      }
      setPayload(result);
      setSelected((current) => current && result.nodes?.some((node) => node.subjectKey === current) ? current : result.nodes?.[0]?.subjectKey ?? null);
    } catch {
      setPayload({ ok: false, error: "security_graph_unavailable" });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const nodes = useMemo(() => positionNodes((payload?.nodes ?? []).filter((node) => filter === "ALL" || node.nodeType.toUpperCase() === filter)), [payload?.nodes, filter]);
  const visibleKeys = useMemo(() => new Set(nodes.map((node) => node.subjectKey)), [nodes]);
  const edges = useMemo(() => (payload?.edges ?? []).filter((edge) => visibleKeys.has(edge.from) && visibleKeys.has(edge.to)), [payload?.edges, visibleKeys]);
  const selectedNode = (payload?.nodes ?? []).find((node) => node.subjectKey === selected) ?? null;
  const nodeTypes = useMemo(() => [...new Set((payload?.nodes ?? []).map((node) => node.nodeType.toUpperCase()))].sort(), [payload?.nodes]);
  const pointByKey = useMemo(() => new Map(nodes.map((node) => [node.subjectKey, node])), [nodes]);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#070910] p-4 text-white shadow-[0_28px_90px_rgba(0,0,0,.32)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(34,211,238,.10),transparent_50%)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-cyan-200"><Network className="h-3.5 w-3.5" /> ELITZE / SECURITY BRAIN</div><h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Observed security graph</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">Tenant-scoped nodes and relationships read from the authenticated graph API. Layout coordinates are visual only; graph content is not synthesized.</p></div>
        <div className="flex flex-wrap gap-2"><a href="/api/console/evidence-snapshot" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-300/30"><ArrowDownToLine className="h-3.5 w-3.5" /> Export evidence</a><Link href="/console/analyst" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-300/30">Analyst <ArrowUpRight className="h-3.5 w-3.5" /></Link><Link href="/console/vulnerabilities" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-300/30">Exposure <ArrowUpRight className="h-3.5 w-3.5" /></Link><Link href="/console/pentesting" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/15">Open live scans <ArrowUpRight className="h-3.5 w-3.5" /></Link><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-300/30 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /> Refresh graph</button></div>
      </div>
      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setFilter("ALL")} className={`rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider ${filter === "ALL" ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-slate-500"}`}>All types</button>
        {nodeTypes.map((type) => <button key={type} type="button" onClick={() => setFilter(type)} className={`rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider ${filter === type ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-slate-500"}`}>{type}</button>)}
        <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-500">{payload?.ok ? `${nodes.length} nodes · ${edges.length} relationships` : "Graph status unknown"}</span>
      </div>
      {!payload && <div className="relative mt-4 grid min-h-72 place-items-center rounded-2xl border border-white/10 bg-black/20 text-xs text-slate-500">Loading tenant graph…</div>}
      {payload && !payload.ok && <div className="relative mt-4 flex min-h-56 items-center gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-5 text-sm text-amber-100"><ShieldAlert className="h-5 w-5 shrink-0" /><div><div className="font-semibold">Graph data unavailable</div><div className="mt-1 text-xs text-amber-100/60">{payload.error ?? "UNAVAILABLE"}. No substitute or sample graph is displayed.</div></div></div>}
      {payload?.ok && nodes.length === 0 && <div className="relative mt-4 grid min-h-56 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center"><div><Network className="mx-auto h-6 w-6 text-slate-600" /><div className="mt-3 text-sm font-semibold text-slate-300">No observed nodes for this filter</div><p className="mt-1 text-xs text-slate-500">This view only displays records that exist in the current tenant graph.</p></div></div>}
      {payload?.ok && nodes.length > 0 && <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#05070d]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:28px_28px]" />
        <svg viewBox="0 0 1000 540" role="img" aria-label={`Observed tenant security graph with ${nodes.length} nodes and ${edges.length} relationships`} className="relative block h-auto max-h-[600px] min-h-[300px] w-full">
          <defs><linearGradient id="brain-edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#67e8f9" stopOpacity=".75" /><stop offset="100%" stopColor="#67e8f9" stopOpacity=".24" /></linearGradient><filter id="brain-glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          {edges.map((edge) => { const from = pointByKey.get(edge.from); const to = pointByKey.get(edge.to); if (!from || !to) return null; return <g key={edge.id}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="url(#brain-edge)" strokeWidth={edge.policyEffect?.toUpperCase() === "DENY" ? 2.2 : 1.1} strokeDasharray={edge.evidenceState?.toUpperCase().includes("UNKNOWN") ? "4 5" : undefined} opacity={selected && (edge.from === selected || edge.to === selected) ? 1 : .48} /><title>{`${edge.relation}: ${edge.from} → ${edge.to} | ${edge.evidenceState}`}</title></g>; })}
          {nodes.map((node) => { const active = selected === node.subjectKey; const denied = (payload.edges ?? []).some((edge) => (edge.from === node.subjectKey || edge.to === node.subjectKey) && edge.policyEffect?.toUpperCase() === "DENY"); return <g key={node.id} role="button" tabIndex={0} aria-label={`Select ${node.displayName}`} onClick={() => setSelected(node.subjectKey)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(node.subjectKey); } }} className="cursor-pointer outline-none"><circle cx={node.x} cy={node.y} r={active ? 15 : 10} fill={denied ? "#fb7185" : active ? "#67e8f9" : "#0891b2"} fillOpacity={active ? .95 : .72} stroke={active ? "#cffafe" : denied ? "#fda4af" : "#67e8f9"} strokeWidth={active ? 2.5 : 1.2} filter={active ? "url(#brain-glow)" : undefined} /><circle cx={node.x} cy={node.y} r={active ? 23 : 16} fill="none" stroke={active ? "#67e8f9" : "#0891b2"} strokeOpacity={active ? .55 : .22} /><text x={node.x} y={node.y + 31} textAnchor="middle" fill={active ? "#ecfeff" : "#a1a1aa"} fontSize="11" fontWeight={active ? 700 : 500}>{node.displayName.length > 22 ? `${node.displayName.slice(0, 20)}…` : node.displayName}</text><title>{`${node.displayName} · ${node.nodeType} · ${node.evidenceState}`}</title></g>; })}
        </svg>
      </div>}
      <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-slate-500"><Activity className="h-3.5 w-3.5" /> Nodes</div><div className="mt-2 font-mono text-xl">{payload?.ok ? (payload.nodes?.length ?? 0) : "UNMEASURABLE"}</div></div>
        <div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="text-[9px] uppercase tracking-wider text-slate-500">Relationships</div><div className="mt-2 font-mono text-xl">{payload?.ok ? (payload.edges?.length ?? 0) : "UNMEASURABLE"}</div></div>
        <div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="text-[9px] uppercase tracking-wider text-slate-500">Selected node</div><div className="mt-2 truncate text-sm font-semibold">{selectedNode?.displayName ?? "None"}</div><div className="mt-1 text-[9px] text-slate-500">{selectedNode?.evidenceState ?? "No node selected"}</div></div>
      </div>
      {selectedNode && <div className="relative mt-3 grid gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[.04] p-4 sm:grid-cols-2"><div><div className="text-[9px] uppercase tracking-wider text-cyan-200/70">Node details</div><div className="mt-2 break-all text-sm font-semibold">{selectedNode.displayName}</div><div className="mt-1 break-all text-[10px] text-slate-400">{selectedNode.subjectKey}</div></div><div className="space-y-1 text-[10px] text-slate-400"><div>Type: <span className="text-slate-200">{selectedNode.nodeType}</span></div><div>Source: <span className="text-slate-200">{selectedNode.source}</span></div><div>Evidence: <span className="text-slate-200">{selectedNode.evidenceState}</span></div><div>Observed: <span className="text-slate-200">{selectedNode.observedAt ? new Date(selectedNode.observedAt).toLocaleString() : "Not recorded"}</span></div></div></div>}
      <p className="relative mt-4 text-[9px] leading-4 text-slate-500">Source: {payload?.source ?? "authenticated ELITZE graph API"}. Node positions are a layout only; relationships and labels come from stored tenant records. Red nodes indicate an observed DENY relationship, not a vulnerability verdict.</p>
    </section>
  );
}
