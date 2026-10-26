import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Fingerprint,
  GitBranch,
  KeyRound,
  Layers3,
  LockKeyhole,
  Network,
  Play,
  Radar,
  ScanSearch,
  Shield,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import SiteFooter from "@/components/home/site-footer";
import InteractiveProductHub from "@/components/home/interactive-product-hub";
import SiteHeader from "@/components/home/site-header";

export const metadata = {
  title: "Agentic security with proof | ELITZE",
  description:
    "ELITZE helps security teams discover AI agents, govern MCP and tool access, enforce policy before execution, and prove the fix with source-bound evidence.",
  alternates: { canonical: "/" },
};

const controlSteps = [
  {
    number: "01",
    icon: ScanSearch,
    title: "Discover the surface",
    description: "Find agents, MCP servers, tools, APIs, identities, and sensitive resources from connected evidence.",
  },
  {
    number: "02",
    icon: Network,
    title: "Map the path",
    description: "See which workload can reach what, with an explicit distinction between observed and unverified relationships.",
  },
  {
    number: "03",
    icon: LockKeyhole,
    title: "Control the action",
    description: "Evaluate high-impact tool calls and sensitive execution against tenant-scoped policy before they run.",
  },
  {
    number: "04",
    icon: BadgeCheck,
    title: "Prove the fix",
    description: "Preserve the decision, runtime result, remediation, approval, and retest as an evidence record.",
  },
];

const roleCards = [
  [ShieldCheck, "Security teams", "Turn agent and runtime risk into an investigation queue with owners, decisions, and proof."],
  [Bot, "AI platform owners", "Set safe boundaries for agents, MCP servers, and tools without slowing useful automation."],
  [GitBranch, "Developers", "Trace a risky path back to the service or release that created it and verify the remediation."],
];

const capabilityCards = [
  [Fingerprint, "Agent identity", "Bind non-human identities to the actions they are authorized to perform."],
  [KeyRound, "MCP governance", "Review server and tool reachability before a model can cross a sensitive boundary."],
  [Radar, "Runtime observation", "Separate configuration from what actually happened in the connected environment."],
  [Workflow, "Validation + retest", "Run authorized checks, capture the result, and keep failed paths open until retested."],
  [Layers3, "Evidence vault", "Give every security decision a source, timestamp, actor, status, and provenance trail."],
  [Zap, "Policy automation", "Move from alert to governed decision with approvals for high-impact actions."],
];

function LogoMark() {
  return (
    <span className="grid size-10 place-items-center rounded-2xl border border-cyan-200/25 bg-cyan-200/[.08] text-cyan-100 shadow-[0_0_36px_rgba(103,232,249,.16)]">
      <ShieldCheck className="size-5" />
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute -inset-8 rounded-[42px] bg-cyan-300/[.08] blur-3xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/[.14] bg-[#0c151e] shadow-[0_35px_120px_rgba(0,0,0,.45)]">
        <div className="flex items-center justify-between border-b border-white/[.08] px-4 py-3">
          <div className="flex items-center gap-2">
            <LogoMark />
            <div>
              <div className="text-[11px] font-bold tracking-[.18em] text-white">ELITZE</div>
              <div className="text-[8px] uppercase tracking-[.2em] text-slate-500">Security operations</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[.12em] text-emerald-200">
            <CircleDot className="size-3" /> Evidence ready
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-[.7fr_1.3fr] sm:p-5">
          <div className="space-y-2 rounded-2xl border border-white/[.07] bg-white/[.025] p-3">
            <div className="mb-4 text-[9px] font-bold uppercase tracking-[.18em] text-slate-500">Security workspace</div>
            {["Overview", "Agent identities", "Security graph", "Policies", "Evidence vault"].map((item, index) => (
              <div key={item} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[10px] font-semibold ${index === 0 ? "bg-cyan-300/[.1] text-cyan-100" : "text-slate-400"}`}>
                <span>{item}</span>
                {index === 0 ? <ChevronRight className="size-3" /> : <span className="size-1 rounded-full bg-slate-700" />}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200">Live control plane</div>
                <div className="mt-1 text-xl font-semibold tracking-[-.04em] text-white">Decisions with context</div>
              </div>
              <div className="rounded-lg border border-white/[.09] px-2 py-1 text-[9px] text-slate-400">Illustrative view</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["12", "Identities"], ["08", "Policies"], ["04", "Open paths"]].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-white/[.07] bg-white/[.025] p-3">
                  <div className="font-mono text-lg font-semibold text-white">{value}</div>
                  <div className="mt-1 text-[8px] uppercase tracking-[.12em] text-slate-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[.06] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-cyan-100"><BellRing className="size-3.5" /> Sensitive tool path</div>
                <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-amber-200">Needs review</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[9px] text-slate-300">
                <span className="rounded-md border border-white/10 px-2 py-1">agent.research</span><ChevronRight className="size-3 text-slate-600" /><span className="rounded-md border border-white/10 px-2 py-1">mcp.browser</span><ChevronRight className="size-3 text-slate-600" /><span className="rounded-md border border-amber-300/20 px-2 py-1 text-amber-100">customer_data</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]"><div className="rounded-lg bg-black/20 px-2 py-2 text-slate-400">Policy <span className="ml-1 text-white">approval_required</span></div><div className="rounded-lg bg-black/20 px-2 py-2 text-slate-400">Evidence <span className="ml-1 text-emerald-200">source-bound</span></div></div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[.07] bg-white/[.02] px-3 py-2.5 text-[9px] text-slate-400"><span className="flex items-center gap-2"><Play className="size-3 text-cyan-200" /> Review the decision record</span><ArrowRight className="size-3 text-cyan-200" /></div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-white/[.12] bg-[#111d27] px-4 py-3 shadow-2xl sm:block">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-white"><Sparkles className="size-3.5 text-cyan-200" /> Built for the agentic enterprise</div>
        <div className="mt-1 text-[9px] text-slate-500">Control the path before impact</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#071018] text-white">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
      <section className="relative border-b border-white/[.08]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_12%,rgba(103,232,249,.13),transparent_32%),radial-gradient(circle_at_15%_35%,rgba(167,139,250,.10),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
        <div className="relative mx-auto grid max-w-[1440px] gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:gap-16 lg:px-12 lg:pt-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><span className="size-1.5 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(103,232,249,.9)]" /> Agentic security control plane</div>
            <h1 className="mt-7 max-w-3xl text-[3.45rem] font-semibold leading-[.96] tracking-[-.075em] sm:text-7xl lg:text-[6.25rem]">Security for the <span className="text-cyan-200">agentic enterprise.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">Discover what AI agents can reach. Control what they can do. Prove every decision with evidence your security team can verify.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-5 py-3.5 text-sm font-bold text-[#061018] shadow-[0_0_38px_rgba(103,232,249,.18)] transition hover:bg-cyan-100"><span>Start with ELITZE</span><ArrowRight className="size-4" /></Link>
              <Link href="/platform" className="inline-flex items-center gap-2 rounded-xl border border-white/[.15] bg-white/[.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-200/40 hover:bg-white/[.07]"><Play className="size-4 text-cyan-200" /> Explore the platform</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500"><span className="flex items-center gap-2"><Check className="size-3 text-emerald-300" /> Source-bound evidence</span><span className="flex items-center gap-2"><Check className="size-3 text-emerald-300" /> Tenant-scoped policy</span><span className="flex items-center gap-2"><Check className="size-3 text-emerald-300" /> Human approval where needed</span></div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-white/[.08] bg-white/[.025]">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-7 sm:grid-cols-3 sm:px-8 lg:px-12">
          {[["01", "See the real attack path", "Identity, agent, MCP, API, data, and runtime context in one view."], ["02", "Make the right decision", "Policy and approvals sit before sensitive execution, not after the incident."], ["03", "Leave a defensible record", "Every action can carry provenance, outcome, remediation, and retest evidence."]].map(([number, title, description]) => <div key={number} className="flex gap-4"><span className="font-mono text-xs text-cyan-200/80">{number}</span><div><div className="text-sm font-semibold text-white">{title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></div>)}
        </div>
      </section>

      <InteractiveProductHub />

      <section id="how-it-works" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="max-w-2xl"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">The control loop</div><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">From discovery to proof, without the blind spots.</h2><p className="mt-5 text-base leading-7 text-slate-400">ELITZE gives security teams a single operating path for the actions that matter most in an AI-native environment.</p></div>
        <div className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {controlSteps.map(({ number, icon: Icon, title, description }) => <article key={number} className="group relative rounded-2xl border border-white/[.1] bg-white/[.025] p-6 transition hover:-translate-y-1 hover:border-cyan-200/35 hover:bg-cyan-200/[.04]"><div className="flex items-center justify-between"><span className="font-mono text-xs text-cyan-200/75">{number}</span><Icon className="size-5 text-cyan-200" /></div><h3 className="mt-12 text-lg font-semibold tracking-[-.02em]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p><div className="mt-8 h-px w-8 bg-cyan-200/70 transition-all group-hover:w-16" /></article>)}
        </div>
      </section>

      <section id="platform" className="border-y border-white/[.08] bg-[#0b151e]">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.7fr_1.3fr] lg:items-start lg:px-12">
          <div className="lg:sticky lg:top-28"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">One platform, focused controls</div><h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Make agent risk legible to every team.</h2><p className="mt-5 max-w-lg text-base leading-7 text-slate-400">Start with the control path that matters, then expand into the security operations surfaces your environment needs. No disconnected status pages. No claims without evidence.</p><Link href="/platform" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">See the platform domains <ArrowRight className="size-4" /></Link></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilityCards.map(([Icon, title, description]) => { const CapabilityIcon = Icon as typeof Bot; return <article key={title as string} className="rounded-2xl border border-white/[.1] bg-white/[.025] p-6 transition hover:border-cyan-200/30"><CapabilityIcon className="size-5 text-cyan-200" /><h3 className="mt-5 text-base font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></article>; })}
          </div>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">Built for accountable automation</div><h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-.05em] sm:text-5xl">The model is not the security boundary.</h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-400">ELITZE keeps policy, identity, execution, runtime observation, and evidence distinct. If telemetry is missing, the platform says so. If a control is not verified, it does not present it as live protection.</p><div className="mt-8 space-y-3">{["No invented telemetry or synthetic incidents", "Policy decisions tied to a tenant-scoped subject", "Approval gates for high-impact actions", "Retest and evidence required before closure"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-slate-300"><span className="grid size-6 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/[.08] text-emerald-200"><Check className="size-3.5" /></span>{item}</div>)}</div></div>
          <div className="relative overflow-hidden rounded-[28px] border border-white/[.12] bg-[#0c151e] p-6 shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:p-8"><div className="absolute right-0 top-0 size-48 rounded-full bg-cyan-200/[.08] blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200">Evidence record</div><div className="mt-2 text-xl font-semibold">Decision / 8f42c1</div></div><div className="rounded-full border border-emerald-300/25 bg-emerald-300/[.08] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-emerald-200">Verified</div></div><div className="mt-7 space-y-3">{[["Subject", "agent.research"], ["Requested action", "mcp.browser → customer_data"], ["Policy result", "Approval required"], ["Runtime outcome", "Observed and retained"], ["Next step", "Retest after remediation"]].map(([label, value]) => <div key={label} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] pb-3 text-xs"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-200">{value}</span></div>)}</div><div className="mt-6 flex items-center gap-2 text-[10px] text-slate-500"><Shield className="size-3.5 text-cyan-200" /> Source, actor, timestamp, policy, and outcome retained</div></div></div>
        </div>
      </section>

      <section className="border-y border-white/[.08] bg-[linear-gradient(115deg,rgba(103,232,249,.12),rgba(167,139,250,.08),transparent_68%)]">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"><div className="max-w-2xl"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">One workspace, different jobs</div><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Give every operator the context they need.</h2></div><div className="mt-10 grid gap-3 md:grid-cols-3">{roleCards.map(([Icon, title, description]) => { const RoleIcon = Icon as typeof Bot; return <article key={title as string} className="rounded-2xl border border-white/[.12] bg-[#0b151e]/75 p-6"><RoleIcon className="size-5 text-cyan-200" /><h3 className="mt-5 text-base font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p><Link href="/register" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200">Open the workspace <ArrowRight className="size-3.5" /></Link></article>; })}</div></div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-20 text-center sm:px-8 sm:py-28 lg:px-12"><div className="mx-auto max-w-3xl"><div className="mx-auto grid size-12 place-items-center rounded-2xl border border-cyan-200/25 bg-cyan-200/[.08] text-cyan-200"><ShieldCheck className="size-6" /></div><h2 className="mt-7 text-4xl font-semibold tracking-[-.06em] sm:text-6xl">Make the safe path the easy path.</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">Start with a clear security control plane for the agents and tools already changing how your organization works.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-5 py-3.5 text-sm font-bold text-[#061018] transition hover:bg-cyan-100">Create your workspace <ArrowRight className="size-4" /></Link><Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/[.15] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-cyan-200/40">Talk to ELITZE <ArrowRight className="size-4" /></Link></div></div></section>

      </main>
      <SiteFooter />
    </div>
  );
}
