import Link from "next/link";
import { ArrowRight, Check, Gauge, ShieldCheck, Zap } from "lucide-react";

const benchmark = [
  ["Endpoint / XDR platforms", "Endpoint telemetry and detection"],
  ["Cloud / CNAPP platforms", "Cloud posture and exposure context"],
  ["Enterprise security platforms", "Identity and ecosystem integration"],
  ["Zero Trust / access platforms", "Access policy and enforcement"],
  ["SOC / XDR platforms", "Investigation and response consolidation"],
];

const dimensions = [
  ["Security graph", "Connect code, assets, identities, agents, dependencies, cloud and runtime context."],
  ["Decision quality", "Prioritize exploitability, reachability and business impact instead of alert volume."],
  ["Action path", "Move from finding to governed response without forcing operators through a maze of consoles."],
  ["Retest", "Re-run the original security condition after remediation."],
  ["Evidence", "Every meaningful decision should resolve to source and proof."],
  ["Agent control", "Identity, purpose, capability, MCP/tool and data boundaries before execution."],
];

export const metadata = {
  title: "Security Platform Benchmark",
  description: "A capability-based benchmark for the ELITZE Agentic Security operating model.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></div>
            <span className="text-sm font-bold">ELITZE</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/about" className="rounded-lg px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)]">About</Link>
            <Link href="/console" className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-slate-950">Open Console</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"><Gauge className="h-3.5 w-3.5" /> 2026 capability benchmark</div>
              <h1 className="mt-5 text-4xl font-bold tracking-[-0.045em] sm:text-6xl">Strong security capabilities.<br /><span className="text-[var(--accent)]">One verified operating loop.</span></h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">ELITZE compares capability categories, not unverifiable vendor scores. The objective is to make the handoff between evidence, authorization, action, retest and proof operationally clear.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Decision loop", "Security graph", "Continuous validation", "Evidence"].map((item, i) => <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="text-2xl font-bold">0{i + 1}</div><div className="mt-1 text-[10px] text-[var(--muted)]">{item}</div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Reference capabilities</div><h2 className="mt-2 text-2xl font-bold sm:text-3xl">What established security categories do well</h2></div><div className="hidden max-w-sm text-right text-[10px] leading-5 text-[var(--muted)] sm:block">These are capability references, not rankings or claims that ELITZE outperforms a named vendor.</div></div>
        <div className="mt-7 space-y-3">
          {benchmark.map(([name, strength]) => <div key={name} className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:grid-cols-[1.1fr_1.4fr_auto] sm:items-center"><div><div className="text-sm font-bold">{name}</div></div><div className="text-xs text-[var(--muted)]">Reference strength: <span className="font-semibold text-[var(--text)]">{strength}</span></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Check className="h-4 w-4" /></div></div>)}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"><Zap className="h-3.5 w-3.5" /> ELITZE advantage</div><h2 className="mt-3 text-3xl font-bold tracking-tight">The product is the loop.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[var(--muted)]">The differentiator is the handoff between detection, decision, action, retest and evidence—not a fabricated score against another vendor.</p><Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">See the philosophy <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{dimensions.map(([title, body]) => <div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">✓</span><h3 className="text-sm font-semibold">{title}</h3></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">{body}</p></div>)}</div></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18"><div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 text-center sm:p-10"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Design rule</div><h2 className="mx-auto mt-3 max-w-3xl text-2xl font-bold sm:text-4xl">No green badge without evidence.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">The benchmark is only useful when the product can demonstrate the same control loop with real connected data.</p><Link href="/console" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950">Open ELITZE <ArrowRight className="h-4 w-4" /></Link></div></section>
    </main>
  );
}
