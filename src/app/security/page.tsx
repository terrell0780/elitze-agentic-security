import Link from "next/link";
import { ArrowRight, FileCheck2, Fingerprint, KeyRound, Lock, Power, Scale, ShieldAlert, Workflow } from "lucide-react";

export const metadata = {
  title: "Security Architecture | ELITZE · Agentic Security",
  description: "ELITZE · Agentic Security defensive architecture for identity, policy enforcement, tool control, evidence and containment.",
};

const controls = [
  [Fingerprint, "Identity isolation", "Every governed action carries an actor identity. Agent identities are distinct from human identities and are subject to explicit purpose binding."],
  [Scale, "Policy enforcement", "The policy engine evaluates sensitive actions before execution using explicit action, resource, data and impact attributes."],
  [KeyRound, "Credential boundaries", "Secrets and credentials are kept outside the agent context and can be brokered under customer-controlled infrastructure."],
  [Workflow, "Tool governance", "Tool requests and protocol calls are treated as authorization decisions rather than trusted instructions."],
  [FileCheck2, "Evidence", "Accepted decisions and enforcement events are persisted so investigations can reconstruct what was requested and decided."],
  [Power, "Containment", "A containment request can be handed to a separately authorized executor for workload isolation or credential revocation."],
];

const principles = [
  "Fail closed when a security-critical dependency is missing.",
  "Never treat untrusted external content as policy instructions.",
  "Never represent an unimplemented control as active protection.",
  "Keep internal control credentials out of browser clients.",
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="border-b border-red-950/40 bg-[#09050a]"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"><Link href="/" className="text-sm font-semibold tracking-wide text-white">ELITZE <span className="text-red-300">· Agentic Security</span></Link><Link href="/console" className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-100">Open Console <ArrowRight className="h-4 w-4" /></Link></div></header>
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Security architecture</p><h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">A security boundary independent of agent reasoning.</h1><p className="mt-6 text-lg leading-8 text-slate-300">ELITZE is designed so authorization does not depend on an agent, model, prompt, or external result behaving safely. Security decisions are made by dedicated controls and recorded as operational evidence.</p></div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {controls.map(([Icon, title, description]) => { const C = Icon as typeof Fingerprint; return <article key={title as string} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6"><C className="h-5 w-5 text-red-300" /><h2 className="mt-4 text-lg font-semibold text-white">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></article>; })}
        </div>
        <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-7"><div className="flex items-center gap-3"><Lock className="h-5 w-5 text-red-300" /><h2 className="text-lg font-semibold text-white">Defensive principles</h2></div><ul className="mt-5 space-y-3">{principles.map((p) => <li key={p} className="flex gap-3 text-sm leading-6 text-slate-300"><ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-red-300" />{p}</li>)}</ul></div>
          <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-7"><h2 className="text-lg font-semibold text-white">Operational loop</h2><p className="mt-3 text-sm leading-6 text-slate-400">Discover → evaluate → enforce → record → contain → verify. External intelligence, runtime telemetry and customer infrastructure remain inputs to this control plane; they do not replace it.</p><div className="mt-6 rounded-xl border border-white/8 bg-black/20 p-4 font-mono text-xs text-slate-400">ELITZE security decision → persisted evidence → authorized containment path</div></div>
        </section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/platform" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Platform</Link><Link href="/use-cases" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Use cases</Link><Link href="/console" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white">Console</Link></div>
      </div>
    </main>
  );
}
