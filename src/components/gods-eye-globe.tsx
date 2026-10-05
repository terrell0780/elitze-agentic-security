"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Boxes,
  Fingerprint,
  Layers3,
  Network,
  RotateCcw,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";

type DomainId = "agents" | "identity" | "mcp" | "cloud" | "apis" | "data";
type LayerId = "graph" | "reach" | "policy" | "runtime" | "evidence";
type Overview = {
  ok: boolean;
  metrics?: {
    agentIdentities: number;
    pendingApprovals: number;
    graphNodes: number;
    securityTests: number;
  };
};

const domains: Array<[DomainId, string, number, number, typeof Activity]> = [
  ["agents", "AGENTS", 50, 18, Activity],
  ["identity", "IDENTITY", 78, 36, Fingerprint],
  ["mcp", "MCP / TOOLS", 72, 67, Layers3],
  ["cloud", "CLOUD", 29, 69, Boxes],
  ["apis", "APIs", 22, 39, Network],
  ["data", "DATA", 50, 84, ShieldCheck],
];

const layers: Array<[LayerId, string, string]> = [
  ["graph", "SECURITY GRAPH", "Observed relationships between identities, agents, tools and resources."],
  ["reach", "AGENT REACH", "Authorized paths an agent can traverse across connected surfaces."],
  ["policy", "POLICY", "Explicit allow, deny, approval and constrained execution decisions."],
  ["runtime", "RUNTIME", "Execution-boundary checks before sensitive actions cross the control plane."],
  ["evidence", "EVIDENCE", "Decision context, provenance, verification state and audit records."],
];

export default function GodsEyeGlobe() {
  const [active, setActive] = useState<DomainId>("agents");
  const [layer, setLayer] = useState<LayerId>("graph");
  const [rotation, setRotation] = useState(-8);
  const [tilt, setTilt] = useState(-10);
  const [scale, setScale] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);
  const drag = useRef<{ x: number; y: number; rotation: number; tilt: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch("/api/console/overview", { cache: "no-store" });
        const payload = (await response.json()) as Overview;
        if (mounted) setOverview(payload);
      } catch {
        if (mounted) setOverview({ ok: false });
      }
    };
    void load();
    const timer = window.setInterval(load, 15000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const reset = () => {
    setActive("agents");
    setLayer("graph");
    setRotation(-8);
    setTilt(-10);
    setScale(1);
  };

  const activeDomain = useMemo(
    () => domains.find((entry) => entry[0] === active) ?? domains[0],
    [active],
  );
  const activeLayer = layers.find((entry) => entry[0] === layer) ?? layers[0];

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#03060b] p-4 text-white shadow-[0_50px_140px_rgba(0,0,0,.52)] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,.10),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(167,139,250,.10),transparent_25%),radial-gradient(circle_at_18%_82%,rgba(244,114,182,.07),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.28em] text-cyan-200/75">ELITZE // GLOBAL SECURITY VIEW</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">See the security surface in 3D.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Explore observed security domains and control layers as a spatial command surface. Protected tenant telemetry stays source-bound.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">
          <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${overview?.ok ? "bg-cyan-300" : "bg-amber-300"}`} />
          {overview?.ok ? "SOURCE CONNECTED" : "DATA UNAVAILABLE"}
        </div>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap gap-2">
        {layers.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLayer(id)}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] transition ${layer === id ? "border-cyan-300/45 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(103,232,249,.07)]" : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative z-10 mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div
          className="relative min-h-[590px] overflow-hidden rounded-[28px] border border-white/10 bg-[#02040a] cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => {
            drag.current = { x: event.clientX, y: event.clientY, rotation, tilt };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            setRotation(Math.max(-42, Math.min(42, drag.current.rotation + (event.clientX - drag.current.x) * 0.12)));
            setTilt(Math.max(-28, Math.min(24, drag.current.tilt - (event.clientY - drag.current.y) * 0.08)));
          }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onWheel={(event) => setScale((value) => Math.max(.78, Math.min(1.30, value - event.deltaY * .00035)))}
        >
          <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(73,107,255,.13),transparent_38%)]" />
          <div className="absolute left-[10%] top-[13%] h-40 w-40 rounded-full bg-cyan-300/[.05] blur-3xl animate-[float-soft_8s_ease-in-out_infinite]" />
          <div className="absolute right-[8%] bottom-[10%] h-44 w-44 rounded-full bg-fuchsia-300/[.05] blur-3xl animate-[float-soft_9s_ease-in-out_infinite_reverse]" />

          <div className="absolute left-4 top-4 z-30 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl">
            <div className="text-[9px] uppercase tracking-[.22em] text-slate-500">CURRENT FOCUS</div>
            <div className="mt-1 text-xs font-semibold text-slate-100">{activeDomain[1]}</div>
            <div className="mt-1 max-w-[190px] text-[10px] leading-4 text-slate-500">{activeLayer[2]}</div>
          </div>

          <div className="absolute right-4 top-4 z-30 flex gap-2">
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setScale((value) => Math.min(1.30, value + .08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px] hover:border-cyan-300/30">+</button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setScale((value) => Math.max(.78, value - .08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px] hover:border-cyan-300/30">−</button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={reset} className="rounded-full border border-white/10 bg-black/45 p-2 hover:border-cyan-300/30" aria-label="Reset global security view"><RotateCcw className="h-3.5 w-3.5" /></button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center [perspective:1200px]">
            <div
              className="relative h-[420px] w-[420px] [transform-style:preserve-3d]"
              style={{ transform: `rotateX(${tilt}deg) rotateY(${rotation}deg) scale(${scale})` }}
            >
              <div className="absolute inset-[3%] rounded-full border border-cyan-200/10 shadow-[0_0_110px_rgba(56,189,248,.10)]" />
              <div className="absolute inset-[8%] rounded-full border border-dashed border-cyan-200/12 animate-[spin_28s_linear_infinite]" />
              <div className="absolute inset-[12%] rounded-full border border-dashed border-violet-300/10 animate-[spin_40s_linear_infinite_reverse]" />

              <div className="absolute inset-[16%] rounded-full border border-white/10 bg-[radial-gradient(circle_at_28%_24%,rgba(103,232,249,.30),rgba(94,73,244,.20)_35%,rgba(4,10,22,.90)_58%,rgba(0,2,6,.99)_83%)] shadow-[inset_-40px_-28px_85px_rgba(0,0,0,.82),inset_18px_15px_50px_rgba(103,232,249,.08),0_0_100px_rgba(45,92,210,.20)] [transform-style:preserve-3d]" />
              <div className="absolute inset-[20%] rounded-full border border-cyan-200/10 shadow-[inset_22px_16px_40px_rgba(103,232,249,.06),inset_-28px_-20px_60px_rgba(0,0,0,.5)]" />

              {[-20, -12, -5, 4, 13, 21].map((angle) => (
                <div
                  key={angle}
                  className="absolute inset-[17%] rounded-full border border-white/[.06]"
                  style={{ transform: `rotateZ(${angle}deg) rotateY(66deg)` }}
                />
              ))}
              {[-26, -14, 0, 14, 26].map((angle) => (
                <div
                  key={`lat-${angle}`}
                  className="absolute inset-[17%] rounded-full border border-cyan-200/[.06]"
                  style={{ transform: `rotateX(${angle}deg)` }}
                />
              ))}

              <div className="absolute left-[16%] top-[38%] h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,.95)] animate-pulse" />
              <div className="absolute right-[25%] top-[25%] h-1.5 w-1.5 rounded-full bg-fuchsia-200 shadow-[0_0_16px_rgba(244,114,182,.90)] animate-pulse" />
              <div className="absolute left-[31%] bottom-[22%] h-1.5 w-1.5 rounded-full bg-violet-200 shadow-[0_0_16px_rgba(167,139,250,.90)] animate-pulse" />

              <svg viewBox="0 0 100 100" className="absolute inset-[11%] h-[78%] w-[78%] overflow-visible [transform-style:preserve-3d]" aria-hidden="true">
                <defs>
                  <linearGradient id="global-trail" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity=".1" />
                    <stop offset="48%" stopColor="#67e8f9" stopOpacity=".8" />
                    <stop offset="100%" stopColor="#c4b5fd" stopOpacity=".2" />
                  </linearGradient>
                </defs>
                <ellipse cx="50" cy="50" rx="40" ry="18" fill="none" stroke="url(#global-trail)" strokeWidth=".55" strokeDasharray="1.2 2.8" className="animate-[signal_3.6s_ease-out_infinite]" />
                <ellipse cx="50" cy="50" rx="34" ry="44" fill="none" stroke="rgba(103,232,249,.22)" strokeWidth=".35" transform="rotate(22 50 50)" />
                {domains.map(([id, , x, y]) => (
                  <g key={id}>
                    <line x1="50" y1="50" x2={x} y2={y} stroke={active === id ? "rgba(103,232,249,.78)" : "rgba(148,163,184,.16)"} strokeWidth={active === id ? ".7" : ".3"} strokeDasharray="1 1.5" />
                    <circle cx={x} cy={y} r={active === id ? 2.8 : 1.65} fill={active === id ? "#67e8f9" : "#a5b4fc"} opacity={active === id ? .95 : .48} />
                  </g>
                ))}
              </svg>

              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/25 bg-cyan-200/[.05] px-7 py-5 text-center shadow-[0_0_70px_rgba(103,232,249,.14)] backdrop-blur-xl">
                <div className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-100">ELITZE</div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">GLOBAL CONTROL</div>
              </div>

              {domains.map(([id, label, x, y, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setActive(id)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 backdrop-blur-xl transition-all ${active === id ? "border-cyan-100/50 bg-cyan-200/[.11] text-cyan-50 shadow-[0_0_28px_rgba(103,232,249,.13)] scale-105" : "border-white/10 bg-black/38 text-slate-500 hover:border-white/20 hover:text-slate-100"}`}
                >
                  <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[.10em]"><Icon className="h-3 w-3" />{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-4 z-30 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-[9px] uppercase tracking-[.13em] text-slate-500 backdrop-blur-xl">
            <span>drag · wheel · select domain</span>
            <span>{overview?.ok ? "observed tenant state" : "protected data withheld"}</span>
          </div>
        </div>

        <aside className="rounded-[28px] border border-white/10 bg-white/[.025] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">CONTROL STATUS</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.16em] text-slate-600">Agent identities</div><div className="mt-2 font-mono text-xl">{overview?.ok && overview.metrics?.agentIdentities !== undefined ? overview.metrics.agentIdentities : "UNMEASURABLE"}</div></div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.16em] text-slate-600">Approval queue</div><div className="mt-2 font-mono text-xl">{overview?.ok && overview.metrics?.pendingApprovals !== undefined ? overview.metrics.pendingApprovals : "UNKNOWN"}</div></div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="flex items-center gap-2 text-[9px] uppercase tracking-[.16em] text-slate-600"><TerminalSquare className="h-3.5 w-3.5" /> Runtime gate</div><div className="mt-2 font-mono text-xl">POLICY BOUND</div></div>
          </div>
          <div className="mt-6 border-t border-white/8 pt-5"><div className="text-[9px] font-semibold uppercase tracking-[.2em] text-cyan-200/70">SELECTED DOMAIN</div><div className="mt-2 text-base font-semibold">{activeDomain[1]}</div><div className="mt-1 text-xs leading-5 text-slate-500">{activeDomain[0] === "agents" ? "Agent identities, tools, delegation and runtime access." : activeLayer[2]}</div></div>
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4 text-[10px] leading-5 text-slate-500">Evidence remains bounded to connected sources. Unknown and unmeasurable states are surfaced rather than replaced with synthetic telemetry.</div>
        </aside>
      </div>
    </section>
  );
}
