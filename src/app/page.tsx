"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Code2,
  Fingerprint,
  GitBranch,
  KeyRound,
  LockKeyhole,
  Menu,
  Moon,
  Network,
  Radar,
  ScanSearch,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  Sun,
  Workflow,
  X,
} from "lucide-react";

const controls = [
  [KeyRound, "Secrets scanning", "Find exposed keys, tokens and credentials across source and Git history."],
  [Code2, "SAST", "Inspect code changes for security defects before they become deployed behavior."],
  [GitBranch, "Supply-chain security", "Evaluate dependencies and package installation paths before release."],
  [ShieldEllipsis, "Runtime defense", "Apply application-layer controls to suspicious requests and behavior."],
  [ScanSearch, "Infinite Pentest", "Test every release, validate exploitability, remediate and retest the fix."],
  [LockKeyhole, "Agent guardrails", "Enforce identity, purpose, capability, data and tool boundaries before execution."],
];

const flow = [
  ["01", "Change", "A commit or deployment enters the security gate."],
  ["02", "Scan", "Code, secrets, dependencies, configuration and attack surface are evaluated."],
  ["03", "Pentest", "Authorized agents test relevant attack paths and validate real exploitability."],
  ["04", "Fix", "A candidate remediation is generated, tested and reviewed against policy."],
  ["05", "Retest", "The original finding is replayed against the fixed build."],
  ["06", "Release", "Only a passing security decision proceeds to production."],
];

function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("elitze-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const nextLight = stored ? stored === "light" : prefersLight;
    setLight(nextLight);
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
  }, []);

  function toggle() {
    const nextLight = !light;
    setLight(nextLight);
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
    window.localStorage.setItem("elitze-theme", nextLight ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
      title={`Switch to ${light ? "dark" : "light"} mode`}
      className="theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="ELITZE Agentic Security home">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">ELITZE</div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Agentic Security</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
            <Link href="/platform" className="transition hover:text-[var(--text)]">Platform</Link>
            <Link href="/security" className="transition hover:text-[var(--text)]">Security</Link>
            <Link href="/use-cases" className="transition hover:text-[var(--text)]">Use cases</Link>
            <Link href="/console" className="transition hover:text-[var(--text)]">Console</Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/console" className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(239,68,68,0.2)] transition hover:brightness-110 sm:inline-flex">
              Open Console
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-[var(--border)] px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {[["Platform", "/platform"], ["Security", "/security"], ["Use cases", "/use-cases"], ["Console", "/console"]].map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]">
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <section className="relative border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--accent-glow)] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-soft" />
              Autonomous application security
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              <span className="text-[var(--text)]">Pentest every release.</span><br />
              <span className="text-[var(--accent)]">Patch automatically.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted-strong)]">
              ELITZE continuously tests software, validates exploitability, enforces agent guardrails, and verifies remediation before vulnerable changes reach production.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/console" className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(239,68,68,0.22)] transition hover:brightness-110">
                Enter the console
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link href="/security" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--accent-border)]">
                Security model
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--muted)]">
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" /> Release security gate</span>
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" /> Evidence-backed decisions</span>
              <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[var(--accent)]" /> Mobile-first console</span>
            </div>
          </div>

          <div className="relative rounded-3xl border border-[var(--border-strong)] bg-[var(--panel-strong)] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><Radar className="h-4 w-4 text-[var(--accent)]" /> Release security</div>
              <span className="rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">Protected</span>
            </div>
            <div className="space-y-3 pt-4">
              {flow.slice(0, 5).map(([number, title, description]) => (
                <div key={number} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] font-mono text-[10px] font-bold text-[var(--accent)]">{number}</span>
                  <div><div className="text-sm font-semibold">{title}</div><div className="mt-0.5 text-xs leading-5 text-[var(--muted)]">{description}</div></div>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--success-border)] bg-[var(--success-soft)] p-3 text-xs font-semibold text-[var(--success)]">
                <Sparkles className="h-4 w-4" /> Fix verified. Release gate ready.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">One security system</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Find it. Prove it. Fix it. Prove the fix.</h2>
          <p className="mt-4 text-[var(--muted-strong)]">ELITZE combines application security, supply-chain controls, runtime defense and agentic guardrails into one security graph instead of a pile of disconnected scanners.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {controls.map(([Icon, title, description]) => {
            const C = Icon as typeof Radar;
            return <article key={title as string} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--accent-border)]">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><C className="h-5 w-5" /></div>
              <h3 className="mt-5 text-base font-bold">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description as string}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">Infinite Pentest</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Security becomes part of the release loop.</h2>
              <p className="mt-4 text-[var(--muted-strong)]">Every relevant change is tested against the security state ELITZE can actually observe. Confirmed weaknesses stay in the loop until the remediation is verified.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {flow.map(([number, title, description]) => <div key={number} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <span className="font-mono text-xs font-bold text-[var(--accent)]">{number}</span>
                <h3 className="mt-3 text-sm font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{description}</p>
              </div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Fingerprint, "Identity first", "Every governed action has an attributable subject and explicit capability boundary."],
            [Network, "Security graph", "Connect assets, identities, code, dependencies, tools and observed attack paths."],
            [Bot, "Agent-safe by design", "Models can recommend actions; the security boundary decides what is actually allowed."],
          ].map(([Icon, title, description]) => { const C = Icon as typeof Radar; return <div key={title as string} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"><C className="h-5 w-5 text-[var(--accent)]" /><h3 className="mt-4 font-bold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description as string}</p></div>; })}
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <Workflow className="mx-auto h-7 w-7 text-[var(--accent)]" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Self-securing software starts before production.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--muted-strong)]">Security findings become governed release decisions, not forgotten tickets.</p>
          <Link href="/console" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">Open ELITZE Console <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>ELITZE · Agentic Security</span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/platform" className="hover:text-[var(--text)]">Platform</Link>
            <Link href="/security" className="hover:text-[var(--text)]">Security</Link>
            <Link href="/use-cases" className="hover:text-[var(--text)]">Use cases</Link>
            <Link href="/console" className="hover:text-[var(--text)]">Console</Link>
            <Link href="/privacy" className="hover:text-[var(--text)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text)]">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
