"use client";

import { useMemo, useState } from "react";
import { Eye, Layers3, Radar, Satellite, Shield, Target } from "lucide-react";

const layers = [
  { id: "identity", label: "IDENTITY", detail: "Observed agent, workload, MCP server and tool identities." },
  { id: "reach", label: "REACH", detail: "Observed identity-to-tool, API, secret and data reachability." },
  { id: "policy", label: "POLICY", detail: "Live policy decisions and enforcement boundaries." },
  { id: "activity", label: "ACTIVITY", detail: "Recent authorized security events and runtime behavior." },
  { id: "evidence", label: "EVIDENCE", detail: "Observed evidence, unknowns and unmeasurable state." },
  { id: "retest", label: "RETEST", detail: "Evidence from authorized validation of the affected path." },
];

export default function GlobalSecurityCommandLayer() {
  const [active, setActive] = useState("identity");
  const [orbit, setOrbit] = useState(true);
  const [scan, setScan] = useState(false);
  const current = useMemo(() => layers.find((item) => item.id === active) ?? layers[0], [active]);

  return (
    <div className="mt-7 overflow-hidden rounded-[24px] border border-[var(--border-strong)] bg-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"><Radar className="h-3.5 w-3.5" /> Command layer</div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setOrbit(!orbit)} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold uppercase ${orbit ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>Orbit</button>
          <button type="button" onClick={() => setScan(!scan)} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold uppercase ${scan ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"}`}>Observe</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[.85fr_1.15fr]">
        <div className="border-b border-[var(--border)] p-4 lg:border-b-0 lg:border-r">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Live control layers</div>
          <div className="mt-3 space-y-2">
            {layers.map((layer) => <button key={layer.id} type="button" onClick={() => setActive(layer.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left ${active === layer.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel)]"}`}><div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[0.08em]">{layer.label}</span><Layers3 className={`h-3.5 w-3.5 ${active === layer.id ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} /></div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">{layer.detail}</p></button>)}
          </div>
        </div>

        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"><Satellite className="h-3.5 w-3.5" /> View</div><div className="mt-3 font-mono text-sm font-bold">{orbit ? "WIDE" : "FOCUSED"}</div><p className="mt-1 text-[9px] text-[var(--muted)]">Visual context only; operational state comes from authorized records.</p></div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"><Eye className="h-3.5 w-3.5" /> Observation</div><div className="mt-3 font-mono text-sm font-bold">{scan ? "REQUESTED" : "READY"}</div><p className="mt-1 text-[9px] text-[var(--muted)]">No event is displayed unless it comes from a connected authorized source.</p></div>
          </div>

          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Active layer</div><h3 className="mt-2 text-xl font-black tracking-tight">{current.label}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">{current.detail}</p></div><div className="rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-[9px] text-[var(--accent)]">LIVE DATA ONLY</div></div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {["IDENTITY", "REACH", "POLICY", "EVIDENCE"].map((label) => <div key={label} className="rounded-xl border border-[var(--border)] bg-black/10 p-3"><div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</div><div className="mt-2 font-mono text-sm font-bold">SOURCE-BOUND</div><div className="mt-1 text-[9px] text-[var(--muted)]">Resolved only from connected evidence</div></div>)}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]"><Target className="h-3.5 w-3.5" /> Evidence boundary</div>
            <div className="mt-3 text-sm font-semibold">No record, no claim.</div>
            <div className="mt-1 text-[9px] leading-4 text-[var(--muted-strong)]">Missing telemetry remains missing. A decision can only be represented as operational when the underlying request, policy evaluation, authorization, observation and evidence records exist.</div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"><Shield className="h-3.5 w-3.5" /> Enforcement</div><div className="mt-2 text-xs font-semibold">Policy before execution</div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">Sensitive tool execution requires a live policy decision and authorized execution path.</p></div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"><div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Verification</div><div className="mt-2 text-xs font-semibold">Retest before closure</div><p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">A risk condition is not considered removed until the affected path is retested and evidence is retained.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
