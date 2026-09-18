"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Menu, ShieldCheck, X } from "lucide-react";
import ElitzeControlSurface from "@/components/elitze-control-surface";
import AcquisitionCta from "@/components/acquisition-cta";

const controls = [
  ["01", "Discover", "Find real agents, MCP servers, tools and workload identities from authorized sources."],
  ["02", "Map reach", "Record observed paths to tools, APIs, secrets and protected data."],
  ["03", "Enforce", "Evaluate sensitive actions before they cross the authorized execution boundary."],
  ["04", "Prove", "Observe the result, retest the affected path and preserve evidence."],
] as const;

const proofPoints = [
  "Tenant-scoped identity",
  "Evidence-bound decisions",
  "No synthetic security state",
  "Runtime observation + retest",
] as const;

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE Agentic Security home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span>
            <span><b className="block text-sm tracking-wide">ELITZE</b><span className="block text-[9px] uppercase tracking-[.22em] text-[var(--muted)]">Agentic Security</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[var(--muted)] md:flex" aria-label="Primary navigation">
            <Link href="/platform" className="transition hover:text-[var(--text)]">Platform</Link>
            <Link href="/security" className="transition hover:text-[var(--text)]">Security</Link>
            <Link href="/compare" className="transition hover:text-[var(--text)]">Benchmark</Link>
            <Link href="/about" className="transition hover:text-[var(--text)]">About</Link>
            <Link href="/faq" className="transition hover:text-[var(--text)]">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <AcquisitionCta href="/sales" event="sales_cta" className="hidden rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--accent)] sm:inline-flex">Enterprise / Acquisition</AcquisitionCta>
            <AcquisitionCta href="/console" event="console_open" className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950 sm:inline-flex">Open Console</AcquisitionCta>
            <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] md:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {mobileOpen && <nav className="border-t border-[var(--border)] px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1">{[["Platform", "/platform"], ["Security", "/security"], ["Benchmark", "/compare"], ["About", "/about"], ["FAQ", "/faq"], ["Console", "/console"], ["Enterprise / Acquisition", "/sales"]].map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]">{label}</Link>)}</div></nav>}
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-50" />
        <div className="pointer-events-none absolute left-1/2 top-[-300px] h-[760px] w-[1100px] -translate-x-1/2 rounded-full bg-[var(--accent-glow)] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-soft" /> Security control plane for the agentic enterprise</div>
            <h1 className="mt-6 max-w-3xl text-[3.35rem] font-black leading-[.9] tracking-[-.07em] sm:text-6xl lg:text-7xl">Discover the agent.<br /><span className="text-[var(--accent)]">Control the path.</span><br />Prove the outcome.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE connects identity, reachability, policy enforcement, runtime observation and evidence around the actions agents actually take.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AcquisitionCta href="/console" event="console_open" className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_44px_rgba(34,211,238,.14)]">Open ELITZE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></AcquisitionCta>
              <AcquisitionCta href="/sales" event="sales_cta" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Enterprise / Acquisition <ArrowRight className="h-4 w-4" /></AcquisitionCta>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">{proofPoints.map((item) => <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">{item}</span>)}</div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-[var(--accent-border)] bg-black/20 shadow-[0_30px_120px_rgba(0,0,0,.38)]">
            <Image src="/elitze-command-plane-2026.svg" alt="ELITZE command plane showing layered identity, policy, execution and evidence paths" width={1600} height={1000} priority className="h-auto w-full" />
            <div className="absolute inset-x-4 bottom-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-black/65 px-3 py-2 backdrop-blur"><div className="text-[9px] uppercase tracking-[.18em] text-cyan-200/70">Boundary</div><div className="mt-1 text-xs font-semibold text-white">Policy before execution</div></div><div className="rounded-xl border border-white/10 bg-black/65 px-3 py-2 backdrop-blur"><div className="text-[9px] uppercase tracking-[.18em] text-cyan-200/70">Evidence</div><div className="mt-1 text-xs font-semibold text-white">Source-bound decisions</div></div><div className="rounded-xl border border-white/10 bg-black/65 px-3 py-2 backdrop-blur"><div className="text-[9px] uppercase tracking-[.18em] text-cyan-200/70">State</div><div className="mt-1 text-xs font-semibold text-white">Observed, not inferred</div></div></div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-5 sm:px-6 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]"><span className="text-[var(--accent)]">Discover</span><span>→</span><span>Identify</span><span>→</span><span>Map Reach</span><span>→</span><span>Decide</span><span>→</span><span>Execute</span><span>→</span><span className="text-[var(--accent)]">Prove</span></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{controls.map(([number, title, body]) => <article key={number} className="group relative rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-border)]"><div className="font-mono text-[10px] text-[var(--accent)]">{number}</div><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p><div className="mt-6 h-px w-10 bg-[var(--accent)] transition-all group-hover:w-20" /></article>)}</div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Security reach</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">See the connected path, not another isolated alert.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted-strong)]">ELITZE’s visual layer is designed around relationships between agent identity, MCP, tools, APIs, secrets, protected data, policy and evidence.</p><Link href="/security" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">Explore the security model <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="overflow-hidden rounded-[30px] border border-[var(--accent-border)] bg-black/20"><Image src="/elitze-security-reach-2026.svg" alt="ELITZE security reach intelligence graph showing connected agent and evidence paths" width={1600} height={1000} loading="lazy" className="h-auto w-full" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Production truth</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">No record. No claim.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">When evidence is missing, ELITZE preserves the missing state instead of manufacturing a reassuring dashboard result.</p><div className="mt-8 grid gap-2 sm:grid-cols-2">{["Observed source", "Tenant binding", "Policy decision", "Authorized execution", "Runtime result", "Retest evidence"].map((item, i) => <div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]"><Check className="h-4 w-4" /></span><span className="text-xs font-semibold">{item}</span><span className="ml-auto font-mono text-[9px] text-[var(--muted)]">0{i + 1}</span></div>)}</div></div>
          <div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9"><ShieldCheck className="h-6 w-6 text-[var(--accent)]" /><h2 className="mt-4 text-2xl font-bold">The security boundary stays outside the model.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Identity, policy, authorization, execution controls, evidence and verified runtime outcomes form the control path.</p><div className="mt-7 space-y-2 text-sm font-semibold"><div>01 · Identity</div><div>02 · Policy</div><div>03 · Authorization</div><div>04 · Execution</div><div>05 · Evidence</div></div></div>
        </div>
      </section>

      <section className="border-t border-[var(--border)]"><div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20"><div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">Initial commercial category</div><h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black tracking-[-.04em] sm:text-5xl">Agent Identity and MCP Runtime Security.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">One security promise, demonstrated end-to-end. Expand only when the next connected control path is actually verified.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><AcquisitionCta href="/console" event="console_open" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950">Open Console <ArrowRight className="h-4 w-4" /></AcquisitionCta><AcquisitionCta href="/sales" event="sales_cta" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Enterprise / Acquisition</AcquisitionCta></div></div></section>
    </main>
  );
}
