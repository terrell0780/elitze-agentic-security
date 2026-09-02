import Link from "next/link";
import { ArrowRight, Braces, Database, Fingerprint, LockKeyhole, Network, Power, Radar, Scale, ShieldCheck, TerminalSquare } from "lucide-react";

export const metadata = {
  title: "Platform | ELITZE · Agentic Security",
  description: "ELITZE · Agentic Security platform architecture: identity, security graph, policy, guardrails, sandbox, evidence and containment.",
};

const layers = [
  [Network, "Security Graph", "Map identities, agents, tools, services, data paths and security relationships in one operational graph."],
  [Radar, "Security Intelligence", "Correlate vulnerability, identity, runtime and agent events into investigation-ready context."],
  [Scale, "Policy Engine", "Evaluate governed actions against identity, purpose, capability, privilege, data classification and impact."],
  [ShieldCheck, "Guardrails", "Apply security controls before sensitive tool execution so the enforcement point is upstream of the action."],
  [LockKeyhole, "Sandbox", "Route untrusted execution through customer-controlled isolation, egress restrictions and credential brokering."],
  [Power, "Containment", "Record containment requests and hand them to a separately authorized infrastructure executor."],
];

const controls = [
  [Fingerprint, "Identity", "Human and non-human identities remain distinct from the agent's reasoning process."],
  [Braces, "Tool control", "Tool and protocol requests are treated as governed security events, not trusted instructions."],
  [TerminalSquare, "CI/CD", "Security checks can run before release and deployment workflows."],
  [Database, "Evidence", "Security decisions and enforcement events are persisted for investigation and evidence."],
];

export default function PlatformPage() {
  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="border-b border-red-950/40 bg-[#09050a]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold tracking-wide text-white">ELITZE <span className="text-red-300">· Agentic Security</span></Link>
          <Link href="/console" className="inline-flex items-center gap-2 rounded-lg border border-red-500/35 bg-red-500/10 px-4 py-2 text-sm text-red-100">Open Console <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Platform</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">Security controls around the agent boundary.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">ELITZE separates authorization, policy, credentials, evidence and containment from the agent itself. The agent can request an action; the security plane determines whether that action is allowed to proceed.</p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {layers.map(([Icon, title, description]) => {
            const C = Icon as typeof Network;
            return <article key={title as string} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6"><C className="h-5 w-5 text-red-300" /><h2 className="mt-4 text-lg font-semibold text-white">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></article>;
          })}
        </div>
        <section className="mt-16 rounded-2xl border border-red-900/40 bg-[#0c060c] p-8">
          <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Control boundary</p><h2 className="mt-3 text-2xl font-semibold text-white">The model is never the security boundary.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Identity, capability, data access, credentials, network policy, sandboxing and containment remain independently enforceable.</p></div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {controls.map(([Icon, title, description]) => { const C = Icon as typeof Fingerprint; return <div key={title as string} className="rounded-xl border border-white/8 bg-black/20 p-5"><C className="h-4 w-4 text-red-300" /><h3 className="mt-3 text-sm font-semibold text-white">{title as string}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{description as string}</p></div>; })}
          </div>
        </section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/security" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Security architecture</Link><Link href="/use-cases" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Use cases</Link><Link href="/console" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white">Console</Link></div>
      </div>
    </main>
  );
}
