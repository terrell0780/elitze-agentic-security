"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Database, Fingerprint, Network, RefreshCw, ShieldCheck } from "lucide-react";

type Graph = {
  ok: boolean;
  nodes?: Array<{ nodeType: string; displayName: string; evidenceState: string; source: string; observedAt: string | null }>;
  edges?: Array<{ relation: string; from: string; to: string; evidenceState: string; source: string }>;
};
type Metrics = {
  ok: boolean;
  metrics?: {
    averageEnforcementLatencyMs: number | null;
    intentMismatches: number;
    autonomousDecisionRate: { value: number | null; state: string };
    analystCoverage: { value: number | null; state: string };
  };
};
type Market = { ok: boolean; stats?: { agents?: number; openDiscoveries?: number; pendingApprovals?: number } };

function state(value: number | null | undefined, measurement?: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "UNMEASURABLE";
  return measurement ? `${value}${measurement}` : String(value);
}

export default function LiveControlPlane() {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [health, setHealth] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [h, m, s, g] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }).then((r) => r.json() as Promise<{ ok: boolean }>),
        fetch("/api/market", { cache: "no-store" }).then((r) => r.json() as Promise<Market>),
        fetch("/api/soc/metrics", { cache: "no-store" }).then((r) => r.json() as Promise<Metrics>),
        fetch("/api/console/security-graph", { cache: "no-store" }).then((r) => r.json() as Promise<Graph>),
      ]);
      setHealth(h.ok === true); setMarket(m); setMetrics(s); setGraph(g);
    } catch {
      setHealth(false); setMarket({ ok: false }); setMetrics({ ok: false }); setGraph({ ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const nodeCount = graph?.nodes?.length ?? 0;
  const edgeCount = graph?.edges?.length ?? 0;
  const measurable = useMemo(() => [
    ["Agents", market?.stats?.agents],
    ["Open discoveries", market?.stats?.openDiscoveries],
    ["Pending approvals", market?.stats?.pendingApprovals],
  ], [market]);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#04070b] text-white shadow-[0_32px_100px_rgba(0,0,0,.38)]">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(103,232,249,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.035)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative border-b border-white/10 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-300">ELITZE / live control plane</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] sm:text-3xl">Control state follows the evidence.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">This surface reads configured ELITZE services. It does not fabricate agents, findings, scores or outcomes when the data plane is unavailable.</p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="relative grid gap-px bg-white/10 lg:grid-cols-[1.25fr_.75fr]">
        <div className="bg-[#04070b] p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            {measurable.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <div className="text-[9px] uppercase tracking-[.18em] text-slate-500">{label}</div>
                <div className="mt-3 font-mono text-2xl">{typeof value === "number" ? value : "UNKNOWN"}</div>
                <div className="mt-1 text-[9px] uppercase tracking-[.15em] text-slate-600">Observed</div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[26px] border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.10),transparent_55%)] p-5 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [Fingerprint, "IDENTITY", "Tenant-scoped subject"],
                [Network, "REACH", `${nodeCount} nodes · ${edgeCount} edges`],
                [ShieldCheck, "ENFORCEMENT", metrics?.metrics ? state(metrics.metrics.averageEnforcementLatencyMs, " ms") : "UNMEASURABLE"],
              ].map(([Icon, title, value]) => {
                const C = Icon as typeof Activity;
                return <div key={title as string} className="rounded-2xl border border-white/10 bg-black/30 p-5"><C className="h-4 w-4 text-cyan-300" /><div className="mt-3 text-[9px] font-bold tracking-[.18em] text-slate-500">{title as string}</div><div className="mt-2 text-sm font-semibold">{value as string}</div></div>;
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${health ? "bg-emerald-300" : "bg-amber-300"}`} />
              {health ? "Database reachable" : "Database unavailable"}
              <span className="mx-1 text-slate-700">·</span>
              {graph?.ok ? "Graph response received" : "Graph unavailable"}
            </div>
          </div>
        </div>

        <aside className="bg-[#060a10] p-5 sm:p-7">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" /><span className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Measured signals</span></div>
          <div className="mt-4 space-y-2">
            {[
              ["Autonomous decision rate", metrics?.metrics?.autonomousDecisionRate],
              ["Analyst feedback coverage", metrics?.metrics?.analystCoverage],
            ].map(([label, metric]) => {
              const m = metric as { value: number | null; state: string } | undefined;
              return <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-xs text-slate-400">{label as string}</div><div className="mt-2 font-mono text-lg">{m?.state === "MEASURABLE" ? `${m.value}%` : "UNMEASURABLE"}</div></div>;
            })}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.02] p-4 text-[10px] leading-5 text-slate-500">No observed record is replaced by a demo value. Missing evidence remains UNKNOWN, UNAVAILABLE or UNMEASURABLE.</div>
          <Link href="/console" className="mt-5 inline-flex w-full items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] px-4 py-3 text-xs font-semibold text-cyan-100">Open full console <ArrowUpRight className="h-4 w-4" /></Link>
        </aside>
      </div>
    </section>
  );
}
