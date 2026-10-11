"use client";

import { FileSearch, Link2, ScanEye, ShieldAlert } from "lucide-react";
import { securityTruthStates } from "@/lib/agent-passports";

const icons = [ScanEye, FileSearch, Link2, ShieldAlert, ShieldAlert] as const;

export default function SecurityTruthPanel() {
  return (
    <section aria-labelledby="truth-state-heading" className="relative z-10 mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200/70">EVIDENCE GOVERNANCE</div>
          <h3 id="truth-state-heading" className="mt-2 text-lg font-bold">Every claim has a truth state.</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">A graph relationship or security finding is not confirmed merely because it appears in the interface. Trace each claim to its source, observation and evidence artifact.</p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/[.05] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[.14em] text-amber-200">No evidence · no claim</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {securityTruthStates.map((item, index) => {
          const Icon = icons[index] ?? ShieldAlert;
          return (
            <div key={item.state} className="rounded-xl border border-white/8 bg-white/[.02] p-3">
              <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-cyan-200/80" /><span className="text-[9px] font-bold tracking-[.1em] text-slate-200">{item.state}</span></div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">{item.meaning}</p>
            </div>
          );
        })}
      </div>
      <ol className="mt-4 grid gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-slate-400 sm:grid-cols-4">
        {["Claim", "Source", "Observation", "Evidence reference"].map((step, index) => (
          <li key={step} className="flex items-center gap-2 rounded-lg border border-white/8 px-3 py-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-cyan-100">{index + 1}</span>{step}
          </li>
        ))}
      </ol>
    </section>
  );
}
