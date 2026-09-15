"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Cloud, Fingerprint, Globe2, KeyRound, Network, ShieldCheck, Workflow } from "lucide-react";

type NodeId = "internet" | "identity" | "cloud" | "api" | "agents" | "runtime";
type Node = { id: NodeId; label: string; detail: string; x: number; y: number; icon: typeof Globe2 };

const nodes: Node[] = [
  { id: "internet", label: "External surface", detail: "Inbound application and API exposure", x: 50, y: 12, icon: Globe2 },
  { id: "identity", label: "Identity", detail: "Human, service and workload principals", x: 19, y: 31, icon: Fingerprint },
  { id: "cloud", label: "Cloud", detail: "Connected infrastructure and services", x: 81, y: 31, icon: Cloud },
  { id: "api", label: "APIs / MCP", detail: "Tool and integration execution paths", x: 18, y: 70, icon: Network },
  { id: "agents", label: "AI agents", detail: "Agent identities, delegation and tools", x: 82, y: 70, icon: Bot },
  { id: "runtime", label: "Runtime", detail: "Execution boundary and verification", x: 50, y: 88, icon: Workflow },
];

const links: Array<[number, number, number, number]> = [
  [50, 12, 19, 31], [50, 12, 81, 31], [19, 31, 50, 50], [81, 31, 50, 50],
  [18, 70, 50, 50], [82, 70, 50, 50], [50, 50, 50, 88], [19, 31, 18, 70],
  [81, 31, 82, 70], [18, 70, 50, 88], [82, 70, 50, 88],
];

export function ThreatSurface() {
  const [active, setActive] = useState<NodeId>("agents");
  const [tick, setTick] = useState(0);
  const selected = useMemo(() => nodes.find((node) => node.id === active) ?? nodes[0], [active]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1100);
    return () => window.clearInterval(timer);
  }, []);

  const activeLink = tick % links.length;

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#060910] text-white shadow-[0_34px_100px_rgba(0,0,0,.38)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(54,211,255,.12),transparent_30%),radial-gradient(circle_at_16%_22%,rgba(91,101,255,.09),transparent_24%),radial-gradient(circle_at_84%_76%,rgba(45,212,191,.07),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.028)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.26em] text-cyan-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.7)]" />
              ELITZE security surface
            </div>
            <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight">Map the path before you authorize the action.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">A focused security graph for identities, applications, cloud resources, APIs, agents and runtime boundaries.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-right">
            <div className="text-[9px] uppercase tracking-[.18em] text-slate-500">Evidence state</div>
            <div className="mt-1 text-xs font-semibold text-slate-200">Observed / bounded</div>
          </div>
        </div>

        <div className="relative mx-auto mt-6 aspect-[1.05/1] max-w-[720px] select-none overflow-hidden rounded-[26px] border border-white/8 bg-[#04060a]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(69,92,255,.12),transparent_33%)]" />
          <div className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 shadow-[0_0_90px_rgba(59,130,246,.08)]" />
          <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />

          <svg className="absolute inset-[6%] h-[88%] w-[88%]" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <filter id="surface-edge-glow"><feGaussianBlur stdDeviation=".55" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <linearGradient id="surface-link" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="rgba(103,232,249,.05)"/><stop offset=".5" stopColor="rgba(148,163,184,.32)"/><stop offset="1" stopColor="rgba(129,140,248,.08)"/></linearGradient>
            </defs>
            {links.map(([x1, y1, x2, y2], index) => (
              <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={index === activeLink ? "rgba(103,232,249,.8)" : "url(#surface-link)"} strokeWidth={index === activeLink ? ".72" : ".32"} strokeDasharray={index === activeLink ? "1.2 1.5" : "2.5 2.5"} filter={index === activeLink ? "url(#surface-edge-glow)" : undefined}/>
            ))}
            <circle cx="50" cy="50" r="17" fill="rgba(103,232,249,.035)" stroke="rgba(103,232,249,.16)" strokeWidth=".45" />
            <circle cx="50" cy="50" r="7" fill="rgba(99,102,241,.22)" stroke="rgba(103,232,249,.48)" strokeWidth=".55" />
            <circle cx="50" cy="50" r="2" fill="#67e8f9" filter="url(#surface-edge-glow)" />
          </svg>

          {nodes.map((node) => {
            const Icon = node.icon;
            const isActive = node.id === active;
            return (
              <button key={node.id} type="button" onClick={() => setActive(node.id)} style={{ left: `${node.x}%`, top: `${node.y}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 text-left backdrop-blur-xl transition ${isActive ? "scale-105 border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_35px_rgba(103,232,249,.11)]" : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[.045]"}`}>
                <span className="flex items-center gap-2">
                  <span className={`grid h-8 w-8 place-items-center rounded-xl border ${isActive ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[.025] text-slate-300"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-semibold text-slate-100">{node.label}</span>
                    <span className="block max-w-[110px] text-[8px] uppercase tracking-[.10em] text-slate-500">security domain</span>
                  </span>
                </span>
              </button>
            );
          })}

          <div className="absolute left-1/2 top-1/2 w-48 -translate-x-1/2 -translate-y-1/2 text-center sm:w-56">
            <div className="text-[9px] font-semibold uppercase tracking-[.24em] text-cyan-200/75">ELITZE control plane</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{selected.label}</div>
            <div className="mt-2 text-[10px] leading-4 text-slate-500">{selected.detail}. Inspect the authorized relationship before crossing the execution boundary.</div>
          </div>

          <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[9px] uppercase tracking-[.13em] text-slate-500 backdrop-blur-xl">
            <span>select a domain · inspect relationship</span>
            <span>no synthetic telemetry</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            [ShieldCheck, "Authorize", "Evaluate identity, scope and policy before execution."],
            [KeyRound, "Enforce", "Keep sensitive tool and API actions inside a governed path."],
            [Workflow, "Verify", "Retest the path and preserve evidence of the outcome."],
          ].map(([Icon, title, description]) => {
            const ItemIcon = Icon as typeof ShieldCheck;
            return <div key={title as string} className="rounded-2xl border border-white/8 bg-white/[.025] p-4"><ItemIcon className="h-4 w-4 text-cyan-200" /><div className="mt-3 text-xs font-semibold">{title as string}</div><div className="mt-1 text-[10px] leading-4 text-slate-500">{description as string}</div></div>;
          })}
        </div>
      </div>
    </section>
  );
}
