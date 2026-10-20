import Image from "next/image";
import Link from "next/link";
import { FileCheck2, Fingerprint, KeyRound, Lock, Power, Scale, ShieldCheck, Workflow } from "lucide-react";

export const metadata = {
  title: "Security Architecture | ELITZE Agentic Security",
  description: "ELITZE security architecture for agent identity, policy enforcement, runtime controls and evidence.",
  alternates: { canonical: "/security" },
};

const controls = [
  [Fingerprint, "Identity isolation", "Governed actions carry a tenant-scoped workload identity."],
  [Scale, "Policy enforcement", "Sensitive actions are evaluated against explicit policy before execution."],
  [KeyRound, "Credential boundaries", "Secrets and credentials stay outside the agent context and are brokered under controlled infrastructure."],
  [Workflow, "Tool governance", "Tool and protocol requests are treated as authorization decisions, not trusted instructions."],
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
          <div className="flex items-center gap-2"><Link href="/platform" className="rounded-lg px-3 py-2 text-xs text-[var(--muted)]">Platform</Link><Link href="/workspace" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950">Open workspace</Link></div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-4xl">
            <div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">Security control plane</div>
            <h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">The security boundary stays outside the agent.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE connects identity, reachability, policy, authorized execution, runtime observation, remediation and evidence without pretending missing telemetry is real.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/workspace" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Open workspace</Link>
              
            </div>
          </div>
          <div className="mt-10 overflow-hidden rounded-[30px] border border-[var(--accent-border)] bg-black/20 shadow-[0_30px_100px_rgba(0,0,0,.25)]">
            <Image src="/elitze-command-plane.svg" alt="ELITZE control plane architecture: discovery, governance, validation and evidence" width={1600} height={1000} sizes="100vw" priority className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Control surface</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Controls at the boundary.</h2></div><span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[var(--accent)]">Evidence-gated</span></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{controls.map(([Icon, title, description]) => { const C = Icon as typeof Fingerprint; return <article key={title as string} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 transition hover:-translate-y-1 hover:border-[var(--accent-border)]"><C className="h-5 w-5 text-[var(--accent)]" /><h2 className="mt-4 text-lg font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description as string}</p></article>; })}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9"><div className="flex items-center gap-3"><Lock className="h-5 w-5 text-[var(--accent)]" /><h2 className="text-lg font-semibold">Defensive principles</h2></div><div className="mt-6 space-y-3">{principles.map((p) => <div key={p} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm leading-6 text-[var(--muted-strong)]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />{p}</div>)}</div></div>
          <div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Operational loop</div><h2 className="mt-3 text-2xl font-black">Discover → Evaluate → Enforce → Record → Verify.</h2><p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">External intelligence and customer infrastructure supply inputs; they do not replace the ELITZE decision and evidence boundary.</p><div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 font-mono text-xs text-[var(--muted-strong)]">identity → policy → authorization → execution → evidence → retest</div></div>
        </div>
      </section>
    </main>
  );
}
