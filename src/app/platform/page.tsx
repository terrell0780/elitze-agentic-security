import Link from "next/link";
import { ArrowRight, Bot, Cloud, Code2, Database, Eye, Fingerprint, Globe2, KeyRound, Network, Radar, ShieldCheck, Siren, Workflow, Zap } from "lucide-react";

export const metadata = {
  title: "Platform | ELITZE · Agentic Security",
  description: "ELITZE · Agentic Security: unified AI security, enterprise SecOps, exposure management, identity, data, cloud and REO controls.",
};

const domains = [
  [Bot, "AI Security Gateway", "Inline LLM, MCP, A2A, API, browser and SaaS agent control with identity, policy, safety, runtime security and observability."],
  [Radar, "AI Discovery & Posture", "Discover AI applications, models, agents, shadow AI, risky configurations and unmanaged execution paths."],
  [ShieldCheck, "Security Operations", "SIEM, XDR, EDR, NDR, UEBA, threat intelligence, detection, investigation, hunting and response workflows."],
  [Cloud, "Cloud & Application Security", "CNAPP coverage spanning CSPM, CWPP, CIEM, IaC, containers, serverless and application/runtime risk."],
  [Fingerprint, "Identity Security", "Human, workload and agent identity, privilege, continuous authorization, delegation and identity threat response."],
  [Database, "Data Security", "Data discovery, classification, DSPM, DLP, sensitive-data pathways and policy enforcement across AI and enterprise systems."],
  [Globe2, "Exposure Management", "External attack surface, assets, vulnerabilities, CVE/KEV/EPSS, attack paths, business impact and remediation priority."],
  [Code2, "Application & Supply Chain", "API security, OpenAPI governance, code controls, dependencies, SBOM-oriented component inventory and artifact provenance."],
  [Network, "Network & Collaboration", "Network telemetry, secure access controls, SaaS posture and email/collaboration threat signals through integrations."],
  [Workflow, "SOAR & Automated Response", "Governed playbooks for isolation, revoke, block, disable, quarantine, rollback and recovery with approval boundaries."],
  [Eye, "Unified Security Data Fabric", "Normalize telemetry from AI, endpoint, identity, cloud, network, applications and third-party controls into one security context."],
  [Zap, "Continuous Validation", "Authorized red-team campaigns, control testing, regression, attack-path simulation and evidence-backed verification."],
];

const principles = [
  [KeyRound, "Identity first", "Every human, workload and agent action has an explicit security identity and capability boundary."],
  [Siren, "Observed ≠ inferred", "ELITZE distinguishes observed evidence, inference, unknown state and unmeasurable state."],
  [ShieldCheck, "Enforcement, not theater", "Controls sit at generation, gateway and runtime boundaries rather than relying on dashboard-only visibility."],
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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">ELITZE Platform</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl">One security control plane for the agentic enterprise.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">ELITZE connects AI security, enterprise SecOps, exposure management, identity, data, cloud, application security and continuous validation around a common security graph and evidence layer.</p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {domains.map(([Icon, title, description]) => { const C = Icon as typeof Bot; return <article key={title as string} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6"><C className="h-5 w-5 text-red-300" /><h2 className="mt-4 text-lg font-semibold text-white">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></article>; })}
        </div>
        <section className="mt-16 rounded-2xl border border-red-900/40 bg-[#0c060c] p-8">
          <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Unified enforcement</p><h2 className="mt-3 text-2xl font-semibold text-white">The model is not the security boundary.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Requests can pass through the ELITZE AI Security Gateway before reaching models, MCP tools or other agents. Security context then follows the action through runtime, enterprise systems and response.</p></div>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {principles.map(([Icon, title, description]) => { const C = Icon as typeof KeyRound; return <div key={title as string} className="rounded-xl border border-white/8 bg-black/20 p-5"><C className="h-4 w-4 text-red-300" /><h3 className="mt-3 text-sm font-semibold text-white">{title as string}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{description as string}</p></div>; })}
          </div>
        </section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/security" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Security architecture</Link><Link href="/use-cases" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200">Use cases</Link><Link href="/console" className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white">Console</Link></div>
      </div>
    </main>
  );
}
