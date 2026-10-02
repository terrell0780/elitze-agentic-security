"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Boxes, Clock3, Fingerprint, Layers3, Network, RotateCcw, ShieldCheck, TerminalSquare } from "lucide-react";

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

type Snapshot = {
  id: string;
  snapshotDate: string;
  generatedAt: string;
  evidenceState: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  contentHash: string;
  previousHash: string | null;
  state?: {
    counts?: Record<string, number>;
    latest?: {
      pentestRequestAt: string | null;
      pentestStatus: string | null;
      redTeamRunAt: string | null;
      redTeamStatus: string | null;
    };
  };
};

const domains: Array<[DomainId, string, number, number, typeof Activity]> = [
  ["agents", "AGENTS", 50, 23, Activity],
  ["identity", "IDENTITY", 78, 41, Fingerprint],
  ["mcp", "MCP / TOOLS", 69, 71, Layers3],
  ["cloud", "CLOUD", 31, 71, Boxes],
  ["apis", "APIs", 22, 42, Network],
  ["data", "DATA", 50, 83, ShieldCheck],
];

const layers: Array<[LayerId, string, string]> = [
  ["graph", "SECURITY GRAPH", "Observed relationships between identities, agents, tools and resources."],
  ["reach", "AGENT REACH", "Authorized paths an agent can traverse across connected surfaces."],
  ["policy", "POLICY", "Explicit allow, deny, approval and constrained execution decisions."],
  ["runtime", "RUNTIME", "Execution-boundary checks before sensitive actions cross the control plane."],
  ["evidence", "EVIDENCE", "Decision context, provenance, verification state and audit records."],
];

export default function ElitzeGlobalView() {
  const [active, setActive] = useState<DomainId>("agents");
  const [layer, setLayer] = useState<LayerId>("graph");
  const [rotation, setRotation] = useState(-7);
  const [scale, setScale] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const drag = useRef<{ x: number; rotation: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [overviewResponse, snapshotResponse] = await Promise.all([
          fetch("/api/console/overview", { cache: "no-store" }),
          fetch("/api/security/daily-snapshot", { cache: "no-store" }),
        ]);
        const overviewPayload = (await overviewResponse.json()) as Overview;
        const snapshotPayload = (await snapshotResponse.json()) as { ok: boolean; latest?: Snapshot | null };
        if (!mounted) return;
        setOverview(overviewPayload);
        setSnapshot(snapshotPayload.ok ? snapshotPayload.latest ?? null : null);
      } catch {
        if (!mounted) {
          return;
        }
        setOverview({ ok: false });
        setSnapshot(null);
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
    setRotation(-7);
    setScale(1);
  };

  const activeDomain = domains.find((entry) => entry[0] === active) ?? domains[0];
  const activeLayer = layers.find((entry) => entry[0] === layer) ?? layers[0];

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#05080e] p-4 text-white shadow-[0_42px_120px_rgba(0,0,0,.4)] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(71,100,255,.15),transparent_34%),radial-gradient(circle_at_17%_10%,rgba(103,232,249,.05),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.28em] text-cyan-200/75">ELITZE // COMMAND SURFACE</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">ELITZE Global View</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">A spatial security command surface for reachability, policy, runtime control and evidence continuity.</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">
          <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${overview?.ok ? "bg-cyan-300" : "bg-amber-300"}`} />
          {overview?.ok ? "TENANT DATA" : "UNAVAILABLE"}
        </div>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap gap-2">
        {layers.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setLayer(id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] transition ${layer === id ? "border-cyan-300/45 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-200"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="relative z-10 mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div
          className="relative min-h-[570px] overflow-hidden rounded-[28px] border border-white/10 bg-[#030509] cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => { drag.current = { x: event.clientX, rotation }; }}
          onPointerMove={(event) => { if (drag.current) setRotation(Math.max(-26, Math.min(26, drag.current.rotation + (event.clientX - drag.current.x) * 0.10))); }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onWheel={(event) => setScale((value) => Math.max(.82, Math.min(1.24, value - event.deltaY * .0004)))}
        >
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.026)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.026)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(67,89,255,.11),transparent_42%)]" />

          <div className="absolute left-4 top-4 z-20 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl">
            <div className="text-[9px] uppercase tracking-[.22em] text-slate-500">CURRENT FOCUS</div>
            <div className="mt-1 text-xs font-semibold text-slate-100">{activeDomain[1]}</div>
            <div className="mt-1 max-w-[190px] text-[10px] leading-4 text-slate-500">{activeLayer[2]}</div>
          </div>

          <div className="absolute right-4 top-4 z-20 flex gap-2">
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setScale((value) => Math.min(1.24, value + .08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px]" aria-label="Zoom in">+</button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setScale((value) => Math.max(.82, value - .08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px]" aria-label="Zoom out">-</button>
            <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={reset} className="rounded-full border border-white/10 bg-black/45 p-2" aria-label="Reset global security view"><RotateCcw className="h-3.5 w-3.5" /></button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[400px] w-[400px]" style={{ transform: `perspective(1100px) rotateY(${rotation}deg) scale(${scale})` }}>
              <div className="absolute inset-[8%] rounded-full border border-cyan-300/10 shadow-[0_0_100px_rgba(56,189,248,.08)]" />
              <div className="absolute inset-[15%] rounded-full border border-white/8 bg-[radial-gradient(circle_at_34%_30%,rgba(74,118,255,.28),rgba(6,13,24,.85)_53%,rgba(1,4,9,.98)_82%)] shadow-[inset_-28px_-22px_70px_rgba(0,0,0,.7),0_0_70px_rgba(45,92,210,.12)]" />
              <div className="absolute inset-[7%] animate-[spin_24s_linear_infinite] rounded-full border border-dashed border-white/8" />
              <div className="absolute inset-[3%] animate-[spin_36s_linear_infinite_reverse] rounded-full border border-dashed border-cyan-200/10" />

              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs><filter id="elitze-global-view-glow"><feGaussianBlur stdDeviation=".6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                <ellipse cx="50" cy="50" rx="37" ry="15" fill="none" stroke="rgba(103,232,249,.16)" strokeWidth=".5" transform="rotate(-12 50 50)" />
                <ellipse cx="50" cy="50" rx="31" ry="43" fill="none" stroke="rgba(148,163,184,.12)" strokeWidth=".35" transform="rotate(22 50 50)" />
                {domains.map(([id, label, x, y]) => <g key={id}><line x1="50" y1="50" x2={x} y2={y} stroke={active === id ? "rgba(103,232,249,.7)" : "rgba(148,163,184,.17)"} strokeWidth={active === id ? ".65" : ".32"} strokeDasharray="1.5 1.5" /><circle cx={x} cy={y} r={active === id ? 2.7 : 1.9} fill={active === id ? "#67e8f9" : "#a5b4fc"} opacity={active === id ? .95 : .5} filter={active === id ? "url(#elitze-global-view-glow)" : undefined} /></g>)}
              </svg>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/35 bg-cyan-300/[.06] px-6 py-5 text-center shadow-[0_0_50px_rgba(103,232,249,.13)] backdrop-blur-xl">
                <div className="text-[9px] font-bold uppercase tracking-[.24em] text-cyan-100">ELITZE</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">CONTROL PLANE</div>
              </div>

              {domains.map(([id, label, x, y, Icon]) => (
                <button key={id} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setActive(id)} style={{ left: `${x}%`, top: `${y}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 backdrop-blur-xl transition ${active === id ? "border-cyan-200/45 bg-cyan-200/10 text-cyan-50" : "border-white/10 bg-black/35 text-slate-500 hover:border-white/20 hover:text-slate-100"}`}>
                  <span className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[.10em]"><Icon className="h-3 w-3" />{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="absolute inset-x-4 bottom-4 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-[9px] uppercase tracking-[.13em] text-slate-500 backdrop-blur-xl">
            <span>drag · wheel · select domain</span>
            <span>{overview?.ok ? "source-backed state" : "data unavailable"}</span>
          </div>
        </div>

        <aside className="rounded-[28px] border border-white/10 bg-white/[.025] p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-slate-500">CONTROL STATUS</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.16em] text-slate-600">Agent identities</div><div className="mt-2 font-mono text-xl">{overview?.ok && overview.metrics?.agentIdentities !== undefined ? overview.metrics.agentIdentities : "UNMEASURABLE"}</div></div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="text-[9px] uppercase tracking-[.16em] text-slate-600">Approval queue</div><div className="mt-2 font-mono text-xl">{overview?.ok && overview.metrics?.pendingApprovals !== undefined ? overview.metrics.pendingApprovals : "UNKNOWN"}</div></div>
            <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><div className="flex items-center gap-2 text-[9px] uppercase tracking-[.16em] text-slate-600"><TerminalSquare className="h-3.5 w-3.5" /> Runtime gate</div><div className="mt-2 font-mono text-xl">POLICY BOUND</div></div>
          </div>

          <div className="mt-6 border-t border-white/8 pt-5">
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.2em] text-cyan-200/70"><Clock3 className="h-3 w-3" /> DAILY SNAPSHOT</div>
            <div className="mt-2 text-base font-semibold">{snapshot?.snapshotDate ?? "UNAVAILABLE"}</div>
            <div className="mt-1 font-mono text-[9px] text-slate-500">{snapshot?.contentHash ? snapshot.contentHash.slice(0, 16) + "..." : "No snapshot evidence"}</div>
            <div className="mt-2 text-[9px] uppercase tracking-[.14em] text-slate-600">{snapshot?.evidenceState ?? "UNMEASURABLE"}</div>
          </div>

          <div className="mt-5 border-t border-white/8 pt-5"><div className="text-[9px] font-semibold uppercase tracking-[.2em] text-cyan-200/70">SELECTED DOMAIN</div><div className="mt-2 text-base font-semibold">{activeDomain[1]}</div><div className="mt-1 text-xs leading-5 text-slate-500">{activeDomain[0] === "agents" ? "Agent identities, tools, delegation and runtime access." : activeLayer[2]}</div></div>
          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4 text-[10px] leading-5 text-slate-500">Evidence remains bounded to connected sources. Unknown and unmeasurable states are surfaced rather than replaced with synthetic telemetry.</div>
        </aside>
      </div>
    </section>
  );
}
