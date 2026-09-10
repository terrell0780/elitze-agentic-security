"use client";

import { useMemo, useState } from "react";
import { Eye, Layers3, Radar, Satellite, Shield, Split, Target, TimerReset } from "lucide-react";

const layers = [
  { id: "strategic", label: "STRATEGIC", detail: "Enterprise-wide security topology and business-critical concentration." },
  { id: "reach", label: "REACH", detail: "Agent, identity, tool, API and data reachability relationships." },
  { id: "coverage", label: "COVERAGE", detail: "Where telemetry, policies, detections, validation and evidence are present or missing." },
  { id: "exposure", label: "EXPOSURE", detail: "Attack paths, toxic combinations, choke points and blast radius." },
  { id: "activity", label: "ACTIVITY", detail: "Recent authorized security events and behavior changes." },
  { id: "evidence", label: "EVIDENCE", detail: "Observed, inferred, simulated, stale, unknown and unmeasurable state." },
  { id: "counterfactual", label: "COUNTERFACTUAL", detail: "Bounded simulation of a proposed change against a copied security graph." },
];

export default function GlobalSecurityCommandLayer() {
  const [active, setActive] = useState("strategic");
  const [orbit, setOrbit] = useState(true);
  const [scan, setScan] = useState(false);
  const [time, setTime] = useState("NOW");
  const [tracked, setTracked] = useState("HIGHEST-RISK SUBJECT");
  const current = useMemo(() => layers.find((item) => item.id === active) ?? layers[0], [active]);

  return (
    <div className="mt-7 overflow-hidden rounded-[24px] border border-[var(--border-strong)] bg-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"><Radar className="h-3.5 w-3.5" /> Command layer</div>
        <div className="flex flex-wrap items-center gap-2">
          {["NOW", "-24H", "-7D"].map((value) => <button key={value} type="button" onClick={() => setTime(value)} className={`rounded-lg border px-2.5 py-1.5 font-mono text-[9px] font-bold ${time === value ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>{value}</button>)}
          <button type="button" onClick={() => setOrbit(!orbit)} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold uppercase ${orbit ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>Orbit</button>
          <button type="button" onClick={() => setScan(!scan)} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold uppercase ${scan ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>Scan</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[.85fr_1.15fr]">
        <div className="border-b border-[var(--border)] p-4 lg:border-b-0 lg:border-r">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Sensors / layers</div>
          <div className="mt-3 space-y-2">
            {layers.map((layer) => <button key={layer.id} type="button" onClick={() => setActive(layer.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left ${active === layer.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel)]"}`}><div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[0.08em]">{layer.label}</span><Layers3 className={`h-3.5 w-3.5 ${active === layer.id ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} /></div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">{layer.detail}</p></button>)}
          </div>
        </div>

        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"><Satellite className="h-3.5 w-3.5" /> Orbital state</div><div className="mt-3 font-mono text-sm font-bold">{time} / {orbit ? "WIDE" : "FOCUSED"}</div><p className="mt-1 text-[9px] text-[var(--muted)]">Strategic context over the authorized enterprise security world.</p></div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"><Eye className="h-3.5 w-3.5" /> Observation mode</div><div className="mt-3 font-mono text-sm font-bold">{scan ? "ACTIVE SCAN" : "PASSIVE VIEW"}</div><p className="mt-1 text-[9px] text-[var(--muted)]">Scanning can only evaluate connected and authorized sources.</p></div>
          </div>

          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Active sensor</div><h3 className="mt-2 text-xl font-black tracking-tight">{current.label}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">{current.detail}</p></div><div className="rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-[9px] text-[var(--accent)]">{time}</div></div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {["HIGH-VALUE", "PRIVILEGED", "REACHABLE", "UNOBSERVED"].map((label, index) => <div key={label} className="rounded-xl border border-[var(--border)] bg-black/10 p-3"><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div><div className="mt-2 font-mono text-lg font-bold">{index === 3 ? "UNMEASURABLE" : "SOURCE-BOUND"}</div><div className="mt-1 text-[9px] text-[var(--muted)]">Resolved only from connected evidence</div></div>)}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]"><Target className="h-3.5 w-3.5" /> Tracking</div><button type="button" onClick={() => setTracked(tracked === "HIGHEST-RISK SUBJECT" ? "BUSINESS-CRITICAL ASSET" : "HIGHEST-RISK SUBJECT")} className="rounded-lg border border-[var(--accent-border)] px-2.5 py-1.5 text-[9px] font-bold">Switch</button></div><div className="mt-3 text-sm font-semibold">{tracked}</div><div className="mt-1 text-[9px] leading-4 text-[var(--muted-strong)]">Click-through tracking, history and relationship context are driven by the authorized security graph.</div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"><Split className="h-3.5 w-3.5" /> Counterfactual</div><div className="mt-2 text-xs font-semibold">What happens next?</div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">Stage an action against a copied graph before execution.</p></div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"><Shield className="h-3.5 w-3.5" /> Inversion</div><div className="mt-2 text-xs font-semibold">What removes the most risk?</div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">Find the smallest control change with the largest risk reduction.</p></div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"><TimerReset className="h-3.5 w-3.5" /> Time machine</div><div className="mt-2 text-xs font-semibold">Compare states</div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">See how the graph changed before and after a decision.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
