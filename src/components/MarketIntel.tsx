"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Crosshair,
  Eye,
  Fingerprint,
  Flame,
  Lock,
  Power,
  Radar,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Gap = {
  id: number;
  title: string;
  demand: string;
  buyer: string;
  why: string;
  elitzeStatus: string;
  differentiator: boolean;
};

type Agent = {
  id: number;
  name: string;
  slug: string;
  owner: string;
  framework: string;
  surface: string;
  status: string;
  riskScore: number;
  purpose: string;
  purposeBound: boolean;
  tools: string[];
  nhiId: string | null;
};

type Discovery = {
  id: number;
  kind: string;
  name: string;
  location: string;
  severity: string;
  details: string;
  status: string;
};

type Approval = {
  id: number;
  agentSlug: string;
  action: string;
  blastRadius: string;
  rationale: string;
  status: string;
};

type Asi = {
  id: number;
  code: string;
  title: string;
  control: string;
  coverage: number;
  status: string;
};

type EventRow = {
  id: number;
  agentSlug: string;
  eventType: string;
  severity: string;
  summary: string;
  intentMismatch: boolean;
  latencyMs: number;
};

type Payload = {
  ok: boolean;
  stats: {
    agents: number;
    shadowAgents: number;
    openDiscoveries: number;
    pendingApprovals: number;
    asiAvg: number;
    shippedGaps: number;
    differentiators: number;
  };
  gaps: Gap[];
  agents: Agent[];
  discoveries: Discovery[];
  approvals: Approval[];
  asi: Asi[];
  events: EventRow[];
  insights: {
    headline: string;
    sources: string[];
    overTheTop: string[];
  };
};

const demandColor: Record<string, string> = {
  critical: "text-rose-300 bg-rose-500/15 border-rose-500/30",
  high: "text-amber-300 bg-amber-500/15 border-amber-500/30",
  medium: "text-slate-300 bg-white/5 border-white/10",
};

const statusColor: Record<string, string> = {
  shipped: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  building: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  planned: "text-slate-300 bg-white/5 border-white/10",
  active: "text-emerald-300",
  paused: "text-amber-300",
  quarantined: "text-rose-300",
  shadow: "text-red-300",
  pending: "text-amber-300",
  approved: "text-emerald-300",
  denied: "text-rose-300",
  covered: "text-emerald-300",
  partial: "text-amber-300",
  gap: "text-rose-300",
};

export default function MarketIntel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [tab, setTab] = useState<"gaps" | "runtime" | "asi">("gaps");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      const json = (await res.json()) as Payload;
      if (json.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function mutate(body: Record<string, unknown>, id: number) {
    setBusy(id);
    try {
      await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-10 text-center text-sm text-slate-400">
        Loading market intelligence…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-10 text-center text-sm text-rose-300">
        Failed to load market intelligence.
      </div>
    );
  }

  const { stats, gaps, agents, discoveries, approvals, asi, events, insights } =
    data;

  return (
    <div className="space-y-6">
      {/* Insight banner */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/40 via-[#0c060c] to-[#0c060c] p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-red-300">
              <Crosshair className="h-3.5 w-3.5" />
              Market intelligence · live from research
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
              {insights.headline}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Synthesized from Gartner AI Security Platforms / TRiSM, OWASP ASI
              Top 10 (2026), NIST AI Agent Standards, Palo Alto POC checklists,
              and the governance–containment gap studies. Below is what buyers
              ask for — and where Elitze is already ahead.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {[
              { k: stats.shippedGaps, v: "demands shipped" },
              { k: stats.differentiators, v: "true differentiators" },
              { k: `${stats.asiAvg}%`, v: "ASI coverage avg" },
              { k: stats.shadowAgents, v: "shadow agents found" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-xl border border-red-900/40 bg-black/30 px-3 py-2"
              >
                <div className="font-mono text-lg font-semibold text-red-300">
                  {s.k}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["gaps", "What buyers demand"],
            ["runtime", "Live containment"],
            ["asi", "OWASP ASI matrix"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              tab === id
                ? "border-red-500/50 bg-red-500/15 text-red-200"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-red-500/30 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "gaps" && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            {gaps.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-red-900/40 bg-[#0c060c] p-4 transition hover:border-red-500/35"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${demandColor[g.demand] ?? demandColor.medium}`}
                  >
                    {g.demand}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusColor[g.elitzeStatus] ?? statusColor.planned}`}
                  >
                    {g.elitzeStatus}
                  </span>
                  {g.differentiator && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
                      <Flame className="h-3 w-3" /> over-the-top
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-slate-500">
                    buyer · {g.buyer}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {g.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {g.why}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Target className="h-4 w-4 text-red-300" />
                What puts Elitze over the top
              </div>
              <ul className="mt-4 space-y-2.5">
                {insights.overTheTop.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs leading-relaxed text-slate-300"
                  >
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Scale className="h-4 w-4 text-red-300" />
                Research sources
              </div>
              <ul className="mt-3 space-y-1.5">
                {insights.sources.map((s) => (
                  <li key={s} className="text-[11px] text-slate-400">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-red-400">
                The governance–containment gap
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                ~58% of orgs monitor agents. Only ~38% can actually stop them.
                Elitze closes the gap with purpose binding, pre-tool hooks, and
                a real killswitch — not dashboards alone.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === "runtime" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Agent inventory */}
          <div className="rounded-xl border border-red-900/40 bg-[#0c060c]">
            <div className="flex items-center justify-between border-b border-red-950/50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Bot className="h-4 w-4 text-red-300" />
                Agent inventory
              </div>
              <span className="font-mono text-[10px] text-slate-500">
                {stats.agents} total · {stats.shadowAgents} shadow
              </span>
            </div>
            <ul className="divide-y divide-red-950/50">
              {agents.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {a.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase ${statusColor[a.status] ?? "text-slate-400"}`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {a.framework} · {a.surface} · {a.owner}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {a.purpose}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {a.purposeBound && (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                            purpose-bound
                          </span>
                        )}
                        {a.nhiId ? (
                          <span className="inline-flex items-center gap-1 rounded border border-red-500/25 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-300">
                            <Fingerprint className="h-2.5 w-2.5" />
                            {a.nhiId}
                          </span>
                        ) : (
                          <span className="rounded border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-300">
                            no NHI
                          </span>
                        )}
                        {a.tools.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono text-lg font-semibold ${
                          a.riskScore >= 70
                            ? "text-rose-300"
                            : a.riskScore >= 40
                              ? "text-amber-300"
                              : "text-emerald-300"
                        }`}
                      >
                        {a.riskScore}
                      </div>
                      <div className="text-[10px] text-slate-500">risk</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Discoveries + HITL */}
          <div className="space-y-4">
            <div className="rounded-xl border border-red-900/40 bg-[#0c060c]">
              <div className="flex items-center justify-between border-b border-red-950/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Eye className="h-4 w-4 text-red-300" />
                  Shadow discovery
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {stats.openDiscoveries} open
                </span>
              </div>
              <ul className="divide-y divide-red-950/50">
                {discoveries.map((d) => (
                  <li key={d.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{d.name}</span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                              d.severity === "critical"
                                ? "border-rose-500/30 text-rose-300"
                                : d.severity === "high"
                                  ? "border-amber-500/30 text-amber-300"
                                  : "border-white/10 text-slate-400"
                            }`}
                          >
                            {d.severity}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-slate-500">
                          {d.kind} · {d.location}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                          {d.details}
                        </p>
                      </div>
                      {d.status === "open" ? (
                        <button
                          type="button"
                          disabled={busy === d.id}
                          onClick={() =>
                            void mutate(
                              { action: "claim-discovery", id: d.id },
                              d.id,
                            )
                          }
                          className="shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          Claim
                        </button>
                      ) : (
                        <span className="shrink-0 text-[10px] uppercase text-emerald-400">
                          {d.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-red-900/40 bg-[#0c060c]">
              <div className="flex items-center justify-between border-b border-red-950/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <UserCheck className="h-4 w-4 text-red-300" />
                  HITL queue · irreversible only
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {stats.pendingApprovals} pending
                </span>
              </div>
              <ul className="divide-y divide-red-950/50">
                {approvals.map((a) => (
                  <li key={a.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs text-red-200">
                          {a.action}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {a.agentSlug} · blast · {a.blastRadius}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {a.rationale}
                        </p>
                      </div>
                      {a.status === "pending" ? (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            disabled={busy === a.id}
                            onClick={() =>
                              void mutate(
                                { action: "approve", id: a.id },
                                a.id,
                              )
                            }
                            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                            aria-label="Approve"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busy === a.id}
                            onClick={() =>
                              void mutate({ action: "deny", id: a.id }, a.id)
                            }
                            className="rounded-md border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                            aria-label="Deny"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`shrink-0 text-[10px] uppercase ${statusColor[a.status]}`}
                        >
                          {a.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enforcement feed full width */}
          <div className="rounded-xl border border-red-900/40 bg-[#0c060c] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-red-950/50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Radar className="h-4 w-4 text-red-300" />
                Runtime enforcement · intent-aware
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                <Power className="h-3 w-3 text-amber-400" />
                killswitch armed
              </span>
            </div>
            <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="border-b border-red-950/40 p-4 sm:border-r sm:border-red-950/40"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className={`h-3.5 w-3.5 ${
                        e.severity === "critical"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    />
                    <span className="font-mono text-[11px] uppercase text-red-300">
                      {e.eventType}
                    </span>
                    {e.intentMismatch && (
                      <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] uppercase text-amber-300">
                        intent mismatch
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 text-xs text-slate-200">{e.summary}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{e.agentSlug}</span>
                    <span className="font-mono">{e.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "asi" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  OWASP ASI Top 10 for Agentic Applications (2026)
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Procurement and boards now ask for agentic controls — not just
                  the LLM Top 10. Elitze maps every ASI item to a live control.
                </p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center">
                <div className="font-mono text-2xl font-semibold text-red-300">
                  {stats.asiAvg}%
                </div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  average coverage
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {asi.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-red-900/40 bg-[#0c060c] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-red-400">
                        {row.code}
                      </span>
                      <span
                        className={`text-[10px] uppercase ${statusColor[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-white">
                      {row.title}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                      {row.control}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-semibold text-red-300">
                      {row.coverage}%
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
                    style={{ width: `${row.coverage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.05] px-5 py-4">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
          <div>
            <div className="text-sm font-medium text-white">
              Ready for the next buyer conversation
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              Discovery → purpose binding → pre-tool enforce → HITL → killswitch
              → ASI evidence. That loop is what closes deals in 2026.
            </p>
          </div>
        </div>
        <a
          href="#demo"
          className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:bg-red-400"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Book a POC
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
