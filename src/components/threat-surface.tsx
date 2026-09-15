"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Cloud, Crosshair, Database, Fingerprint, Globe2, LockKeyhole, Radio, ShieldAlert, Workflow } from "lucide-react";

type Node = { id: string; label: string; x: number; y: number; icon: typeof Globe2 };
const nodes: Node[] = [
  { id: "internet", label: "Internet", x: 50, y: 14, icon: Globe2 },
  { id: "identity", label: "Identity", x: 20, y: 34, icon: Fingerprint },
  { id: "cloud", label: "Cloud", x: 79, y: 33, icon: Cloud },
  { id: "runtime", label: "Runtime", x: 18, y: 70, icon: Radio },
  { id: "data", label: "Data", x: 81, y: 69, icon: Database },
  { id: "ai", label: "AI agents", x: 50, y: 86, icon: Workflow },
];
const links = [[50,14,20,34],[50,14,79,33],[20,34,50,50],[79,33,50,50],[18,70,50,50],[81,69,50,50],[50,50,50,86],[20,34,18,70],[79,33,81,69]];

export function ThreatSurface(){
  const [active,setActive]=useState("internet");
  const [tick,setTick]=useState(0);
  const selected=nodes.find((node)=>node.id===active) ?? nodes[0];
  useEffect(()=>{const timer=window.setInterval(()=>setTick(v=>v+1),900);return()=>window.clearInterval(timer);},[]);
  const pulse=useMemo(()=>tick%3,[tick]);
  return <div className="relative overflow-hidden rounded-[32px] border border-[var(--border-strong)] bg-[#05070c] shadow-[0_30px_110px_rgba(0,0,0,.48)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(239,68,68,.2),transparent_28%),radial-gradient(circle_at_16%_25%,rgba(59,130,246,.1),transparent_24%),radial-gradient(circle_at_82%_76%,rgba(52,211,153,.08),transparent_25%)]"/>
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:38px_38px] opacity-30"/>
    <div className="relative p-5 sm:p-7">
      <div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-red-300"><span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"/> Global threat surface</div><h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">See what is connected before it becomes a path.</h2></div><div className="hidden rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-right sm:block"><div className="text-[9px] uppercase tracking-[.18em] text-white/40">Mode</div><div className="text-xs font-semibold text-white/80">Explore</div></div></div>
      <div className="relative mx-auto mt-6 aspect-square max-w-[720px] select-none">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true"><defs><filter id="surfaceGlow"><feGaussianBlur stdDeviation=".65" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>{links.map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(248,250,252,.16)" strokeWidth=".35" strokeDasharray={i===pulse?"1 1":"2 2"}/>)}<circle cx="50" cy="50" r="19" fill="rgba(239,68,68,.05)" stroke="rgba(239,68,68,.28)" strokeWidth=".4" filter="url(#surfaceGlow)"/><circle cx="50" cy="50" r="11" fill="rgba(239,68,68,.09)" stroke="rgba(239,68,68,.4)" strokeWidth=".4"/><circle cx="50" cy="50" r="4" fill="#ef4444" filter="url(#surfaceGlow)"/></svg>
        {nodes.map((node,index)=>{const Icon=node.icon;const isActive=node.id===active;return <button key={node.id} type="button" onClick={()=>setActive(node.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-2.5 text-left transition duration-300 ${isActive?"scale-110 border-red-400/60 bg-red-500/15 shadow-[0_0_35px_rgba(239,68,68,.22)]":"border-white/10 bg-black/25 hover:border-white/25 hover:bg-white/[.06]"}`} style={{left:`${node.x}%`,top:`${node.y}%`}} aria-label={`Inspect ${node.label}`}><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white"><Icon className="h-4 w-4"/></span><span><span className="block text-[10px] font-bold text-white">{node.label}</span><span className="block text-[8px] uppercase tracking-[.12em] text-white/35">connected surface</span></span></div>{isActive&&<span className="absolute -inset-1 rounded-2xl border border-red-400/30 animate-pulse"/>}{index%2===0&&<span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]"/>}</button>})}
        <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 text-center sm:w-52"><div className="text-[9px] font-bold uppercase tracking-[.25em] text-red-300">Security graph</div><div className="mt-2 text-2xl font-black tracking-[-.03em] text-white">{selected.label}</div><div className="mt-2 text-[10px] leading-4 text-white/45">Inspect identity, reachability, runtime, data and agent relationships from one surface.</div></div>
      </div>
      <div className="grid gap-3 border-t border-white/8 pt-5 sm:grid-cols-3"><div className="flex gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-4"><Crosshair className="mt-0.5 h-4 w-4 text-red-300"/><div><div className="text-xs font-semibold text-white">Detect</div><div className="mt-1 text-[10px] leading-4 text-white/45">Bring observed signals into context.</div></div></div><div className="flex gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-4"><ShieldAlert className="mt-0.5 h-4 w-4 text-red-300"/><div><div className="text-xs font-semibold text-white">Decide</div><div className="mt-1 text-[10px] leading-4 text-white/45">Apply policy before an action crosses a boundary.</div></div></div><div className="flex gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-4"><LockKeyhole className="mt-0.5 h-4 w-4 text-red-300"/><div><div className="text-xs font-semibold text-white">Prove</div><div className="mt-1 text-[10px] leading-4 text-white/45">Retest and preserve the evidence.</div></div></div></div>
    </div>
  </div>;
}
