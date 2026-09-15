"use client";

import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { ArrowRight, Bot, Check, Fingerprint, Globe2, LockKeyhole, Menu, Network, ShieldCheck, Sun, Workflow, X } from "lucide-react";
import { ThreatSurface } from "@/components/threat-surface";
import GodsEyeGlobe from "@/components/gods-eye-globe";
import GlobalSecurityCommandLayer from "@/components/global-security-command-layer";

const cards = [
  [Fingerprint, "Workload identity", "Bind agents, MCP servers and tools to tenant-scoped workload identities."],
  [Bot, "Agent + MCP discovery", "Inventory real agents, MCP servers and tool identities from connected sources."],
  [Network, "Reachability", "Map observed identity-to-tool, API, secret and data relationships."],
  [LockKeyhole, "Policy before execution", "Evaluate sensitive tool actions before they reach the authorized execution path."],
  [Workflow, "Tamper-evident evidence", "Preserve the request, decision, policy context and evidence chain."],
  [Check, "Retest", "Validate the affected path again before treating a security condition as removed."],
] as const;

const responseLoop = [
  ["01", "Discover", "Record a real agent, MCP server, model or tool from an authorized source."],
  ["02", "Identify", "Bind the workload to a verifiable identity and tenant scope."],
  ["03", "Map reach", "Record observed tools, APIs, secrets and data the identity can reach."],
  ["04", "Decide", "Evaluate the requested action against an enabled ELITZE policy."],
  ["05", "Execute", "Allow only through a separately authorized gateway or enforcement point."],
  ["06", "Prove", "Observe the result, retest the path and preserve evidence of the outcome."],
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
      <div className="order-2 lg:order-1"><div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-soft" /> Agent Identity + MCP Runtime Security</div><h1 className="mt-6 max-w-3xl text-[3.2rem] font-black leading-[.9] tracking-[-.07em] sm:text-6xl lg:text-7xl xl:text-[5.1rem]">Discover the agent.<br /><span className="text-[var(--accent)]">Control the path.</span><br />Prove the outcome.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/console" className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_38px_rgba(34,211,238,.16)]">Enter ELITZE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link><Link href="/sales" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Acquire / Enterprise <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-8 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]"><span className="rounded-full border border-[var(--border)] px-3 py-1.5">Agent discovery</span><span className="rounded-full border border-[var(--border)] px-3 py-1.5">MCP runtime</span><span className="rounded-full border border-[var(--border)] px-3 py-1.5">Identity reach</span><span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[var(--accent)]">Evidence-bound</span></div></div>
      <div id="threat-surface" className="order-1 lg:order-2"><ThreatSurface /></div>
    </div></section>

    <section className="border-b border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]"><span className="text-[var(--accent)]">Discover</span><span>→</span><span>Identify</span><span>→</span><span>Map Reach</span><span>→</span><span>Decide</span><span>→</span><span>Execute</span><span>→</span><span className="text-[var(--accent)]">Prove</span></div></div></section>

    <section id="global-security" className="border-b border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="mb-6 flex items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><Globe2 className="h-4 w-4" /> ELITZE Security View</div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] sm:text-4xl">See identity, reach, policy and evidence in one control surface.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">The visual layer reflects authorized security records. Missing telemetry remains missing rather than becoming an invented operational state.</p></div><Link href="/security" className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[var(--accent)] sm:inline-flex">How the controls work <ArrowRight className="h-4 w-4" /></Link></div><GodsEyeGlobe /><GlobalSecurityCommandLayer /></div></section>

    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([Icon, title, desc], i) => <article key={title} className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-border)]"><div className="absolute right-4 top-4 font-mono text-[9px] text-[var(--muted)]">0{i + 1}</div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Icon className="h-5 w-5" /></div><h2 className="mt-5 text-base font-bold">{title}</h2><p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{desc}</p><div className="mt-6 h-px w-10 bg-[var(--accent)] transition-all group-hover:w-20" /></article>)}</div></section>

    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="mb-8 max-w-3xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><Workflow className="h-4 w-4" /> Real control path</div><h2 className="mt-3 text-3xl font-black tracking-[-.035em] sm:text-4xl">The same request must survive every security boundary.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Every step is expected to resolve to real tenant-scoped records, authorization, execution evidence, runtime observation and retest evidence.</p></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{responseLoop.map(([num, title, desc]) => <article key={num} className="relative rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="font-mono text-[10px] text-[var(--accent)]">{num}</div><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{desc}</p></article>)}</div></section>

    <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Production truth</div><h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-.035em] sm:text-4xl">No record. No claim.</h2><div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">{["Observed", "Authorized", "Retested", "Evidence", "Tenant-bound", "Live-source"].map((step, i) => <div key={step} className={`rounded-xl border p-3 ${i === 5 ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel-strong)]"}`}><div className="font-mono text-[9px] text-[var(--accent)]">0{i + 1}</div><div className="mt-2 text-xs font-semibold">{step}</div></div>)}</div></div><div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-8"><ShieldCheck className="h-6 w-6 text-[var(--accent)]" /><h2 className="mt-4 text-2xl font-bold">No synthetic operational state.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">No mock records, fake telemetry, simulated events or invented metrics are valid production evidence. Missing data remains visibly missing.</p><div className="mt-7 space-y-2 text-xs font-semibold"><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]" /> Source-bound records</div><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]" /> Policy-bound execution</div><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]" /> Retest-backed closure</div></div></div></div></div></section>

    <section className="border-t border-[var(--border)]"><div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20"><div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">Initial category</div><h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black tracking-[-.04em] sm:text-5xl">Agent Identity and MCP Runtime Security.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Start with one security promise that can be demonstrated end-to-end. Expand only when the next control path is actually connected and verified.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950">Open Console <ArrowRight className="h-4 w-4" /></Link><Link href="/sales" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Acquisition / Enterprise sales</Link></div></div></section>

    <footer className="border-t border-[var(--border)] bg-[var(--section)]"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6"><div>© 2026 ELITZE Agentic Security. All rights reserved.</div><nav className="flex flex-wrap gap-4"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/sales">Sales / Acquisition</Link><Link href="/security">Security</Link></nav></div></footer>
  </main>;
}
