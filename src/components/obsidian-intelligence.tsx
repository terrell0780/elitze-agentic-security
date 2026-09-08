"use client";

import { useState } from "react";
import { ArrowUpRight, BrainCircuit, FileCheck2, GitCommitHorizontal, Search, ShieldAlert } from "lucide-react";

const views = [
  {
    id: "evidence",
    label: "Evidence",
    title: "One chain from signal to proof",
    body: "Obsidian turns connected security records into an explainable evidence chain: source, relationship, decision, action and verification.",
  },
  {
    id: "attack",
    label: "Attack paths",
    title: "See the path, not the pile",
    body: "Follow the relationship between an asset, identity, agent, dependency and reachable control so the operator sees what can actually happen.",
  },
  {
    id: "memory",
    label: "Security memory",
    title: "Keep the context",
    body: "Preserve verified findings, decisions and retests as durable security context instead of forcing teams to reconstruct the story from tickets.",
  },
];

export default function ObsidianIntelligence() {
  const [active, setActive] = useState("evidence");
  const selected = views.find((view) => view.id === active) ?? views[0];

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-5 shadow-[0_24px_80px_rgba(0,0,0,.18)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent)]"><BrainCircuit className="h-3.5 w-3.5" /> Obsidian intelligence</div>
          <h2 className="mt-2 text-lg font-bold sm:text-xl">The memory layer behind every decision</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">Not another dashboard. A durable evidence view that helps operators understand why a decision exists and what changed after action.</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-right"><div className="font-mono text-[9px] text-[var(--muted)]">STATE</div><div className="text-xs font-semibold">Source-bound</div></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {views.map((view) => <button key={view.id} type="button" onClick={() => setActive(view.id)} className={`rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${active === view.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--panel)]"}`}>{view.label}</button>)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]"><span>{selected.title}</span><span className="font-mono">OBS-01</span></div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-strong)]">{selected.body}</p>
          <div className="relative mt-7 grid gap-3 md:grid-cols-5">
            {[
              [Search, "Signal"],
              [GitCommitHorizontal, "Context"],
              [ShieldAlert, "Decision"],
              [ArrowUpRight, "Action"],
              [FileCheck2, "Proof"],
            ].map(([Icon, label], index) => { const C = Icon as typeof Search; return <div key={label as string} className="relative rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-center">
              <C className="mx-auto h-4 w-4 text-[var(--accent)]" />
              <div className="mt-2 text-[10px] font-semibold">{label as string}</div>
              {index < 4 && <div className="absolute left-[calc(100%+2px)] top-1/2 hidden h-px w-3 bg-[var(--accent-border)] md:block" />}
            </div>; })}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5">
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Operator promise</div>
          <div className="mt-4 text-xl font-bold tracking-tight">Never ask, “Why is this green?”</div>
          <p className="mt-3 text-xs leading-5 text-[var(--muted-strong)]">Every meaningful posture state should resolve to evidence. When evidence is missing, ELITZE says so instead of filling the gap with a synthetic confidence score.</p>
          <div className="mt-6 flex items-center gap-2 text-[10px] font-semibold text-[var(--success)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" /> Evidence gate enabled</div>
        </div>
      </div>
    </div>
  );
}
