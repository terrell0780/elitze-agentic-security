"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Database, Fingerprint, Layers3, Maximize2, RotateCcw, ShieldCheck } from "lucide-react";

type DomainId = "agents" | "identity" | "mcp" | "github" | "aws" | "data";
type LayerId = "graph" | "reach" | "policy" | "evidence";
type Market = { ok: boolean; stats?: { agents?: number; pendingApprovals?: number } };

const domains = [
  ["agents", "AGENTS", 50, 25, Activity], ["identity", "IDENTITY", 79, 43, Fingerprint],
  ["mcp", "MCP", 69, 73, Layers3], ["github", "GITHUB", 31, 73, ShieldCheck],
  ["aws", "AWS", 21, 43, Database], ["data", "DATA", 50, 82, Layers3],
] as const;
const layers: Array<[LayerId,string,string]> = [
  ["graph", "GRAPH", "Observed identity, tool and resource relationships."],
  ["reach", "REACH", "Observed paths an authorized workload can traverse."],
  ["policy", "POLICY", "Deterministic enforcement decisions and interruption points."],
  ["evidence", "EVIDENCE", "Signed decisions, provenance and verification state."],
];

export default function GodsEyeGlobe() {
  const [active, setActive] = useState<DomainId>("agents");
  const [layer, setLayer] = useState<LayerId>("graph");
  const [rotation, setRotation] = useState(-7);
  const [scale, setScale] = useState(1);
  const [market, setMarket] = useState<Market | null>(null);
  const drag = useRef<{x:number;r:number}|null>(null);
  const activeDomain = useMemo(() => domains.find((d) => d[0] === active) ?? domains[0], [active]);
  const activeLayer = useMemo(() => layers.find((l) => l[0] === layer) ?? layers[0], [layer]);

  useEffect(() => {
    let live = true;
    const load = async () => { try { const r = await fetch("/api/market", {cache:"no-store"}); const p = await r.json() as Market; if(live) setMarket(p); } catch { if(live) setMarket({ok:false}); } };
    void load(); const t = window.setInterval(load, 15000); return () => { live=false; window.clearInterval(t); };
  }, []);

  const reset = () => { setRotation(-7); setScale(1); setActive("agents"); setLayer("graph"); };

  return <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#07090d] p-4 text-white shadow-[0_40px_120px_rgba(0,0,0,.42)] sm:p-6 lg:p-8">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(75,125,255,.12),transparent_34%),radial-gradient(circle_at_22%_12%,rgba(255,255,255,.05),transparent_28%)]" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

    <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
      <div><div className="text-[10px] font-semibold uppercase tracking-[.28em] text-cyan-300/80">ELITZE // CONTROL PLANE</div><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Global Security View</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">2026 spatial security interface for real identity, reachability, policy enforcement and signed evidence.</p></div>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${market?.ok ? "bg-cyan-300" : "bg-amber-300"}`} />{market?.ok ? "LIVE DATA" : "UNAVAILABLE"}</div>
    </div>

    <div className="relative z-10 mt-6 flex flex-wrap gap-2">{layers.map(([id,label]) => <button key={id} onClick={() => setLayer(id)} type="button" className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] transition ${layer===id ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200" : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-200"}`}>{label}</button>)}</div>

    <div className="relative z-10 mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-[#05070a] cursor-grab active:cursor-grabbing"
        onPointerDown={(e)=>{drag.current={x:e.clientX,r:rotation};}}
        onPointerMove={(e)=>{if(drag.current)setRotation(Math.max(-24,Math.min(24,drag.current.r+(e.clientX-drag.current.x)*.09)));}}
        onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}
        onWheel={(e)=>setScale(v=>Math.max(.82,Math.min(1.24,v-e.deltaY*.00045)))}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(54,112,255,.08),transparent_38%)]" />
        <div className="absolute left-4 top-4 z-20 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl"><div className="text-[9px] uppercase tracking-[.22em] text-slate-500">CURRENT FOCUS</div><div className="mt-1 text-xs font-semibold">{activeDomain[1]}</div><div className="mt-1 text-[10px] text-slate-500">{activeLayer[2]}</div></div>
        <div className="absolute right-4 top-4 z-20 flex gap-2"><button onPointerDown={e=>e.stopPropagation()} onClick={()=>setScale(v=>Math.min(1.24,v+.08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px]">+</button><button onPointerDown={e=>e.stopPropagation()} onClick={()=>setScale(v=>Math.max(.82,v-.08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px]">−</button><button onPointerDown={e=>e.stopPropagation()} onClick={reset} className="rounded-full border border-white/10 bg-black/45 p-2" aria-label="Reset view"><RotateCcw className="h-3.5 w-3.5" /></button><button onPointerDown={e=>e.stopPropagation()} className="rounded-full border border-white/10 bg-black/45 p-2" aria-label="Expand view"><Maximize2 className="h-3.5 w-3.5" /></button></div>

        <div className="absolute inset-0 flex items-center justify-center"><div className="relative h-[380px] w-[380px]" style={{transform:`perspective(1100px) rotateY(${rotation}deg) scale(${scale})`}}>
          <div className="absolute inset-[10%] rounded-full border border-cyan-300/15 shadow-[0_0_90px_rgba(52,211,255,.08)]" /><div className="absolute inset-[18%] rounded-full border border-white/8 bg-[radial-gradient(circle_at_35%_32%,rgba(58,115,255,.26),rgba(7,14,26,.8)_52%,rgba(1,4,10,.98)_80%)] shadow-[inset_-25px_-20px_70px_rgba(0,0,0,.65),0_0_55px_rgba(59,130,246,.12)]" /><div className="absolute inset-[9%] animate-[spin_20s_linear_infinite] rounded-full border border-dashed border-white/8" /><div className="absolute inset-[4%] animate-[spin_31s_linear_infinite_reverse] rounded-full border border-dashed border-cyan-300/10" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full"><defs><filter id="g"><feGaussianBlur stdDeviation="1.7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M50 25 C67 31 78 43 69 73 C60 88 40 88 31 73 C22 54 23 34 50 25" fill="none" stroke="rgba(83,195,255,.2)" strokeWidth=".45" />{domains.map(d=><g key={d[0]}><line x1="50" y1="51" x2={d[2]} y2={d[3]} stroke={active===d[0]?"rgba(103,232,249,.55)":"rgba(148,163,184,.14)"} strokeWidth={active===d[0]?".6":".35"} /><circle cx={d[2]} cy={d[3]} r={active===d[0]?2.9:2.1} fill={active===d[0]?"#67e8f9":"#94a3b8"} opacity={active===d[0]?.95:.55} /></g>)}</svg>
          <button type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>setActive("agents")} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/40 bg-cyan-300/10 px-5 py-4 text-center shadow-[0_0_40px_rgba(103,232,249,.15)] backdrop-blur-xl"><div className="text-[9px] font-bold uppercase tracking-[.22em] text-cyan-200">ELITZE</div><div className="mt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">CONTROL PLANE</div></button>
          {domains.map(d=>{const Icon=d[4];return <button key={d[0]} type="button" onPointerDown={e=>e.stopPropagation()} onClick={()=>setActive(d[0])} style={{left:`${d[2]}%`,top:`${d[3]}%`}} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 backdrop-blur-xl ${active===d[0]?"border-cyan-200/45 bg-cyan-200/10 text-cyan-100":"border-white/10 bg-black/30 text-slate-400 hover:border-white/20 hover:text-white"}`}><span className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[.12em]"><Icon className="h-3 w-3" />{d[1]}</span></button>})}
        </div></div>
        <div className="absolute inset-x-4 bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[9px] uppercase tracking-[.16em] text-slate-500 backdrop-blur-xl"><span>DRAG · WHEEL · SELECT DOMAIN</span><span>EVIDENCE: {market?.ok ? "OBSERVED RECORDS" : "UNAVAILABLE"}</span></div>
      </div>

      <aside className="rounded-[28px] border border-white/10 bg-white/[.025] p-5"><div className="text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">2026 SYSTEM STATUS</div><div className="mt-4 grid gap-3"><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.16em] text-slate-600">Agents observed</div><div className="mt-2 font-mono text-xl">{market?.ok && market.stats?.agents !== undefined ? market.stats.agents : "UNKNOWN"}</div></div><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.16em] text-slate-600">Approval queue</div><div className="mt-2 font-mono text-xl">{market?.ok && market.stats?.pendingApprovals !== undefined ? market.stats.pendingApprovals : "UNKNOWN"}</div></div><div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.16em] text-slate-600">Graph reachability</div><div className="mt-2 font-mono text-xl">UNMEASURABLE</div></div></div><div className="mt-6 border-t border-white/8 pt-5"><div className="text-[9px] font-semibold uppercase tracking-[.2em] text-cyan-200/70">CURRENT FOCUS</div><div className="mt-2 text-base font-semibold">{activeDomain[1]}</div><div className="mt-1 text-xs leading-5 text-slate-500">{activeLayer[2]}</div></div><div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4 text-[10px] leading-5 text-slate-500">No synthetic telemetry. Missing connector evidence remains unavailable, unknown or unmeasurable.</div></aside>
    </div>
  </section>;
}
