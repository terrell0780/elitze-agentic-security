"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Crosshair, Menu, ShieldCheck, X } from "lucide-react";
import GlobalThemeToggle from "@/components/global-theme-toggle";
import AcquisitionCta from "@/components/acquisition-cta";
import LiveControlPlane from "@/components/live-control-plane";
import SecurityWorkspacePreview from "@/components/security-workspace-preview";
import SecurityCapabilityAtlas from "@/components/security-capability-atlas";

const lifecycle = [
  ["01", "Discover", "Identify authorized agents, MCP surfaces, tools and workload identities."],
  ["02", "Connect", "Bring approved security and runtime sources into the control plane."],
  ["03", "Collect", "Capture source-bound inventory, decisions, runtime signals and provenance."],
  ["04", "Protect", "Apply identity, credential, data and execution boundaries."],
  ["05", "Govern", "Attach policy, ownership, approvals and operating constraints."],
  ["06", "Enforce", "Evaluate sensitive actions at the authorized execution boundary."],
  ["07", "Validate", "Retest affected paths and verify remediation rather than trusting status alone."],
  ["08", "Evidence", "Preserve auditable records that show what was observed and when."],
] as const;

const pillars = [
  ["Identity", "Who or what is acting?", "Tenant-scoped subjects and workload identity establish the security boundary."],
  ["Reach", "What can it actually reach?", "Observed relationships connect agents to MCP, tools, APIs, secrets and protected data."],
  ["Policy", "What is allowed?", "Sensitive actions are evaluated before crossing the execution boundary."],
  ["Evidence", "What can be proven?", "Observed results and retest evidence determine what ELITZE can state as fact."],
] as const;

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-7">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE Agentic Security home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span>
            <span><b className="block text-sm tracking-[.12em]">ELITZE</b><span className="block text-[8px] uppercase tracking-[.26em] text-[var(--muted)]">Agentic Security</span></span>
          </Link>
          <nav className="hidden items-center gap-7 text-[12px] font-semibold text-[var(--muted)] lg:flex" aria-label="Primary navigation">
            {[[ "Platform","/platform" ],[ "Security","/security" ],[ "SOC","/agentic-soc" ],[ "Threat Detection","/threat-detection" ],[ "Emulation","/adversary-emulation" ],[ "Integrations","/integrations" ],[ "Recursive Agents","/recursive-agents" ],[ "REO / SEO","/reo" ],[ "Chat","/chat" ],[ "FAQ","/faq" ],[ "About","/about" ],[ "Docs","/docs/faq.md" ]].map(([label,href]) => <Link key={href} href={href} className="transition hover:text-[var(--text)]">{label}</Link>)}
          </nav>
          <div className="flex items-center gap-2 pr-12 sm:pr-0">
            <Link href="/sales" className="hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-xs font-semibold sm:inline-flex">Acquisition</Link>
            <AcquisitionCta href="/console" event="console_open" className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950 sm:inline-flex">Open Control Plane</AcquisitionCta>
            <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] lg:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
            <GlobalThemeToggle embedded />
          </div>
        </div>
        {mobileOpen && <nav className="border-t border-[var(--border)] px-4 py-3 lg:hidden"><div className="mx-auto flex max-w-[1400px] flex-col gap-1">{[["Platform","/platform"],["Security","/security"],["SOC","/agentic-soc"],["Threat Detection","/threat-detection"],["Emulation","/adversary-emulation"],["Integrations","/integrations"],["Recursive Agents","/recursive-agents"],["REO / SEO","/reo"],["Chat","/chat"],["Help","/help"],["FAQ","/faq"],["About","/about"],["Contributing","/contributing"],["Legal","/legal"],["Contact","/contact"],["Control Plane","/console"],["Acquisition","/sales"]].map(([label,href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]">{label}</Link>)}</div></nav>}
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
        <div className="pointer-events-none absolute left-[62%] top-[-220px] h-[650px] w-[650px] rounded-full bg-[var(--accent-glow)] blur-3xl" />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.22em] text-cyan-200"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 pulse-soft" /> ELITZE · Agentic Security</div>
            <h1 className="mt-7 max-w-3xl text-[3.4rem] font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-[5rem]">AI security,<br /><span className="text-cyan-300">under control.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted-strong)]">One workspace to inspect agent access, govern sensitive actions, and trace security decisions back to evidence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AcquisitionCta href="/console" event="console_open" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Open control plane <ArrowRight className="h-4 w-4" /></AcquisitionCta>
              <AcquisitionCta href="/sales" event="sales_cta" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Enterprise / acquisition <ArrowRight className="h-4 w-4" /></AcquisitionCta>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-[.15em] text-[var(--muted)] sm:grid-cols-4">
              {["Agent discovery","Workload identity","Policy enforcement","Evidence / retest"].map((x) => <div key={x} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" />{x}</div>)}
            </div>
          </div>
          <SecurityWorkspacePreview />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-7 sm:py-14">
        <LiveControlPlane />
      </section>

      <SecurityCapabilityAtlas />

      <section className="border-b border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-5 sm:px-7 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--muted)]">
          {["Discover","Connect","Collect","Protect","Govern","Enforce","Validate","Evidence"].map((x,i) => <span key={x} className={i === 0 || i === 7 ? "text-[var(--accent)]" : ""}>{i ? "→ " : ""}{x}</span>)}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-7 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Adversarial validation</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">Pentest every release. Verify every fix.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted-strong)]">ELITZE now exposes the security validation path as a first-class product surface: authorized scope, adversarial testing, policy enforcement, evidence and retest.</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {["Authorized pentest requests","Red-team release testing","Attack-path validation","Evidence + retest"].map((item) => <div key={item} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-xs font-semibold">{item}</div>)}
              </div>
              <Link href="/console/pentesting" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"><Crosshair className="h-4 w-4" /> Open pentest workbench <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-[var(--accent-border)] bg-black/20 shadow-[0_30px_100px_rgba(0,0,0,.25)]">
              <Image src="/elitze-security-validation.svg" alt="ELITZE security validation and authorized pentest lifecycle" width={1600} height={900} className="h-auto w-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-7 sm:py-24">
        <div className="max-w-3xl"><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">The operating model</div><h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">The model is not the security boundary.</h2><p className="mt-5 text-base leading-7 text-[var(--muted-strong)]">ELITZE places identity, authorization and evidence outside the model so sensitive agent actions can be governed at the control boundary.</p></div>
        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{pillars.map(([title,q,a],i) => <article key={title} className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6"><div className="font-mono text-[9px] text-[var(--accent)]">0{i+1}</div><h3 className="mt-5 text-xl font-black">{title}</h3><div className="mt-2 text-sm font-semibold">{q}</div><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{a}</p></article>)}</div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-7 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6"><div><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Lifecycle</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">From discovery to proof.</h2></div><Link href="/platform" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">Inspect the platform <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{lifecycle.map(([n,t,d]) => <article key={n} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="font-mono text-[9px] text-[var(--accent)]">{n}</div><h3 className="mt-4 text-base font-bold">{t}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{d}</p></article>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-7 sm:py-24">
        <div className="rounded-[32px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10"><div><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Evidence discipline</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">No record. No claim.</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">REO, RIO/ROI and security posture remain source-bound. When the underlying record is missing, ELITZE exposes the missing state instead of creating a number.</p></div><Link href="/security" className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 lg:mt-0">Security architecture <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      <section className="border-t border-[var(--border)]"><div className="mx-auto max-w-[1400px] px-4 py-16 text-center sm:px-7 sm:py-24"><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Commercial path</div><h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black tracking-[-.045em] sm:text-5xl">Built to operate. Structured to transfer.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">The public surface explains the architecture. The acquisition surface documents what is included, what remains subject to diligence and how controlled source access works.</p><div className="mt-7 flex justify-center"><Link href="/sales" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Open acquisition surface <ArrowRight className="h-4 w-4" /></Link></div></div></section>
    </main>
  );
}
