"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BrainCircuit, Crosshair, Eye, Gauge, History, ShieldCheck, Sparkles, Waypoints, Zap } from "lucide-react";

type Scenario = {
  id: string;
  title: string;
  summary: string;
  action: string;
  delta: number;
  affected: string[];
  controls: string[];
};

const scenarios: Scenario[] = [
  {
    id: "tool-allow",
    title: "Allow a high-impact tool",
    summary: "Stage the proposed authorization change against the current security world model.",
    action: "ALLOW MCP TOOL",
    delta: 18,
    affected: ["2 privileged identities", "3 production APIs", "1 sensitive data store"],
    controls: ["Human approval", "Purpose-bound policy", "Runtime egress control"],
  },
  {
    id: "agent-prod",
    title: "Promote an agent to production",
    summary: "Forecast newly reachable assets, privilege, and blast radius before the deployment changes the live graph.",
    action: "PROMOTE AGENT",
    delta: 26,
    affected: ["1 production cluster", "4 tools", "6 secrets / credentials"],
    controls: ["Scoped identity", "Read-only first", "Continuous validation"],
  },
  {
    id: "policy-weaken",
    title: "Weaken a runtime policy",
    summary: "Measure which existing paths become reachable if a control is relaxed.",
    action: "RELAX POLICY",
    delta: 33,
    affected: ["7 attack paths", "2 trust boundaries", "1 critical application"],
    controls: ["Compensating control", "Temporary expiry", "Approval gate"],
  },
];

const timeline = [
  ["NOW", "Current best-known state"],
  ["-24H", "Validated historical state"],
  ["-7D", "Prior validated state"],
];

export default function SecurityDecisionTwin() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [mode, setMode] = useState<"forecast" | "history">("forecast");
  const [tracked, setTracked] = useState("Agent Reach");
  const scenario = useMemo(() => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0], [scenarioId]);

  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,.10),transparent_42%),linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.012))] shadow-[0_30px_90px_rgba(0,0,0,.28)]">
      <div className="border-b border-[var(--border)] px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]"><BrainCircuit className="h-3.5 w-3.5" /> Decision Advantage Engine</div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Security Time Machine + Counterfactual Twin</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--muted)]">Ask what happens before the action happens. ELITZE evaluates a bounded copy of the known security graph and separates forecast, observed evidence, and historical state.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("forecast")} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${mode === "forecast" ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>Forecast</button>
            <button type="button" onClick={() => setMode("history")} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${mode === "history" ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>History</button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_.9fr]">
        <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Scenario staging</div>
            <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]"><Zap className="h-3.5 w-3.5 text-[var(--accent)]" /> SIMULATED ONLY</div>
          </div>
          <div className="mt-4 space-y-2">
            {scenarios.map((item) => (
              <button key={item.id} type="button" onClick={() => setScenarioId(item.id)} className={`w-full rounded-2xl border p-4 text-left transition ${scenario.id === item.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--panel-strong)]"}`}>
                <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">{item.title}</div><div className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.summary}</div></div><Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" /></div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-black/10 px-2 py-1 text-[9px] font-mono font-semibold text-[var(--muted)]"><span>{item.action}</span><ArrowRight className="h-3 w-3" /></div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]"><Gauge className="h-3.5 w-3.5" /> Risk delta</div><div className="mt-3 font-mono text-2xl font-bold text-[var(--accent)]">+{scenario.delta}</div><div className="mt-1 text-[9px] text-[var(--muted)]">Forecasted graph pressure</div></div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]"><Waypoints className="h-3.5 w-3.5" /> Paths affected</div><div className="mt-3 font-mono text-2xl font-bold">{scenario.affected[0].split(" ")[0]}</div><div className="mt-1 text-[9px] text-[var(--muted)]">Primary exposure expansion</div></div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--muted)]"><ShieldCheck className="h-3.5 w-3.5" /> Control options</div><div className="mt-3 font-mono text-2xl font-bold">{scenario.controls.length}</div><div className="mt-1 text-[9px] text-[var(--muted)]">Available interruptions</div></div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]"><Eye className="h-3.5 w-3.5 text-[var(--accent)]" /> {mode === "forecast" ? "Forecast impact" : "Historical reconstruction"}</div>
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-start justify-between gap-4"><div><div className="text-lg font-bold">{tracked}</div><div className="mt-1 text-xs text-[var(--muted)]">Tracked investigative subject</div></div><button type="button" onClick={() => setTracked(tracked === "Agent Reach" ? "Production Data" : "Agent Reach")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold">Switch target</button></div>
            <div className="mt-5 space-y-2">
              {scenario.affected.map((line) => <div key={line} className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2.5 text-xs"><AlertTriangle className="h-3.5 w-3.5 text-[var(--accent)]" />{line}</div>)}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4"><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Safest interruption set</div><div className="mt-3 space-y-2">{scenario.controls.map((control) => <div key={control} className="flex items-center gap-2 text-xs"><ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />{control}</div>)}</div></div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]"><History className="h-3.5 w-3.5" /> Security timeline</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {timeline.map(([label, detail]) => <button key={label} type="button" className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-left hover:bg-[var(--panel-strong)]"><div className="font-mono text-[10px] font-bold">{label}</div><div className="mt-1 text-[10px] leading-4 text-[var(--muted)]">{detail}</div></button>)}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]"><span className="rounded-full border border-[var(--border)] px-2.5 py-1">OBSERVED ≠ INFERRED</span><span className="rounded-full border border-[var(--border)] px-2.5 py-1">SIMULATED ≠ REAL</span><span className="rounded-full border border-[var(--border)] px-2.5 py-1">NO SYNTHETIC TELEMETRY</span></div>
        </div>
      </div>
    </section>
  );
}
