import Link from "next/link";
import { ArrowRight, Bot, Check, Database, Fingerprint, KeyRound, LockKeyhole, Network, Radar, ShieldCheck, Workflow } from "lucide-react";

export const metadata = {
  title: "Platform | ELITZE · Agentic Security",
  description: "ELITZE Agentic Security: Agent Identity and MCP Runtime Security with real-data policy enforcement and evidence.",
};

const domains = [
  [Bot, "Agent + MCP Discovery", "Discover real agents, MCP servers, models and tools from authorized connected sources."],
  [Fingerprint, "Workload Identity", "Bind agents, MCP servers and tools to tenant-scoped workload identities with verifiable identity material."],
  [Network, "Reachability", "Map observed identity-to-tool, API, secret and data relationships without inventing unobserved reach."],
  [LockKeyhole, "Policy Enforcement", "Evaluate sensitive actions before execution with explicit allow, block or review decisions."],
  [ShieldCheck, "Authorized Execution", "Separate policy evaluation from execution so sensitive actions cross a separately authorized gateway boundary."],
  [Workflow, "Evidence + Retest", "Preserve decision evidence, observe the actual result and retest the affected path before closure."],
  [Database, "Sensitive Data Reach", "Track real observed paths from workload identities to protected data and secrets."],
  [Radar, "Runtime Observation", "Capture actual authorized runtime outcomes instead of presenting dashboard state as evidence."],
  [Check, "Production Truth", "No mock records, fake telemetry, synthetic metrics, simulated events or invented security outcomes."],
];

const principles = [
  [KeyRound, "Identity first", "Every sensitive action is bound to a tenant-scoped subject identity."],
  [LockKeyhole, "Policy before execution", "Sensitive tool and MCP actions are evaluated before they reach the execution boundary."],
  [ShieldCheck, "Evidence before closure", "A status change is not proof; the affected path must be observed and retested."],
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold tracking-wide">ELITZE <span className="text-[var(--accent)]">· Agentic Security</span></Link>
          <Link href="/console" className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2 text-sm text-[var(--accent)]">Open Console <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Initial category</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Agent Identity and MCP Runtime Security.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.</p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {domains.map(([Icon, title, description]) => { const C = Icon as typeof Bot; return <article key={title as string} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"><C className="h-5 w-5 text-[var(--accent)]" /><h2 className="mt-4 text-lg font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description as string}</p></article>; })}
        </div>
        <section className="mt-16 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-8">
          <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Real control path</p><h2 className="mt-3 text-2xl font-semibold">Discovery → identity → reach → policy → execution → evidence → retest.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Each operational claim must resolve to a real tenant-scoped record. When evidence is unavailable, ELITZE shows the missing state rather than manufacturing an operational result.</p></div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {principles.map(([Icon, title, description]) => { const C = Icon as typeof KeyRound; return <div key={title as string} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5"><C className="h-4 w-4 text-[var(--accent)]" /><h3 className="mt-3 text-sm font-semibold">{title as string}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description as string}</p></div>; })}
          </div>
        </section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/security" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">Security architecture</Link><Link href="/use-cases" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm">Use cases</Link><Link href="/console" className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950">Console</Link></div>
      </div>
    </main>
  );
}
