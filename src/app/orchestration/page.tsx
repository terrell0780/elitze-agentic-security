import Link from "next/link";
import { ArrowRight, BrainCircuit, Database, Eye, FileCheck2, Radar, ShieldAlert, Workflow, Zap } from "lucide-react";

export const metadata = {
  title: "ELITZE Orchestration | Agentic Security",
  description: "Governed orchestration for ELITZE security operations, intelligence workflows and evidence.",
  alternates: { canonical: "/orchestration" },
};

const units = [
  [ShieldAlert, "SecOps", "Threat hunting, vulnerability analysis and incident-response routing."],
  [Eye, "Intelligence", "Authorized investigative workflows with source provenance and evidence boundaries."],
  [Database, "Memory", "Knowledge and evidence routing with tenant-scoped persistence boundaries."],
  [FileCheck2, "Review", "Evidence and impact validation before high-risk action or publication."],
];

const controls = [
  [Radar, "Identity-bound", "Every task carries a tenant, actor and agent identity."],
  [Workflow, "Policy-gated", "Requests pass through the ELITZE gateway and policy engine."],
  [Zap, "Approval-aware", "High-impact actions stop for review instead of silently executing."],
  [BrainCircuit, "Auditable", "Plans and execution outcomes are written to the audit ledger."],
];

export default function OrchestrationPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold tracking-wide text-[var(--text)]">ELITZE <span className="text-[var(--accent)]">· Agentic Security</span></Link>
          <Link href="/console" className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">Open Console <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">ELITZE orchestration</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">One governed orchestration layer for security work.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE turns objectives into policy-checked security plans, routes work to capability domains, and preserves evidence around every decision.</p>
        </div>

        <section className="mt-12 grid gap-4 lg:grid-cols-4">
          {units.map(([Icon, title, description]) => { const C = Icon as typeof ShieldAlert; return <article key={title as string} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"><C className="h-5 w-5 text-[var(--accent)]" /><h2 className="mt-4 text-lg font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description as string}</p></article>; })}
        </section>

        <section className="mt-8 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Control path</p><h2 className="mt-2 text-2xl font-semibold">Intake → Route → Policy → Evidence → Decision</h2></div><span className="rounded-full border border-[var(--accent-border)] bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">Governed</span></div>
          <div className="mt-8 grid gap-3 md:grid-cols-4">{controls.map(([Icon, title, description]) => { const C = Icon as typeof Radar; return <div key={title as string} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5"><C className="h-4 w-4 text-[var(--accent)]" /><h3 className="mt-3 text-sm font-semibold">{title as string}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description as string}</p></div>; })}</div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Current production boundary</p><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">The orchestration engine, task routing, policy gates, approval boundaries and audit records are implemented. External telemetry, response and persistent intelligence systems remain connector-bound until authorized production integrations are configured.</p></div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">API</p><code className="mt-3 block rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm text-[var(--accent)]">POST /api/elitze</code><p className="mt-3 text-sm leading-6 text-[var(--muted)]">The underlying API remains compatibility-stable while the public product language uses ELITZE branding.</p></div>
        </section>
      </div>
    </main>
  );
}
