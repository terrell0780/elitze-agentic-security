"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { ArrowRight, Bot, Check, Fingerprint, Globe2, LockKeyhole, Menu, Network, ScanSearch, ShieldCheck, Sparkles, Sun, Workflow, X } from "lucide-react";
import { ThreatSurface } from "@/components/threat-surface";
import ObsidianIntelligence from "@/components/obsidian-intelligence";
import GodsEyeGlobe from "@/components/gods-eye-globe";
import GlobalSecurityCommandLayer from "@/components/global-security-command-layer";
import SecurityDecisionTwin from "@/components/security-decision-twin";

const cards = [
  [Fingerprint, "Identity", "Bind people, workloads and agents to the actions they are allowed to take."],
  [Network, "Attack paths", "See exposure, reachability, choke points and blast radius in one security graph."],
  [Bot, "AI agents", "Govern models, agents, MCP, tools, delegation and non-human access."],
  [ScanSearch, "Validation", "Separate observed evidence from inference, simulation, stale data and unknowns."],
  [LockKeyhole, "Runtime", "Enforce policy before generation or tool execution and contain authorized scopes."],
  [Workflow, "Evidence", "Connect decisions, actions, outcomes and verification into an auditable chain."],
] as const;

const responseLoop = [
  ["01", "Incident alert", "A signal enters the command surface."],
  ["02", "ELITZE triage", "Identity, asset, agent, exposure and reachability are correlated."],
  ["03", "SOC action", "An analyst or authorized automation takes the approved action."],
  ["04", "SOC support", "The team gets context, attack paths, policy state and evidence."],
  ["05", "Verify", "ELITZE checks whether containment or remediation actually worked."],
  ["06", "Evidence", "The result becomes traceable evidence instead of a green badge."],
];

function ThemeToggle() {
  const [light, setLight] = useState(false);
  useLayoutEffect(() => {
    const stored = localStorage.getItem("elitze-theme");
    const next = stored ? stored === "light" : matchMedia("(prefers-color-scheme: light)").matches;
    setLight(next); document.documentElement.dataset.theme = next ? "light" : "dark";
  }, []);
  const toggle = () => {
    const next = !light; setLight(next); document.documentElement.dataset.theme = next ? "light" : "dark";
    localStorage.setItem("elitze-theme", next ? "light" : "dark");
  };
  return <button type="button" onClick={toggle} aria-label="Toggle theme" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--muted-strong)] hover:border-[var(--accent-border)]"><Sun className="h-4 w-4" /></button>;
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <main id="main-content" className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="ELITZE Agentic Security home">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span>
          <span><b className="block text-sm">ELITZE</b><span className="block text-[9px] uppercase tracking-[.2em] text-[var(--accent)]">Agentic Security</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex" aria-label="Primary navigation">
          <Link href="/platform">Platform</Link><Link href="/security">Security</Link><Link href="/compare">Compare</Link><Link href="/about">About</Link><Link href="/faq">FAQ</Link>
        </nav>
        <div className="flex items-center gap-2"><ThemeToggle/><Link href="/console" className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950 sm:inline-flex">Open Console</Link><button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] md:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
      </div>
      {mobileOpen && <nav className="border-t border-[var(--border)] px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1">{[["Platform", "/platform"], ["Security", "/security"], ["Compare", "/compare"], ["About", "/about"], ["FAQ", "/faq"], ["Console", "/console"], ["Acquisition / Sales", "/sales"]].map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[var(--muted)]">{label}</Link>)}</div></nav>}
    </header>

    <section className="relative overflow-hidden border-b border-[var(--border)]"><div className="pointer-events-none absolute inset-0 hero-grid opacity-60" /><div className="pointer-events-none absolute left-1/2 top-[-220px] h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[var(--accent-glow)] blur-3xl" /><div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:py-20">
      <div className="order-2 lg:order-1"><div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-soft" /> Security decision + evidence plane</div><h1 className="mt-6 max-w-3xl text-[3.2rem] font-black leading-[.9] tracking-[-.07em] sm:text-6xl lg:text-7xl xl:text-[5.1rem]">See the threat.<br /><span className="text-[var(--accent)]">Control the path.</span><br />Prove the fix.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-strong)]">One operating surface for AI agents, software, cloud, identity, APIs and runtime behavior — from incident signal to verified outcome.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/console" className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_38px_rgba(34,211,238,.16)]">Enter ELITZE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link><Link href="/sales" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Acquire / Enterprise <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-8 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]"><span className="rounded-full border border-[var(--border)] px-3 py-1.5">Solo</span><span className="rounded-full border border-[var(--border)] px-3 py-1.5">Teams</span><span className="rounded-full border border-[var(--border)] px-3 py-1.5">Enterprise</span><span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">Mobile ready</span></div></div>
      <div id="threat-surface" className="order-1 lg:order-2"><ThreatSurface /></div>
    </div></section>

    <section className="border-b border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]"><span className="text-[var(--accent)]">Observe</span><span>→</span><span>Understand</span><span>→</span><span>Authorize</span><span>→</span><span>Act</span><span>→</span><span>Retest</span><span>→</span><span className="text-[var(--accent)]">Prove</span></div></div></section>

    <section id="global-security" className="border-b border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="mb-6 flex items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><Globe2 className="h-4 w-4" /> ELITZE Global Security View</div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] sm:text-4xl">A visual command surface for the security world.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">Explore authorized security context across coverage, exposure, activity, evidence and bounded counterfactual analysis. The visual layer never turns missing telemetry into fake certainty.</p></div><Link href="/security" className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[var(--accent)] sm:inline-flex">How the controls work <ArrowRight className="h-4 w-4" /></Link></div><GodsEyeGlobe /><GlobalSecurityCommandLayer /><SecurityDecisionTwin /></div></section>

    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([Icon, title, desc], i) => <article key={title} className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-border)]"><div className="absolute right-4 top-4 font-mono text-[9px] text-[var(--muted)]">0{i + 1}</div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Icon className="h-5 w-5" /></div><h2 className="mt-5 text-base font-bold">{title}</h2><p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{desc}</p><div className="mt-6 h-px w-10 bg-[var(--accent)] transition-all group-hover:w-20" /></article>)}</div></section>

    <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><ObsidianIntelligence /></div></section>

    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="mb-8 max-w-3xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><Workflow className="h-4 w-4" /> SOC response loop</div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] sm:text-4xl">Incident alert → action → support → proof.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">ELITZE extends the SOC workflow beyond taking action. The system follows the response through verification and evidence.</p></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{responseLoop.map(([num, title, desc]) => <article key={num} className="relative rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="font-mono text-[10px] text-[var(--accent)]">{num}</div><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{desc}</p></article>)}</div></section>

    <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Continuous security loop</div><h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-.035em] sm:text-4xl">A threat is a path. Change the path.</h2><div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-6">{["Detect", "Explain", "Authorize", "Act", "Retest", "Evidence"].map((step, i) => <div key={step} className={`rounded-xl border p-3 ${i === 5 ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel-strong)]"}`}><div className="font-mono text-[9px] text-[var(--accent)]">0{i + 1}</div><div className="mt-2 text-xs font-semibold">{step}</div></div>)}</div></div><div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-8"><Sparkles className="h-6 w-6 text-[var(--accent)]" /><h2 className="mt-4 text-2xl font-bold">No green badge without proof.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Missing data stays missing. Simulated state stays simulated. Actions stay inside policy and authorization boundaries.</p><div className="mt-7 space-y-2 text-xs font-semibold"><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]" /> Source-bound state</div><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]" /> Policy-bound action</div><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]" /> Retest-backed closure</div></div></div></div></div></section>

    <section className="border-t border-[var(--border)]"><div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20"><div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">Built for the business</div><h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black tracking-[-.04em] sm:text-5xl">One security surface for solo operators, teams and enterprise.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Start with a focused security workflow. Add collaboration, governance, integrations and controlled automation as your environment grows.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950">Open Console <ArrowRight className="h-4 w-4" /></Link><Link href="/sales" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Acquisition / Enterprise sales</Link></div></div></section>

    <footer className="border-t border-[var(--border)] bg-[var(--section)]"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6"><div>© 2026 ELITZE Agentic Security. All rights reserved.</div><nav className="flex flex-wrap gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/sales">Sales / Acquisition</Link><Link href="/security">Security</Link></nav></div></footer>
  </main>;
}
