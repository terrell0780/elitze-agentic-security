import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileCheck2, Fingerprint, KeyRound, Lock, Power, Scale, ShieldCheck, Workflow } from "lucide-react";

export const metadata = {
  title: "Security Architecture | ELITZE Agentic Security",
  description: "ELITZE security architecture for identity, policy enforcement, runtime control and evidence.",
  alternates: { canonical: "/security" },
};

const controls = [
  [Fingerprint, "Identity isolation", "Every governed action carries a tenant-scoped workload identity."],
  [Scale, "Policy enforcement", "Sensitive actions are evaluated against explicit policy before execution."],
  [KeyRound, "Credential boundaries", "Secrets and credentials stay outside the agent context and are brokered under controlled infrastructure."],
  [Workflow, "Tool governance", "Tool requests and protocol calls are treated as authorization decisions, not trusted instructions."],
  [FileCheck2, "Evidence", "Decision and enforcement records preserve the security path for investigation and retest."],
  [Power, "Containment", "Containment can be handed to a separately authorized executor for isolation or credential action."],
];

const principles = [
  "Fail closed when a security-critical dependency is unavailable.",
  "Never treat untrusted external content as policy instructions.",
  "Never represent an unimplemented control as active protection.",
  "Keep internal control credentials out of browser clients.",
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></div><span className="text-sm font-bold">ELITZE</span></Link>
          <div className="flex items-center gap-2"><Link href="/platform" className="hidden rounded-lg px-3 py-2 text-xs text-[var(--muted)] sm:inline-flex">Platform</Link><Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950">Open Console <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]"><div className="pointer-events-none absolute inset-0 hero-grid opacity-50" /><div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">Security architecture</div><h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">The security boundary stays outside the agent.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE is designed so authorization does not depend on a model, prompt or external result behaving safely. Dedicated controls govern the path and evidence records what happened.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950">View Console <ArrowRight className="h-4 w-4" /></Link><Link href="/platform" className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Platform controls</Link></div></div><div className="overflow-hidden rounded-[30px] border border-[var(--accent-border)] bg-black/20"><Image src="/elitze-security-reach-2026.svg" alt="ELITZE security reach architecture" width={1600} height={1000} className="h-auto w-full" /></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{controls.map(([Icon, title, description]) => { const C = Icon as typeof Fingerprint; return <article key={title as string} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent-border)]"><C className="h-5 w-5 text-[var(--accent)]" /><h2 className="mt-4 text-lg font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description as string}</p></article>; })}</div></section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18"><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9"><div className="flex items-center gap-3"><Lock className="h-5 w-5 text-[var(--accent)]" /><h2 className="text-lg font-semibold">Defensive principles</h2></div><div className="mt-6 space-y-3">{principles.map((p) => <div key={p} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm leading-6 text-[var(--muted-strong)]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />{p}</div>)}</div></div><div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Operational loop</div><h2 className="mt-3 text-2xl font-black">Discover → Evaluate → Enforce → Record → Verify.</h2><p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">External intelligence and customer infrastructure supply inputs; they do not replace the ELITZE decision and evidence boundary.</p><div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 font-mono text-xs text-[var(--muted-strong)]">identity → policy → authorization → execution → evidence → retest</div></div></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Security promise</div><h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black tracking-[-.04em] sm:text-5xl">Pentest every release. Govern every agent. Verify every fix.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">The public surface describes the control model; connected environments must supply the underlying evidence.</p></section>
    </main>
  );
}
