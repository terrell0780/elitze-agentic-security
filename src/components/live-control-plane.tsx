"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Fingerprint, Network, RefreshCw, ShieldCheck } from "lucide-react";

type Session = { ok: boolean; user: { id: string; email: string; role: string } | null };
type Graph = {
  ok: boolean;
  nodes?: Array<{ nodeType: string; displayName: string; evidenceState: string; source: string; observedAt: string | null }>;
  edges?: Array<{ relation: string; from: string; to: string; evidenceState: string; source: string }>;
  error?: string;
};

export default function LiveControlPlane() {
  const [session, setSession] = useState<Session | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [health, setHealth] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const healthResponse = await fetch("/api/health", { cache: "no-store" });
      const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
      const nextHealth = (await healthResponse.json()) as { ok: boolean };
      const nextSession = (await sessionResponse.json()) as Session;
      setHealth(nextHealth.ok === true);
      setSession(nextSession);

      if (nextSession.user) {
        const graphResponse = await fetch("/api/console/security-graph", { cache: "no-store" });
        setGraph((await graphResponse.json()) as Graph);
      } else {
        setGraph(null);
      }
    } catch {
      setHealth(false);
      setSession({ ok: false, user: null });
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(initial);
  }, [refresh]);

  const nodeCount = graph?.nodes?.length ?? 0;
  const edgeCount = graph?.edges?.length ?? 0;
  const signedIn = Boolean(session?.user);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#04070b] text-white shadow-[0_32px_100px_rgba(0,0,0,.38)]">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(103,232,249,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.035)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative border-b border-white/10 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-300">ELITZE / live control plane</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em] sm:text-3xl">Control state follows the evidence.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Public pages never receive tenant-sensitive inventory or aggregate telemetry. Sign in to inspect the protected security graph.</p>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="relative grid gap-px bg-white/10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="bg-[#04070b] p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [Fingerprint, "IDENTITY", signedIn ? "Authenticated" : "Sign-in required"],
              [Network, "REACH", signedIn && graph?.ok ? `${nodeCount} nodes · ${edgeCount} edges` : "Protected"],
              [ShieldCheck, "ENFORCEMENT", "Policy boundary"],
            ].map(([Icon, title, value]) => {
              const C = Icon as typeof Activity;
              return <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><C className="h-4 w-4 text-cyan-300" /><div className="mt-3 text-[9px] font-bold tracking-[.18em] text-slate-500">{title as string}</div><div className="mt-2 text-sm font-semibold">{value as string}</div></div>;
            })}
          </div>
          <div className="mt-5 rounded-[26px] border border-cyan-300/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.10),transparent_55%)] p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${health ? "bg-emerald-300" : "bg-amber-300"}`} />
              {health ? "Database reachable" : "Database unavailable"}
              <span className="mx-1 text-slate-700">·</span>
              {signedIn ? (graph?.ok ? "Protected graph response received" : "Protected graph unavailable") : "Protected telemetry withheld"}
            </div>
          </div>
        </div>

        <aside className="bg-[#060a10] p-5 sm:p-7">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" /><span className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Evidence state</span></div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 text-xs leading-5 text-slate-400">
            {signedIn
              ? graph?.ok
                ? "Observed graph data is available to the authenticated tenant."
                : "The authenticated tenant has no available graph response."
              : "UNAVAILABLE — sign in to inspect protected telemetry."}
          </div>
          <Link href={signedIn ? "/console" : "/login?next=%2Fconsole"} className="mt-5 inline-flex w-full items-center justify-between rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] px-4 py-3 text-xs font-semibold text-cyan-100">
            {signedIn ? "Open full console" : "Sign in to control plane"} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
