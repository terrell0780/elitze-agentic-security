import Link from "next/link";
import { ArrowRight, BrainCircuit, Database, Eye, FileCheck2, Radar, ShieldAlert, Workflow, Zap } from "lucide-react";

export const metadata = {
  title: "Mythos | ELITZE · Agentic Security",
  description: "Mythos is the governed executive orchestration layer for ELITZE security operations and intelligence workflows.",
};

const units = [
  [ShieldAlert, "SecOps", "Threat hunting, vulnerability analysis and incident-response routing."],
  [Eye, "Intelligence", "Authorized OSINT and investigative workflows with source provenance."],
  [Database, "Memory", "Knowledge and evidence routing with tenant-scoped persistence boundaries."],
  [FileCheck2, "Review", "Evidence and impact validation before high-risk action or publication."],
];

const controls = [
  [Radar, "Identity-bound", "Every Mythos task carries a tenant, actor and agent identity."],
  [Workflow, "Policy-gated", "Requests pass through the ELITZE gateway and policy engine."],
  [Zap, "Approval-aware", "High-impact actions stop for review instead of silently executing."],
  [BrainCircuit, "Auditable", "Plans and execution outcomes are written to the audit ledger."],
];

export default function MythosPage() {
  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="border-b border-red-950/40 bg-[#09050a]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold tracking-wide text-white">ELITZE <span className="text-red-300">· Agentic Security</span></Link>
          <Link href="/console" className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-100">Open Console <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Mythos orchestration</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">One governed brain for security work.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Mythos turns objectives into policy-checked security plans, routes work to specialized capability domains, and preserves evidence around every decision.</p>
        </div>

        <section className="mt-12 grid gap-4 lg:grid-cols-4">
          {units.map(([Icon, title, description]) => { const C = Icon as typeof ShieldAlert; return <article key={title as string} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6"><C className="h-5 w-5 text-red-300" /><h2 className="mt-4 text-lg font-semibold text-white">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></article>; })}
        </section>

        <section className="mt-8 rounded-2xl border border-red-900/40 bg-[#0c060c] p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Control path</p><h2 className="mt-2 text-2xl font-semibold text-white">Intake → Route → Policy → Evidence → Decision</h2></div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Governed</span>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {controls.map(([Icon, title, description]) => { const C = Icon as typeof Radar; return <div key={title as string} className="rounded-xl border border-white/8 bg-black/20 p-5"><C className="h-4 w-4 text-red-300" /><h3 className="mt-3 text-sm font-semibold text-white">{title as string}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{description as string}</p></div>; })}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current production boundary</p><p className="mt-3 text-sm leading-6 text-slate-300">The orchestration engine, task routing, policy gates, approval boundaries and audit records are implemented. External telemetry, response and persistent intelligence systems remain connector-bound until authorized production integrations are configured.</p></div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">API</p><code className="mt-3 block rounded-lg border border-white/8 bg-black/30 p-4 text-sm text-red-200">POST /api/mythos</code><p className="mt-3 text-sm leading-6 text-slate-400">Submit a typed objective and receive the governed plan, routing, decision and audit evidence reference.</p></div>
        </section>
      </div>
    </main>
  );
}
