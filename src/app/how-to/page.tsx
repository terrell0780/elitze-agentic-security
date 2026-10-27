"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Circle, ClipboardCheck, Fingerprint, MessageSquareText, Network, Radar, ShieldCheck, Wrench } from "lucide-react";

const guides = [
  {
    id: "start", category: "Getting started", title: "Set up a secure workspace",
    outcome: "Sign in, select the tenant workspace, and understand the visible status indicators.",
    steps: [
      "Create an account or sign in using the published authentication flow.",
      "Open the command center and confirm the active session.",
      "Treat missing database, provider, or telemetry evidence as a blocker—not as a clean bill of health.",
    ],
    href: "/console", cta: "Open command center", icon: Fingerprint,
  },
  {
    id: "connect", category: "Getting started", title: "Connect a security source",
    outcome: "Configure an integration and verify the data path instead of assuming that saved credentials mean connected telemetry.",
    steps: [
      "Open Integrations and choose a supported source.",
      "Configure secrets in the server-side secret store; never put provider keys in client code or source control.",
      "Run the available connection check and confirm that source state and observation time are reported.",
    ],
    href: "/console/integrations", cta: "Open integrations", icon: Radar,
  },
  {
    id: "investigate", category: "Investigations", title: "Run a source-backed investigation",
    outcome: "Inspect the actual event set, detection findings, confidence, provenance and evidence gaps.",
    steps: [
      "Open Agentic SOC or the analyst workspace.",
      "Refresh the source state and note the observed-event count and evidence window.",
      "Run analysis only when the expected input data is available; review every finding against its supporting event IDs.",
    ],
    href: "/console/agentic-soc", cta: "Open Agentic SOC", icon: Network,
  },
  {
    id: "cve", category: "Investigations", title: "Prioritize a vulnerability",
    outcome: "Combine public vulnerability intelligence with separately verified tenant asset context.",
    steps: [
      "Search by CVE, vendor, product or package in Vulnerability Intelligence.",
      "Review NVD, CISA KEV and EPSS source states separately.",
      "Do not describe a public CVE as affecting a tenant asset until inventory and reachability evidence support that conclusion.",
    ],
    href: "/console/vulnerabilities", cta: "Open vulnerability intelligence", icon: ShieldCheck,
  },
  {
    id: "validate", category: "Validation", title: "Run an authorized security check",
    outcome: "Keep the target scope, permission, safety limit and evidence record attached to a validation workflow.",
    steps: [
      "Confirm that the target belongs to the authorized scope and that you have permission to test it.",
      "Review rate limits, exclusions, impact boundaries and required approval before execution.",
      "Record the result and retest the original condition after remediation; do not use an empty result as proof of safety.",
    ],
    href: "/console/adversary-emulation", cta: "Open adversary emulation", icon: Wrench,
  },
  {
    id: "govern", category: "Access & approvals", title: "Review identity and execution policy",
    outcome: "Confirm that a model's answer is not treated as authorization to use a tool or modify a resource.",
    steps: [
      "Review the authenticated actor, tenant, role and delegated workload identity.",
      "Inspect requested tool capabilities, resource scope, policy decision and approval requirement.",
      "Keep high-impact execution pending until an authorized approver completes the required approval.",
    ],
    href: "/security", cta: "Read the security model", icon: Fingerprint,
  },
  {
    id: "chat", category: "Chat & agents", title: "Use governed ELITZE Chat",
    outcome: "Use tenant-scoped conversation and team collaboration while keeping provider connections and secrets server-side.",
    steps: [
      "Open ELITZE Chat after signing in.",
      "Select only a configured model or agent connection; connection status must be verified.",
      "Treat retrieved content and user-supplied files as untrusted input, and inspect evidence links before acting on recommendations.",
    ],
    href: "/chat", cta: "Open ELITZE Chat", icon: MessageSquareText,
  },
  {
    id: "release", category: "Evidence & release", title: "Check product readiness",
    outcome: "Use explicit gates to separate implemented code, configured dependencies, connected systems and verified controls.",
    steps: [
      "Open Production Readiness and examine each blocking check.",
      "Resolve configuration and schema gaps using the approved release process.",
      "Require passing build/CI, tenant-isolation tests, live integration evidence and retest proof before marking a release production-ready.",
    ],
    href: "/console/readiness", cta: "Open readiness dashboard", icon: ClipboardCheck,
  },
];

const categories = ["All", ...Array.from(new Set(guides.map((guide) => guide.category)))];

export default function HowToPage() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [openGuide, setOpenGuide] = useState("start");
  const [completed, setCompleted] = useState<string[]>([]);
  const visibleGuides = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter((guide) => (category === "All" || guide.category === category) &&
      (!q || [guide.title, guide.outcome, guide.category, ...guide.steps].join(" ").toLowerCase().includes(q)));
  }, [category, query]);
  const completedCount = completed.length;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><BookOpen className="size-4" /></span><span className="text-sm font-black tracking-[.12em]">ELITZE</span></Link>
          <nav aria-label="Help navigation" className="flex items-center gap-3 text-xs"><Link href="/about" className="text-[var(--muted)] hover:text-[var(--text)]">About</Link><Link href="/faq" className="text-[var(--muted)] hover:text-[var(--text)]">FAQ</Link><Link href="/console" className="rounded-xl bg-[var(--accent)] px-3.5 py-2.5 font-bold text-slate-950">Open console</Link></nav>
        </div>
      </header>
      <section className="border-b border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><BookOpen className="size-4" /> Interactive operator guides</div><h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">Do the work. Keep the proof.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">Short, actionable walkthroughs for setup, investigations, scanners, governed chat and release checks. Mark steps complete as you work; completion is local to this page and is not stored as audit evidence.</p></div>
            <div className="min-w-52 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="text-[9px] font-bold uppercase tracking-[.17em] text-[var(--muted)]">Your checklist</div><div className="mt-2 text-3xl font-black">{completedCount}<span className="text-base text-[var(--muted)]"> / {guides.length}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--border)]"><div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(completedCount / guides.length) * 100}%` }} /></div></div>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"><label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4"><span className="sr-only">Search guides</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search setup, investigation, scanners, chat, release…" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--muted)]" />{query && <button type="button" onClick={() => setQuery("")} className="text-xs text-[var(--muted)]">Clear</button>}</label><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={"shrink-0 rounded-xl border px-3 py-2.5 text-xs font-semibold " + (category === item ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]")}>{item}</button>)}</div></div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[.65fr_1.35fr]">
        <aside className="space-y-2">
          <div className="mb-3 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--muted)]">{visibleGuides.length} guides</div>
          {visibleGuides.map((guide, index) => { const done = completed.includes(guide.id); const Icon = guide.icon; return <button key={guide.id} type="button" onClick={() => setOpenGuide(guide.id)} aria-pressed={openGuide === guide.id} className={"flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition " + (openGuide === guide.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--accent-border)]")}><span className={"mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl " + (done ? "bg-emerald-400/10 text-emerald-400" : "bg-[var(--panel-strong)] text-[var(--accent)]")}>{done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}</span><span className="min-w-0 flex-1"><span className="block text-[9px] uppercase tracking-[.13em] text-[var(--muted)]">{guide.category} · {String(index + 1).padStart(2, "0")}</span><span className="mt-1 block text-sm font-bold">{guide.title}</span></span></button>; })}
          {!visibleGuides.length && <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">No guides match. Try a shorter search.</div>}
        </aside>
        <div className="space-y-4">
          {visibleGuides.filter((guide) => guide.id === openGuide).map((guide) => { const Icon = guide.icon; const done = completed.includes(guide.id); return <article key={guide.id} className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-8"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--accent)]"><Icon className="size-4" />{guide.category}</div><h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{guide.title}</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{guide.outcome}</p></div><button type="button" onClick={() => setCompleted((current) => done ? current.filter((item) => item !== guide.id) : [...current, guide.id])} className={"shrink-0 rounded-xl border px-3 py-2.5 text-xs font-bold " + (done ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-400" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]")}>{done ? "Marked done" : "Mark complete"}</button></div><ol className="mt-7 space-y-3">{guide.steps.map((step, index) => <li key={step} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><span className="grid size-7 shrink-0 place-items-center rounded-full border border-[var(--accent-border)] text-xs font-black text-[var(--accent)]">{index + 1}</span><span className="text-sm leading-6 text-[var(--muted-strong)]">{step}</span></li>)}</ol><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><Link href={guide.href} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-slate-950">{guide.cta}<ArrowRight className="size-4" /></Link><Link href="/faq" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--accent)]">Questions? Read the FAQ <ArrowRight className="size-3.5" /></Link></div></article>; })}
          {!visibleGuides.some((guide) => guide.id === openGuide) && <div className="rounded-3xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--muted)]">Choose a guide from the left to open its steps.</div>}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--section)] p-5 text-xs leading-5 text-[var(--muted)]"><b className="text-[var(--text)]">Operational rule:</b> a configured integration is not necessarily connected; a connected source is not necessarily complete; a scan is not proof of remediation until the original condition is retested.</div>
        </div>
      </section>
    </main>
  );
}
