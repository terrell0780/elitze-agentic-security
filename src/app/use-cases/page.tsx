import Link from "next/link";
import { ArrowRight, Building2, Database, Eye, Fingerprint, GitBranch, ShieldCheck, Wrench } from "lucide-react";

export const metadata = {
  title: "Use Cases | ELITZE · Agentic Security",
  description: "How ELITZE · Agentic Security governs AI agents across security operations, software delivery, identity, runtime and enterprise systems.",
};

const cases = [
  [ShieldCheck, "Agent runtime security", "Enforce identity, purpose, capability and impact policy around agent actions and high-risk tool calls."],
  [Eye, "AI asset discovery", "Create an inventory of agents, tools, services and exposed paths so security teams can see what exists before evaluating risk."],
  [GitBranch, "Secure software delivery", "Run policy and security checks in CI/CD so risky capabilities can be stopped before production deployment."],
  [Fingerprint, "Non-human identity", "Bind machine and agent identities to explicit ownership, purpose and capabilities with least-privilege controls."],
  [Database, "Evidence and audit", "Persist security decisions and enforcement events for incident investigation, control review and evidence workflows."],
  [Wrench, "Containment operations", "Create an auditable containment request and delegate infrastructure isolation to a separately authorized executor."],
];

const industries = ["Financial services", "Healthcare", "Government", "SaaS and technology", "Manufacturing", "Retail and commerce", "Telecommunications", "Security operations"];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="border-b border-red-950/40 bg-[#09050a]"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"><Link href="/" className="text-sm font-semibold tracking-wide text-white">ELITZE <span className="text-red-300">· Agentic Security</span></Link><Link href="/console" className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-100">Open Console <ArrowRight className="h-4 w-4" /></Link></div></header>
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Use cases</p><h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">Security controls for systems that can act.</h1><p className="mt-6 text-lg leading-8 text-slate-300">ELITZE applies an explicit security model to the identities, tools, data and infrastructure an agent can reach.</p></div>
        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cases.map(([Icon, title, description]) => { const C = Icon as typeof ShieldCheck; return <article key={title as string} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6"><C className="h-5 w-5 text-red-300" /><h2 className="mt-4 text-lg font-semibold text-white">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></article>; })}</div>
        <section className="mt-14 rounded-2xl border border-red-900/40 bg-[#0c060c] p-8"><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-red-300" /><h2 className="text-xl font-semibold text-white">Enterprise environments</h2></div><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">The control model is intended for environments where agent actions touch regulated data, customer systems, production infrastructure, internal services or external side effects.</p><div className="mt-6 flex flex-wrap gap-2">{industries.map((industry) => <span key={industry} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">{industry}</span>)}</div></section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/platform" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Platform</Link><Link href="/security" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Security</Link><Link href="/console" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white">Console</Link></div>
      </div>
    </main>
  );
}
