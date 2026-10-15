"use client";

import { useState } from "react";
import { ShieldCheck, Fingerprint, Clock3, FileCheck2, Bot } from "lucide-react";
import { agentPassports } from "@/lib/agent-passports";

function displayName(id: string, name: string) {
  return id === "ELITZE" ? "ELITZE Platform" : name;
}

export default function AgentPassportAtlas() {
  const [activeId, setActiveId] = useState(agentPassports[0]?.id ?? "");
  const selected = agentPassports.find((agent) => agent.id === activeId) ?? agentPassports[0];

  return (
    <section aria-labelledby="agent-passports-heading" className="relative border-t border-[var(--border)] bg-[var(--section)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16">
        <div className="max-w-3xl">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE AGENT GOVERNANCE</div>
          <h2 id="agent-passports-heading" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">ELITZE and Sara</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
            The platform and its security assistant. Declared capabilities describe their intended roles; live execution and authorization are shown only when supported by runtime evidence.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {agentPassports.map((agent) => {
            const active = selected?.id === agent.id;
            const isPlatform = agent.id === "ELITZE";
            return (
              <button
                key={agent.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveId(agent.id)}
                className={`rounded-2xl border p-5 text-left transition ${active ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--accent-border)]"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
                    {isPlatform ? <ShieldCheck className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </span>
                  <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[9px] font-semibold text-[var(--muted)]">Runtime not verified</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{displayName(agent.id, agent.name)}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{agent.role}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{agent.mission}</p>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Selected role</div>
                <h3 className="mt-2 text-lg font-semibold">{displayName(selected.id, selected.name)}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <Fingerprint className="h-4 w-4" />
                Declared role · runtime not verified
              </div>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Capability profile</h4>
                <ul className="mt-3 grid gap-2">
                  {selected.documentedCapabilities.map((capability) => (
                    <li key={capability} className="flex gap-2 text-sm leading-5 text-[var(--muted-strong)]">
                      <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />{capability}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                  <Clock3 className="h-4 w-4" /> Runtime evidence
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{selected.executionWindow}</p>
                <h4 className="mt-4 text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Authorization boundary</h4>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{selected.authorizationBoundary}</p>
              </div>
            </div>
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
          Evidence states remain precise internally: runtime state is UNKNOWN until a connected source verifies it. Missing telemetry is never presented as successful execution.
        </p>
      </div>
    </section>
  );
}
