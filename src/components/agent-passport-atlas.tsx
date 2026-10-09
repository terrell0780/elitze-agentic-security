"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Search, Clock3, Fingerprint, CircleHelp, FileCheck2 } from "lucide-react";
import { agentPassports, type AgentDivision } from "@/lib/agent-passports";

const divisions: Array<"ALL" | AgentDivision> = ["ALL", "OFFENSIVE", "DEFENSIVE", "OPERATIONS"];

export default function AgentPassportAtlas() {
  const [division, setDivision] = useState<(typeof divisions)[number]>("ALL");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(agentPassports[0]?.id ?? "");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agentPassports.filter((agent) =>
      (division === "ALL" || agent.division === division) &&
      (!q || [agent.id, agent.name, agent.role, agent.mission, ...agent.documentedCapabilities].join(" ").toLowerCase().includes(q)),
    );
  }, [division, query]);
  const selected = filtered.find((agent) => agent.id === activeId) ?? filtered[0];

  return (
    <section aria-labelledby="agent-passports-heading" className="relative border-t border-[var(--border)] bg-[var(--section)]">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE // AGENT GOVERNANCE</div>
            <h2 id="agent-passports-heading" className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">Agent Passports</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">A 24-role ELITZE design catalog for scoped security work. A passport is not proof that an agent is deployed, authorized by a live policy engine, or has executed successfully.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/[.06] px-3 py-2 text-[9px] font-bold uppercase tracking-[.14em] text-amber-200">
            <CircleHelp className="h-3.5 w-3.5" /> Runtime status UNKNOWN
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <span className="sr-only">Search agent passports</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agent, mission or capability" className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {divisions.map((item) => (
              <button key={item} type="button" onClick={() => setDivision(item)} aria-pressed={division === item} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-bold tracking-[.12em] transition ${division === item ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)]"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((agent) => (
              <button key={agent.id} type="button" onClick={() => setActiveId(agent.id)} aria-pressed={selected?.id === agent.id} className={`rounded-2xl border p-4 text-left transition ${selected?.id === agent.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--accent-border)]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] text-[var(--accent)]"><Fingerprint className="h-4 w-4" /></span>
                  <span className="rounded-full border border-amber-400/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[.1em] text-amber-200">UNKNOWN runtime</span>
                </div>
                <div className="mt-4 font-mono text-xs font-bold">{agent.id}</div>
                <div className="mt-1 text-sm font-bold">{agent.role}</div>
                <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-[var(--muted)]">{agent.mission}</p>
                <div className="mt-4 flex items-center justify-between gap-2 text-[8px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">
                  <span>{agent.division}</span><span>DECLARED catalog</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="rounded-2xl border border-[var(--border)] p-6 text-sm text-[var(--muted)]">No agent passports match this filter.</div>}
          </div>

          {selected && <aside className="rounded-3xl border border-[var(--accent-border)] bg-[#05080d] p-5 text-white sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200/70">AGENT PASSPORT</div>
                <h3 className="mt-2 text-xl font-black">{selected.id}</h3>
                <p className="mt-1 text-sm text-slate-400">{selected.role} · {selected.division}</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-cyan-200" />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">{selected.mission}</p>
            <div className="mt-5">
              <div className="text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">Documented capability profile</div>
              <ul className="mt-2 grid gap-2">
                {selected.documentedCapabilities.map((capability) => <li key={capability} className="flex gap-2 text-xs leading-5 text-slate-300"><FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200/70" />{capability}</li>)}
              </ul>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
              <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Execution window</div>
              <p className="mt-2 text-xs leading-5 text-slate-300">{selected.executionWindow}</p>
              <div className="mt-4 text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">Authorization boundary</div>
              <p className="mt-2 text-xs leading-5 text-slate-300">{selected.authorizationBoundary}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 p-3"><div className="text-[8px] uppercase tracking-[.14em] text-slate-500">Catalog truth</div><div className="mt-1 text-xs font-bold text-cyan-100">{selected.catalogTruthState}</div></div>
              <div className="rounded-xl border border-amber-300/20 p-3"><div className="text-[8px] uppercase tracking-[.14em] text-slate-500">Runtime truth</div><div className="mt-1 text-xs font-bold text-amber-200">{selected.runtimeTruthState}</div></div>
            </div>
          </aside>}
        </div>

        <p className="mt-5 max-w-4xl text-[10px] leading-5 text-[var(--muted)]">ELITZE governance note: this is a role catalog, not a runtime inventory. Agent deployment, active permissions, execution windows and successful runs remain UNKNOWN until verified by live policy and execution evidence.</p>
      </div>
    </section>
  );
}
