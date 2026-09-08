import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleOff,
  Gauge,
  GitBranch,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const benchmark = [
  {
    name: "CrowdStrike Falcon",
    score: "4.6/5",
    reviews: "396 G2 reviews",
    strength: "Endpoint / XDR",
    lesson: "Strong detection, lightweight deployment, but users still cite cost and dashboard learning curve.",
    target: "Fast detection without forcing every workflow through an expert-only console.",
  },
  {
    name: "Wiz",
    score: "4.7/5",
    reviews: "777 G2 product reviews",
    strength: "Cloud / CNAPP",
    lesson: "Excellent visibility and unified cloud context; users ask for better manual control and AI-security depth.",
    target: "Context-rich exposure management plus deterministic controls and on-demand proof.",
  },
  {
    name: "Microsoft Defender XDR",
    score: "4.5/5",
    reviews: "286 G2 reviews",
    strength: "Enterprise XDR",
    lesson: "Deep ecosystem integration, but users report a steep learning curve and occasional false-positive friction.",
    target: "Make the secure path obvious: signal, reason, action, evidence.",
  },
  {
    name: "Zscaler",
    score: "4.5/5",
    reviews: "780 G2 reviews across Zscaler",
    strength: "Zero Trust / SASE",
    lesson: "Strong zero-trust position and category leadership; the lesson is policy consistency at every access point.",
    target: "Bring identity, purpose, tool and data authorization into the same security decision plane.",
  },
  {
    name: "Palo Alto Cortex XSIAM",
    score: "4.4/5",
    reviews: "73 G2 reviews",
    strength: "SOC / XSIAM",
    lesson: "Powerful consolidation and automation, while users cite complexity, cost and implementation effort.",
    target: "Enterprise depth without making every operator learn the entire platform before getting value.",
  },
];

const dimensions = [
  ["Unified security plane", "Single control loop across code, cloud, endpoint, identity, data, agents and runtime."],
  ["Noise control", "Prioritize evidence-backed risk and exploitability instead of turning every scanner finding into an incident."],
  ["Continuous offensive validation", "Authorized pentesting is part of the release lifecycle, not an annual report disconnected from engineering."],
  ["Remediation verification", "A finding is not closed because a ticket says fixed; the original security condition must be retested."],
  ["Human-readable decisions", "Every allow, block, contain or release decision explains the reason and points to evidence."],
  ["No fabricated posture", "Unavailable integrations stay unavailable. Empty datasets stay empty. Planned controls never masquerade as live controls."],
  ["Fast path to value", "Start with the highest-value control path and expand without turning setup into a consulting project."],
  ["Open integration surface", "Connect existing security, identity, cloud, CI/CD and data systems without requiring platform replacement."],
];

const reject = [
  "Alert volume presented as progress",
  "Fake assets, synthetic findings or demo telemetry in production views",
  "Security theater where a green badge is not backed by evidence",
  "Huge configuration surfaces before a customer can see value",
  "Closed-loop automation without policy, authorization and containment boundaries",
  "Claims of leadership without a measurable benchmark",
];

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="border-b border-red-950/40 bg-[#09050a]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE home">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">ELITZE</div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-300">Security platform benchmark</div>
            </div>
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <Link href="/platform" className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/[0.04] hover:text-white">Platform</Link>
            <Link href="/console" className="rounded-lg bg-red-500 px-3 py-2 font-semibold text-white">Open console</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/8">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
              <Gauge className="h-3.5 w-3.5" /> 2026 category-leader benchmark
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Do not build the biggest security platform. Build the one people actually want to operate.</h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">ELITZE uses the strongest current enterprise security platforms as capability benchmarks, then deliberately removes the operational friction users repeatedly describe: excessive cost, complexity, learning curves, noisy findings and weak connection between detection and verified remediation.</p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><Radar className="h-5 w-5 text-red-300" /><div className="mt-4 text-sm font-semibold">See the whole exposure</div><p className="mt-2 text-xs leading-5 text-slate-400">Connect assets, identities, dependencies, cloud resources, data, agents and attack paths into one security model.</p></div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><Wrench className="h-5 w-5 text-red-300" /><div className="mt-4 text-sm font-semibold">Do something about it</div><p className="mt-2 text-xs leading-5 text-slate-400">Turn validated risk into a governed remediation path instead of another unread ticket queue.</p></div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><LockKeyhole className="h-5 w-5 text-red-300" /><div className="mt-4 text-sm font-semibold">Prove the result</div><p className="mt-2 text-xs leading-5 text-slate-400">Retest the original condition and preserve evidence for engineering, security, compliance and leadership.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-300">Benchmark set</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Five enterprise leaders. Five different strengths.</h2></div>
          <p className="max-w-xl text-xs leading-5 text-slate-500">Ratings and review counts are a current-market reference point, not a claim that ELITZE currently outranks these vendors. ELITZE's job is to outperform the operating model customers dislike.</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {benchmark.map((item) => (
            <article key={item.name} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-base font-bold text-white">{item.name}</h3><p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.strength}</p></div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1 text-right"><div className="font-mono text-sm font-bold text-emerald-300">{item.score}</div><div className="text-[9px] text-slate-500">{item.reviews}</div></div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Observed lesson</div><p className="mt-2 text-xs leading-5 text-slate-400">{item.lesson}</p></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-red-300">ELITZE response</div><p className="mt-2 text-xs leading-5 text-slate-300">{item.target}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-300">ELITZE acceptance criteria</p><h2 className="mt-2 text-3xl font-bold tracking-tight">The platform is only as good as the workflow it creates.</h2><p className="mt-4 text-sm leading-6 text-slate-400">These are the capabilities ELITZE must prove in production. They are product requirements, not marketing adjectives.</p></div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {dimensions.map(([title, body]) => <div key={title} className="flex gap-3 rounded-xl border border-white/8 bg-black/20 p-4"><div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-red-500/10 text-red-300"><Check className="h-3.5 w-3.5" /></div><div><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{body}</p></div></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div><div className="flex items-center gap-2"><CircleOff className="h-5 w-5 text-red-300" /><h2 className="text-2xl font-bold">What ELITZE deliberately does not do</h2></div><div className="mt-6 space-y-3">{reject.map((item) => <div key={item} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-xs text-slate-400">{item}</div>)}</div></div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 sm:p-8"><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-300">North-star loop</div><div className="mt-5 grid gap-2 text-sm font-semibold"><div className="rounded-xl border border-white/8 bg-black/20 p-4">1. Detect the condition.</div><div className="rounded-xl border border-white/8 bg-black/20 p-4">2. Explain why it matters.</div><div className="rounded-xl border border-white/8 bg-black/20 p-4">3. Authorize the response.</div><div className="rounded-xl border border-white/8 bg-black/20 p-4">4. Patch or contain.</div><div className="rounded-xl border border-white/8 bg-black/20 p-4">5. Retest the exact condition.</div><div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-red-200">6. Produce evidence that the risk changed.</div></div></div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#09050a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-xl font-bold">The benchmark becomes the build standard.</h2><p className="mt-1 text-xs text-slate-500">No green status without evidence. No feature marked live until the integration path actually works.</p></div>
          <Link href="/console" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:brightness-110">Open ELITZE <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
