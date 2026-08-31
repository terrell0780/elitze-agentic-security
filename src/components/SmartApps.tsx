"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Eye,
  Globe,
  Layers,
  Zap,
  Workflow,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Source = {
  id: number;
  name: string;
  kind: string;
  provider: string;
  status: string;
  lastIngestAt: string;
  eventsToday: number;
  tags: string[];
};

type Insight = {
  id: number;
  kind: string;
  title: string;
  summary: string;
  evidence: string;
  severity: string;
};

export default function SmartApps() {
  const [data, setData] = useState<{ sources: Source[]; insights: Insight[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data-hub", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setData({ sources: json.sources, insights: json.insights });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-10 text-center text-sm text-slate-400">
        Loading Smart Apps data hub…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-10 text-center text-sm text-rose-300">
        Data hub unavailable.
      </div>
    );
  }

  const sources = data.sources ?? [];
  const insights = data.insights ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Data Hub sources */}
      <div className="lg:col-span-7 rounded-2xl border border-red-900/40 bg-[#0c060c]">
        <div className="flex items-center justify-between border-b border-red-950/50 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Database className="h-4 w-4 text-red-300" />
            Data Hub — live sources
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            {sources.length} sources · streaming
          </span>
        </div>
        <div className="divide-y divide-red-950/50">
          {sources.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    s.status === "connected"
                      ? "bg-emerald-400"
                      : s.status === "degraded"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                  }`}
                />
                <div>
                  <div className="text-sm font-medium text-white">{s.name}</div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                    <span className="uppercase">{s.provider}</span>
                    <span>·</span>
                    <span>{s.kind}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-red-200">{s.eventsToday.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500">events / today</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="lg:col-span-5 rounded-2xl border border-red-900/40 bg-[#0c060c]">
        <div className="flex items-center justify-between border-b border-red-950/50 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Zap className="h-4 w-4 text-red-300" />
            Automated Insights
          </div>
          <span className="font-mono text-[10px] text-slate-500">{insights.length} open</span>
        </div>
        <div className="divide-y divide-red-950/50">
          {insights.map((i) => (
            <a
              key={i.id}
              href="#"
              className="block px-5 py-3 hover:bg-red-500/[0.03] transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-white">{i.title}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-400">{i.summary}</div>
                </div>
                <span
                  className={`mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${
                    i.severity === "critical"
                      ? "border-rose-500/30 text-rose-300"
                      : i.severity === "high"
                        ? "border-amber-500/30 text-amber-300"
                        : "border-white/10 text-slate-400"
                  }`}
                >
                  {i.severity}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">Evidence: {i.evidence}</div>
              <div className="mt-1 text-[10px] text-slate-500">Sources: {i.kind}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Smart Apps + Dashboards */}
      <div className="lg:col-span-6 rounded-2xl border border-red-900/40 bg-gradient-to-br from-[#0c060c] to-red-950/20 p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-400">
          <Layers className="h-4 w-4" />
          Smart Apps
        </div>
        <h3 className="mt-2 text-xl font-semibold text-white">AI Agents, Augmented Dashboards & Smart Apps</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          The platform runs agent-native apps: <strong>Smart Apps</strong> that generate security dashboards,
          <strong>AI Agents</strong> that respond to events, <strong>AI-Augmented Dashboards</strong> that highlight intent
          mismatches and risk shifts automatically.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            "Agent-native apps deploy in minutes, not quarters.",
            "Dashboards explain themselves with citation-backed insight cards.",
            "Every app runs inside the killswitch + guardrails boundary.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-6 rounded-2xl border border-red-900/40 bg-gradient-to-br from-[#0c060c] to-red-950/20 p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-red-400">
          <BarChart3 className="h-4 w-4" />
          AI-Augmented Dashboards
        </div>
        <h3 className="mt-2 text-xl font-semibold text-white">Real-time dashboards that explain themselves</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Dashboards are not static charts. Each widget links to evidence: agent decision chain, tool calls,
          policy evaluations, HITL outcomes, and ASI control coverage. When risk shifts, the insight card
          surfaces the root cause — no manual drill-down required.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "Agent topology live", v: "2,418 nodes" },
            { label: "Intent mismatches today", v: "317" },
            { label: "P95 policy latency", v: "41ms" },
            { label: "Killswitch armed", v: "0 fires" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-red-900/30 bg-black/30 px-3 py-2">
              <div className="font-mono text-[11px] text-slate-500">{s.label}</div>
              <div className="text-sm font-semibold text-red-200">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
