import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, Check, Database, Fingerprint, KeyRound, LockKeyhole, Network, Radar, ShieldCheck, Workflow } from "lucide-react";

export const metadata = {
  title: "Platform | ELITZE Agentic Security",
  description: "ELITZE Agent Identity and MCP Runtime Security with evidence-backed policy enforcement.",
  alternates: { canonical: "/platform" },
};

const domains = [
  [Bot, "Agent + MCP Discovery", "Discover real agents, MCP servers, models and tools from authorized connected sources."],
  [Fingerprint, "Workload Identity", "Bind agents, MCP servers and tools to tenant-scoped workload identities."],
  [Network, "Reachability", "Map observed identity-to-tool, API, secret and data relationships without inventing reach."],
  [LockKeyhole, "Policy Enforcement", "Evaluate sensitive actions before execution with explicit decisions."],
  [ShieldCheck, "Authorized Execution", "Separate policy evaluation from execution at the authorized boundary."],
  [Workflow, "Evidence + Retest", "Preserve decision evidence, observe the actual result and retest before closure."],
  [Database, "Sensitive Data Reach", "Track observed paths from workload identities to protected data and secrets."],
  [Radar, "Runtime Observation", "Capture actual runtime outcomes instead of presenting dashboard state as evidence."],
  [Check, "Production Truth", "No mock records, fake telemetry, synthetic metrics, simulated events or invented outcomes."],
];

const principles = [
  [KeyRound, "Identity first", "Sensitive actions stay bound to a tenant-scoped subject identity."],
  [LockKeyhole, "Policy before execution", "Sensitive tool and MCP actions cross policy before the execution boundary."],
  [ShieldCheck, "Evidence before closure", "A status change is not proof; the affected path must be observed and retested."],
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></div><span className="text-sm font-bold">ELITZE</span></Link><div className="flex items-center gap-2"><Link href="/security" className="hidden rounded-lg px-3 py-2 text-xs text-[var(--muted)] sm:inline-flex">Security</Link><Link href="/console/pentesting" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950">Validate release <ArrowRight className="h-4 w-4" /></Link></div></div></header>

      <section className="relative overflow-hidden border-b border-[var(--border)]"><div className="pointer-events-none absolute inset-0 hero-grid opacity-50" /><div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><div className="max-w-4xl"><div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">AI security control plane</div><h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">Discover the agent. Control the path. Prove the fix.</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE connects discovery, identity, reachability, policy enforcement, authorized execution, runtime validation and evidence around the actions AI systems actually take.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950">Open Control Plane <ArrowRight className="h-4 w-4" /></Link><Link href="/sales" className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Enterprise / Acquisition</Link></div></div><div className="mt-10 overflow-hidden rounded-[30px] border border-[var(--accent-border)] bg-black/20 shadow-[0_30px_100px_rgba(0,0,0,.25)]"><Image src="/elitze-command-plane.svg" alt="ELITZE AI security control plane architecture" width={1600} height={1000} priority className="h-auto w-full" /></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Platform domains</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">A control path, not a dashboard.</h2></div><span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[var(--accent)]">Source-bound</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{domains.map(([Icon, title, description]) => { const C = Icon as typeof Bot; return <article key={title as string} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent-border)]"><C className="h-5 w-5 text-[var(--accent)]" /><h2 className="mt-4 text-lg font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description as string}</p><div className="mt-6 h-px w-9 bg-[var(--accent)] transition-all group-hover:w-16" /></article>; })}</div></section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]"><div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Control sequence</div><h2 className="mt-3 text-2xl font-black sm:text-3xl">The product is the security loop.</h2><p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">Discovery, identity, reachability, policy, authorized execution, runtime observation, adversarial validation, retest and evidence stay connected.</p><div className="mt-6 font-mono text-xs leading-7 text-[var(--muted-strong)]">discover → identify → map → decide → authorize → observe → attack → retest → prove</div></div><div className="grid gap-3 sm:grid-cols-3">{principles.map(([Icon, title, description]) => { const C = Icon as typeof KeyRound; return <div key={title as string} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><C className="h-4 w-4 text-[var(--accent)]" /><h3 className="mt-3 text-sm font-semibold">{title as string}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description as string}</p></div>; })}</div></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Validation layer</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Security testing is part of the product surface.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">Authorized pentest requests, red-team release testing, attack-path validation and evidence integrity are represented in the security skill registry. Actual test completion remains evidence-gated.</p><Link href="/console/pentesting" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Open validation workbench <ArrowRight className="h-4 w-4" /></Link></div><div className="overflow-hidden rounded-[28px] border border-[var(--accent-border)] bg-black/20"><Image src="/elitze-security-validation.svg" alt="ELITZE security validation lifecycle" width={1600} height={900} className="h-auto w-full" /></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Production rule</div><h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-[-.04em] sm:text-5xl">No evidence, no production claim.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Connected integrations must supply the records behind inventory, decisions, runtime outcomes and verification.</p></section>
    </main>
  );
}
