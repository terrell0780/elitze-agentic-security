import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Braces,
  Database,
  Fingerprint,
  Gauge,
  KeyRound,
  LockKeyhole,
  Network,
  Power,
  Radar,
  Scale,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react";

const pillars = [
  [Network, "Security Graph", "Discover identities, agents, tools, services, data paths and relationships as one security graph."],
  [Radar, "Security Intelligence", "Correlate vulnerability, identity, runtime and agent activity into actionable security context."],
  [Scale, "Policy Engine", "Evaluate every sensitive action against explicit identity, purpose, capability and data policy."],
  [ShieldCheck, "Guardrails", "Enforce controls before high-risk tool execution instead of relying on downstream review."],
  [LockKeyhole, "Sandbox", "Route untrusted execution through isolated infrastructure with controlled egress and credentials."],
  [Power, "Kill Switch", "Persist a containment request and invoke a separately authorized executor when isolation is required."],
];

const capabilities = [
  [Fingerprint, "Non-human identity", "Purpose-bound identities and least-privilege capability decisions."],
  [Braces, "MCP security", "Brokered tool access, input validation and scoped capabilities for MCP-connected systems."],
  [TerminalSquare, "CI/CD security", "Policy checks and security gates that can run before deployment."],
  [Database, "Evidence", "Persist decisions, enforcement events and security records for later investigation."],
  [KeyRound, "BYOK / BYOP", "Keep provider credentials and sensitive infrastructure keys under customer control."],
  [Bot, "Agent security", "Treat agent actions as governed security events with independent authorization."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="sticky top-0 z-50 border-b border-red-900/30 bg-[#07040a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE Agentic Security home">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-red-400/40 bg-red-500/10 text-red-300 shadow-[0_0_28px_rgba(239,68,68,0.18)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide text-white">ELITZE</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-red-300">Agentic Security</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <Link href="/platform" className="transition hover:text-white">Platform</Link>
            <Link href="/security" className="transition hover:text-white">Security</Link>
            <Link href="/use-cases" className="transition hover:text-white">Use cases</Link>
            <Link href="/console" className="transition hover:text-white">Console</Link>
          </nav>
          <Link href="/console" className="group flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20">
            Open Console
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-red-950/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.16),transparent_42%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
              Security control plane
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Security enforcement for the agentic stack.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              ELITZE · Agentic Security governs identity, policy, tool access, runtime behavior and containment around AI agents and the systems they can reach.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/console" className="group inline-flex items-center gap-2 rounded-lg bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(239,68,68,0.22)] transition hover:bg-red-400">
                Enter the console
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link href="/security" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-red-500/30 hover:bg-white/[0.06]">
                See the security model
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">No synthetic telemetry is shown as live production data.</p>
          </div>

          <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-5 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between border-b border-red-950/60 pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Workflow className="h-4 w-4 text-red-300" />
                Enforcement path
              </div>
              <span className="font-mono text-[10px] text-slate-500">ELITZE</span>
            </div>
            <div className="space-y-3 pt-4">
              {[
                "Identity established",
                "Purpose and capability evaluated",
                "Policy decision persisted",
                "Tool execution permitted or blocked",
                "Containment available for escalated events",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red-500/30 bg-red-500/10 font-mono text-xs text-red-300">{index + 1}</span>
                  <span className="text-sm text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Platform</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">One security model across the agent boundary.</h2>
          <p className="mt-4 text-slate-400">The platform separates policy and security decisions from the agent itself, so authorization does not depend on the model behaving correctly.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pillars.map(([Icon, title, description]) => {
            const C = Icon as typeof Network;
            return (
              <article key={title as string} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6 transition hover:border-red-500/25 hover:bg-red-500/[0.04]">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
                  <C className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="capabilities" className="border-y border-red-950/40 bg-[#0a0509]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">Capabilities</p>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Designed to operate, not merely observe.</h2>
              <p className="mt-4 text-slate-400">ELITZE keeps the security boundary outside the model and records the decision path around every governed action.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {capabilities.map(([Icon, title, description]) => {
                const C = Icon as typeof ShieldCheck;
                return (
                  <div key={title as string} className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                      <C className="h-4 w-4 text-red-300" />
                      <h3 className="text-sm font-semibold text-white">{title as string}</h3>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{description as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            [Gauge, "Decide", "A security decision is evaluated before a governed action is allowed to proceed."],
            [Workflow, "Record", "The decision and enforcement event can be persisted for investigation and evidence."],
            [Power, "Contain", "A separately authorized executor can isolate infrastructure when a containment request is raised."],
          ].map(([Icon, title, description]) => {
            const C = Icon as typeof Gauge;
            return (
              <div key={title as string} className="rounded-2xl border border-red-900/30 bg-[#0c060c] p-6">
                <C className="h-6 w-6 text-red-300" />
                <div className="mt-4 text-lg font-semibold text-white">{title as string}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-red-950/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>ELITZE · Agentic Security</span>
          <div className="flex items-center gap-5">
            <Link href="/platform" className="transition hover:text-white">Platform</Link>
            <Link href="/security" className="transition hover:text-white">Security</Link>
            <Link href="/use-cases" className="transition hover:text-white">Use cases</Link>
            <Link href="/console" className="transition hover:text-white">Console</Link>
            <Link href="/api/health" className="transition hover:text-white">Health</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}