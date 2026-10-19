"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SecurityTruthPanel from "@/components/security-truth-panel";
import { Activity, ArrowUpRight, Database, FileSearch, Fingerprint, Layers3, Radar, RotateCcw, ShieldCheck, ScanLine, Waypoints } from "lucide-react";

type DomainId = "agents" | "identity" | "mcp" | "tools" | "apis" | "data";
type ViewMode = "GRAPH" | "SCAN" | "MAP" | "EVIDENCE";

type Overview = {
  ok: boolean;
  metrics?: {
    agentIdentities: number;
    pendingApprovals: number;
    graphNodes: number;
    securityTests: number;
  };
};

const domains: ReadonlyArray<{
  id: DomainId;
  label: string;
  detail: string;
  x: number;
  y: number;
  icon: typeof Activity;
}> = [
  { id: "agents", label: "Agents", detail: "Agent identities and workload state", x: 50, y: 18, icon: Activity },
  { id: "identity", label: "Identity", detail: "Human, workload and delegated authority", x: 79, y: 41, icon: Fingerprint },
  { id: "mcp", label: "MCP", detail: "Servers, sessions and tool surfaces", x: 70, y: 71, icon: Layers3 },
  { id: "tools", label: "Tools", detail: "Callable capabilities and execution boundaries", x: 50, y: 84, icon: Waypoints },
  { id: "apis", label: "APIs", detail: "Reachable APIs and external execution paths", x: 30, y: 71, icon: Database },
  { id: "data", label: "Data", detail: "Sensitive resources and classification boundaries", x: 21, y: 41, icon: FileSearch },
];

const modes: ReadonlyArray<{ id: ViewMode; label: string; detail: string }> = [
  { id: "GRAPH", label: "Security Graph", detail: "Identity, reachability and policy relationships" },
  { id: "SCAN", label: "Security Scan", detail: "Visual scan state linked to the authorized pentest surface" },
  { id: "MAP", label: "Attack Surface", detail: "Move from agent to tools, APIs and data boundaries" },
  { id: "EVIDENCE", label: "Evidence", detail: "Decision, provenance and verification context" },
];

export default function ElitzeControlSurface() {
  const [active, setActive] = useState<DomainId>("agents");
  const [mode, setMode] = useState<ViewMode>("GRAPH");
  const [zoom, setZoom] = useState(1);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/console/overview", { cache: "no-store" });
        const payload = (await response.json()) as Overview;
        if (mounted) setOverview(payload);
      } catch {
        if (mounted) setOverview({ ok: false });
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const activeDomain = useMemo(
    () => domains.find((entry) => entry.id === active) ?? domains[0],
    [active],
  );

  const status = overview?.ok ? "OBSERVED DATA" : "UNAVAILABLE DATA";
  const agents = overview?.metrics?.agentIdentities;
  const approvals = overview?.metrics?.pendingApprovals;
  const discoveries = overview?.metrics?.securityTests;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#05080d] p-4 text-white shadow-[0_36px_120px_rgba(0,0,0,.42)] sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,.11),transparent_34%),radial-gradient(circle_at_18%_15%,rgba(99,102,241,.10),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[.26em] text-cyan-300/85">ELITZE // SECURITY CONTROL SURFACE</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-.03em] sm:text-3xl">Identity, reach, policy and evidence in one view.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">An interactive 3D security model built to expose real control relationships without inventing runtime state.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${overview?.ok ? "bg-cyan-300" : "bg-amber-300"}`} />
          {status}
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-wrap gap-2">
        {modes.map((item) => (
          <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] transition ${mode === item.id ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" : "border-white/10 text-slate-500 hover:border-cyan-300/20 hover:text-slate-200"}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="relative z-10 mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="relative min-h-[590px] overflow-hidden rounded-[28px] border border-white/10 bg-[#03060a]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.022)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute inset-x-[9%] top-[8%] h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
          <div className="absolute left-4 top-4 z-20 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-xl">
            <div className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">ACTIVE OBJECT</div>
            <div className="mt-1 text-sm font-bold">{activeDomain.label}</div>
            <div className="mt-1 max-w-56 text-[10px] leading-4 text-slate-500">{activeDomain.detail}</div>
          </div>
          <div className="absolute right-4 top-4 z-20 flex gap-2">
            <button type="button" onClick={() => setZoom((value) => Math.min(1.18, value + 0.08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px]">+</button>
            <button type="button" onClick={() => setZoom((value) => Math.max(.86, value - 0.08))} className="rounded-full border border-white/10 bg-black/45 px-3 py-2 text-[10px]">âˆ’</button>
            <button type="button" onClick={() => { setZoom(1); setActive("agents"); setMode("GRAPH"); }} aria-label="Reset security view" className="rounded-full border border-white/10 bg-black/45 p-2"><RotateCcw className="h-3.5 w-3.5" /></button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="relative h-[440px] w-[440px] transition-transform duration-500" style={{ transform: `perspective(1200px) rotateX(54deg) rotateZ(-4deg) scale(${zoom})` }}>
              <div className="absolute inset-[13%] rounded-[42%] border border-cyan-300/15 bg-[radial-gradient(circle_at_48%_48%,rgba(34,211,238,.14),rgba(7,14,24,.7)_55%,rgba(1,4,9,.98)_82%)] shadow-[inset_-30px_-26px_60px_rgba(0,0,0,.72),0_0_70px_rgba(34,211,238,.08)]" />
              <div className="absolute inset-[20%] rounded-full border border-white/10" />
              <div className="absolute inset-[27%] rounded-full border border-cyan-300/10 animate-[spin_28s_linear_infinite]" />
              <div className="absolute left-[8%] right-[8%] top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
              <div className={`absolute inset-y-[9%] left-[12%] w-px bg-gradient-to-b from-transparent via-cyan-200/50 to-transparent ${mode === "SCAN" ? "animate-[pulse_1.7s_ease-in-out_infinite]" : "opacity-30"}`} />

              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
                {domains.map((entry) => {
                  const highlighted = entry.id === active;
                  return (
                    <g key={entry.id}>
                      <path d={`M50 50 L${entry.x} ${entry.y}`} stroke={highlighted ? "rgba(103,232,249,.75)" : "rgba(148,163,184,.15)"} strokeWidth={highlighted ? ".8" : ".35"} fill="none" />
                      <circle cx={entry.x} cy={entry.y} r={highlighted ? 3.1 : 2} fill={highlighted ? "#67e8f9" : "#94a3b8"} opacity={highlighted ? 1 : .6} />
                    </g>
                  );
                })}
                <circle cx="50" cy="50" r="1.8" fill="#e2faff" />
              </svg>

              <button type="button" onClick={() => setActive("agents")} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-cyan-200/40 bg-cyan-300/10 px-5 py-4 text-center shadow-[0_0_48px_rgba(34,211,238,.18)] backdrop-blur-xl">
                <ShieldCheck className="mx-auto h-5 w-5 text-cyan-200" />
                <div className="mt-2 text-[9px] font-bold uppercase tracking-[.2em] text-cyan-100">ELITZE</div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Control Plane</div>
              </button>

              {domains.map((entry) => {
                const Icon = entry.icon;
                const selected = entry.id === active;
                return (
                  <button key={entry.id} type="button" onClick={() => setActive(entry.id)} style={{ left: `${entry.x}%`, top: `${entry.y}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 backdrop-blur-xl transition ${selected ? "border-cyan-200/45 bg-cyan-200/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.12)]" : "border-white/10 bg-black/35 text-slate-400 hover:border-cyan-300/20 hover:text-white"}`}>
                    <span className="flex flex-col items-start gap-1"><span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.12em]"><Icon className="h-3.5 w-3.5" />{entry.label}</span><span className="pl-5 font-mono text-[7px] tracking-[.1em] opacity-60">TRUTH: DECLARED</span></span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-[9px] uppercase tracking-[.16em] text-slate-500 backdrop-blur-xl">
            <span>{mode === "SCAN" ? "SCAN MODE SELECTED · NO FINDINGS IMPLIED" : "SCHEMATIC GRAPH · RELATIONSHIPS: DECLARED"}</span>
            <span>{overview?.ok ? "OVERVIEW METRICS OBSERVED" : "NO RECORD. NO CLAIM."}</span>
          </div>
        </div>

        <aside className="rounded-[28px] border border-white/10 bg-white/[.025] p-5">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-slate-500">CONTROL STATUS</div>
          <div className="mt-4 grid gap-3">
            {[
              ["Agent identities", agents],
              ["Pending approvals", approvals],
              ["Security test requests", discoveries],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="text-[9px] uppercase tracking-[.16em] text-slate-600">{label}</div>
                <div className="mt-2 font-mono text-xl">{typeof value === "number" ? value : "UNKNOWN"}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/8 pt-5">
            <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200/75">SELECTED PATH</div>
            <div className="mt-2 text-base font-bold">Agent → {activeDomain.label}</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{activeDomain.detail}</div>
          </div>

          <div className="mt-5 grid gap-2">
            <Link href="/control-room" className="flex items-center justify-between rounded-xl border border-cyan-300/15 bg-cyan-300/[.04] px-3 py-3 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/[.08]">
              <span><ScanLine className="mr-2 inline h-3.5 w-3.5" />Attack the Agent</span><ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/console/threat-detection" className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-3 text-xs font-semibold text-slate-300 hover:bg-white/[.03]">
              <span><Radar className="mr-2 inline h-3.5 w-3.5" />Runtime Threat Detection</span><ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/console/vulnerabilities" className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-3 text-xs font-semibold text-slate-300 hover:bg-white/[.03]">
              <span><Database className="mr-2 inline h-3.5 w-3.5" />Open Vulnerability Search</span><ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4 text-[10px] leading-5 text-slate-500">No synthetic telemetry. Missing connector evidence remains unavailable, unknown or unmeasurable.</div>
        </aside>
      </div>
      <SecurityTruthPanel />
    </section>
  );
}
