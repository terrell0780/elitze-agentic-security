"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  Fingerprint,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Menu,
  Network,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Workflow,
  X,
} from "lucide-react";
import GodsEyeGlobe from "@/components/gods-eye-globe";
import ObsidianIntelligence from "@/components/obsidian-intelligence";

const controls = [
  [KeyRound, "Secrets", "Credentials and secret exposure."],
  [Code2, "Code", "Security defects before release."],
  [GitBranch, "Supply chain", "Dependencies and artifacts."],
  [ShieldCheck, "Runtime", "Application-layer protection."],
  [ScanSearch, "Infinite Pentest", "Exploitability and retest."],
  [LockKeyhole, "Agent guardrails", "Identity, purpose, tools and data."],
];

const loop = [
  ["01", "Detect"],
  ["02", "Explain"],
  ["03", "Authorize"],
  ["04", "Act"],
  ["05", "Retest"],
  ["06", "Evidence"],
];

function ThemeToggle() {
  const [light, setLight] = useState(false);

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem("elitze-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const next = stored ? stored === "light" : prefersLight;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    window.localStorage.setItem("elitze-theme", next ? "light" : "dark");
  }

  return <button type="button" onClick={toggle} aria-label="Toggle theme" className="theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--muted-strong)] transition hover:border-[var(--border-strong)]">{light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>;
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE home">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></div>
            <div className="leading-tight"><div className="text-sm font-bold tracking-wide">ELITZE</div><div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Agentic Security</div></div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex"><Link href="/platform">Platform</Link><Link href="/security">Security</Link><Link href="/compare">Compare</Link><Link href="/about">About</Link><Link href="/faq">FAQ</Link></nav>
          <div className="flex items-center gap-2"><ThemeToggle /><Link href="/console" className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(239,68,68,.22)] sm:inline-flex">Open Console</Link><button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] md:hidden">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
        </div>
        {mobileOpen && <nav className="border-t border-[var(--border)] px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1">{[["Platform","/platform"],["Security","/security"],["Compare","/compare"],["About","/about"],["FAQ","/faq"],["Console","/console"]].map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]">{label}</Link>)}</div></nav>}
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent-glow)] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_.9fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-soft" /> Self-securing software</div>
            <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-[-0.055em] sm:text-6xl lg:text-7xl">Pentest every release.<br /><span className="text-[var(--accent)]">Patch automatically.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted-strong)]">One control loop for application security, agent security, runtime defense and verified remediation.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/console" className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(239,68,68,.25)] transition hover:brightness-110">Enter ELITZE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link><Link href="/compare" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">See the benchmark</Link></div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted)]"><span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" /> Evidence-backed</span><span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" /> Fail-closed controls</span><span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" /> No synthetic telemetry</span></div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-[var(--accent-glow)] blur-3xl" />
            <div className="relative rounded-[30px] border border-[var(--border-strong)] bg-[var(--panel-strong)]/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3"><div className="flex items-center gap-2 text-xs font-semibold"><Radar className="h-4 w-4 text-[var(--accent)]" /> Security control loop</div><span className="rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--success)]">Policy-bound</span></div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{loop.map(([number, title], index) => <div key={number} className={`rounded-xl border p-2.5 text-center transition ${index === 5 ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel)]"}`}><div className="font-mono text-[9px] text-[var(--accent)]">{number}</div><div className="mt-1 text-[10px] font-semibold">{title}</div></div>)}</div>
              <div className="mt-3 rounded-2xl border border-[var(--border)] bg-black/10 p-3 text-[10px] leading-5 text-[var(--muted)]">The product surface shows security state. It does not invent it. Connected records drive live posture; missing data remains visible as missing.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[[Fingerprint, "Identity", "Who can act?"],[Network, "Reachability", "What can it reach?"],[Bot, "Agency", "What can the agent do?"]].map(([Icon, title, question]) => { const C = Icon as typeof Fingerprint; return <div key={title as string} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:-translate-y-1 hover:border-[var(--accent-border)]"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><C className="h-5 w-5" /></div><div className="mt-5 text-base font-bold">{title as string}</div><div className="mt-1 text-xs text-[var(--muted)]">{question as string}</div></div>; })}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><GodsEyeGlobe /></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">The stack</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Less console. More outcome.</h2></div><p className="max-w-md text-xs leading-5 text-[var(--muted)]">The primary experience stays visual. The full explanations live under Platform, About and FAQ.</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{controls.map(([Icon, title, desc]) => { const C = Icon as typeof Radar; return <article key={title as string} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:-translate-y-1 hover:border-[var(--accent-border)]"><div className="flex items-center justify-between"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><C className="h-4 w-4" /></div><ArrowRight className="h-4 w-4 text-[var(--muted)] transition group-hover:translate-x-1 group-hover:text-[var(--accent)]" /></div><h3 className="mt-5 text-sm font-bold">{title as string}</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{desc as string}</p></article>; })}</div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><ObsidianIntelligence /></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[26px] border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"><Workflow className="h-4 w-4" /> Infinite Pentest</div><h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">A security system that checks whether the fix actually worked.</h2><div className="mt-7 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-[var(--border)] p-4"><div className="text-sm font-semibold">Before release</div><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Scan the change, validate exploitability, decide.</p></div><div className="rounded-xl border border-[var(--border)] p-4"><div className="text-sm font-semibold">After remediation</div><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Replay the condition and retain the proof.</p></div></div></div>
          <div className="rounded-[26px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-8"><Sparkles className="h-6 w-6 text-[var(--accent)]" /><h2 className="mt-4 text-2xl font-bold">Built around a simple promise.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Detect what matters. Act safely. Prove the outcome.</p><Link href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">How it works <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="border-t border-[var(--border)]"><div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20"><div className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Ready when you are</div><h2 className="mx-auto mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Make security a release condition, not a reporting exercise.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Start with the connected data you have. Expand the control plane as evidence becomes available.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white">Open Console <ArrowRight className="h-4 w-4" /></Link><Link href="/faq" className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Read FAQ</Link></div></div></section>
    </main>
  );
}
