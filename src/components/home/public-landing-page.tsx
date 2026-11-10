import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  Network,
  Radar,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import SiteFooter from "@/components/home/site-footer";
import SiteHeader from "@/components/home/site-header";

const capabilities = [
  {
    icon: Fingerprint,
    title: "Identity-aware execution",
    description: "Tie every sensitive action to a human, agent, workload, tenant, and authorization path before it runs.",
  },
  {
    icon: Network,
    title: "Reachability and exposure",
    description: "Map observed identities, services, tools, data stores, and relationships so teams can prioritize what is actually connected.",
  },
  {
    icon: LockKeyhole,
    title: "Policy at the control point",
    description: "Apply tenant-scoped policy and approval controls at APIs, MCP servers, tools, and other sensitive execution paths.",
  },
  {
    icon: Radar,
    title: "Runtime security evidence",
    description: "Separate observed facts from inference and keep source, timestamp, decision, and remediation evidence attached to the record.",
  },
];

const workflow = [
  ["01", "Connect", "Bring in approved identity, runtime, code, cloud, and security-tool sources."],
  ["02", "Decide", "Evaluate the request against tenant policy, authorization, risk, and approval requirements."],
  ["03", "Observe", "Record the result and the evidence returned by the connected source or controlled action."],
  ["04", "Prove", "Retest the path and show what changed, what remains unverified, and who owns the next step."],
] as const;

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader />
      <div>
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(103,232,249,.16),transparent_30%),radial-gradient(circle_at_86%_22%,rgba(129,140,248,.13),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 pb-20 pt-16 sm:px-7 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-20 lg:pb-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><span className="size-1.5 rounded-full bg-cyan-200" /> Agentic security control plane</div>
              <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[.96] tracking-[-.065em] sm:text-7xl">Secure the path from <span className="text-cyan-200">agent intent</span> to real-world action.</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE Agentic Security helps teams govern AI agents, MCP servers, APIs, tools, and sensitive execution with identity-aware controls, runtime observation, and evidence-backed remediation.</p>
              <div className="mt-9 flex flex-wrap gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:brightness-110">Create a secure workspace <ArrowRight className="size-4" /></Link><Link href="/platform" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3.5 text-sm font-semibold transition hover:border-cyan-200/40">Explore the platform</Link></div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--muted)]"><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-3.5 text-cyan-200" /> Tenant-scoped</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-3.5 text-cyan-200" /> Evidence-first</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-3.5 text-cyan-200" /> No synthetic telemetry</span></div>
            </div>
            <div className="rounded-[30px] border border-cyan-200/20 bg-[#0b151e]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,.25)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/[.08] pb-4"><div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200">Control path</div><div className="mt-1 text-sm font-semibold">Governed execution lifecycle</div></div><ShieldCheck className="size-5 text-cyan-200" /></div>
              <div className="mt-5 space-y-3">{[[Fingerprint, "Identify", "Subject, tenant, workload"], [LockKeyhole, "Authorize", "Policy and approval gate"], [Radar, "Observe", "Source-attributed result"], [CheckCircle2, "Prove", "Evidence and retest"]].map(([Icon, label, detail]) => { const Glyph = Icon as typeof ShieldCheck; return <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><span className="grid size-9 place-items-center rounded-xl bg-cyan-200/[.08] text-cyan-200"><Glyph className="size-4" /></span><div><div className="text-sm font-semibold">{label as string}</div><div className="mt-1 text-xs text-slate-500">{detail as string}</div></div><ArrowRight className="ml-auto size-4 text-slate-600" /></div>; })}</div>
              <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.04] p-4 text-xs leading-5 text-emerald-100">Unverified state stays unverified. ELITZE does not present illustrative telemetry as a live security result.</div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-[1400px] px-4 py-20 sm:px-7 lg:py-24">
          <div className="max-w-3xl"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">Built for governed autonomy</div><h2 className="mt-4 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Security controls that follow the action.</h2><p className="mt-5 text-base leading-7 text-[var(--muted-strong)]">Modern security operations need more than another alert surface. ELITZE connects identity, policy, runtime context, and proof around the execution paths where risk becomes real.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{capabilities.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><span className="grid size-10 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-200/[.07] text-cyan-200"><Icon className="size-5" /></span><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p></article>)}</div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--panel)]/45">
          <div className="mx-auto max-w-[1400px] px-4 py-20 sm:px-7 lg:py-24"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">From signal to proof</div><h2 className="mt-4 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">A practical operating loop for agentic security.</h2><p className="mt-5 text-sm leading-7 text-[var(--muted-strong)]">Start with the sources you can verify. Expand only when the control path and evidence are clear.</p><Link href="/how-to" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">Read the operating guide <ArrowRight className="size-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{workflow.map(([number, title, description]) => <article key={number} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5"><div className="font-mono text-xs text-cyan-200">{number}</div><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p></article>)}</div></div></div>
        </section>

        <section className="mx-auto max-w-[1400px] px-4 py-20 sm:px-7 lg:py-24"><div className="rounded-[30px] border border-cyan-200/20 bg-[linear-gradient(120deg,rgba(103,232,249,.10),rgba(129,140,248,.06),rgba(255,255,255,.02))] p-7 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12"><div className="max-w-2xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200"><Bot className="size-4" /> ELITZE Agentic Security</div><h2 className="mt-4 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Make every sensitive action explainable.</h2><p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">Create a workspace, connect approved sources, and move from security intent to governed, observable execution.</p></div><div className="mt-7 flex flex-wrap gap-3 lg:mt-0"><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-bold text-slate-950">Start with ELITZE <ArrowRight className="size-4" /></Link><Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3.5 text-sm font-semibold">Sign in</Link></div></div></section>
      </div>
      <SiteFooter />
    </div>
  );
}
