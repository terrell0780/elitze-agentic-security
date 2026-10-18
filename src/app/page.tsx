"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Crosshair, Menu, ShieldCheck, X } from "lucide-react";
import GlobalThemeToggle from "@/components/global-theme-toggle";
import AcquisitionCta from "@/components/acquisition-cta";
import SecurityWorkspacePreview from "@/components/security-workspace-preview";

const primaryLinks = [
  ["Workspace", "/workspace"],
  ["Platform", "/platform"],
  ["Security", "/security"],
  ["Validation", "/console/pentesting"],
  ["Integrations", "/integrations"],
  ["Documentation", "/docs"],
] as const;

const controlPoints = [
  {
    number: "01",
    title: "Identity",
    question: "Who or what is acting?",
    detail: "Anchor agent and workload activity to a defined identity and tenant boundary.",
  },
  {
    number: "02",
    title: "Reachability",
    question: "What can it actually reach?",
    detail: "Map the observed path from an identity to MCP servers, tools, APIs, and sensitive data.",
  },
  {
    number: "03",
    title: "Policy",
    question: "Should this action proceed?",
    detail: "Evaluate sensitive actions at the authorization boundary, before tool execution.",
  },
  {
    number: "04",
    title: "Evidence",
    question: "What can be proven?",
    detail: "Keep decisions, observations, and retest outcomes tied to their source.",
  },
] as const;

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="ELITZE Agentic Security home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <b className="block text-sm tracking-[.12em]">ELITZE</b>
              <span className="block text-[8px] uppercase tracking-[.26em] text-[var(--muted)]">Agentic Security</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-xs font-semibold text-[var(--muted)] xl:flex" aria-label="Primary navigation">
            {primaryLinks.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-[var(--text)]">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
<AcquisitionCta
              href="/workspace"
              event="console_open"
              className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110 sm:inline-flex"
            >
              Open workspace
            </AcquisitionCta>
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] xl:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <GlobalThemeToggle embedded />
          </div>
        </div>

        {mobileOpen && (
          <nav id="mobile-navigation" className="border-t border-[var(--border)] px-4 py-3 xl:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-[1400px] flex-col gap-1">
              {primaryLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--text)]"
                >
                  {label}
                </Link>
              ))}
<Link href="/workspace" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[var(--accent-soft)] px-3 py-3 text-sm font-semibold text-[var(--accent)]">
                Open workspace
              </Link>
            </div>
          </nav>
        )}
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
        <div className="pointer-events-none absolute left-[62%] top-[-220px] h-[650px] w-[650px] rounded-full bg-[var(--accent-glow)] blur-3xl" />
        <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">
              Agent identity · MCP runtime security
            </div>
            <h1 className="mt-7 max-w-3xl text-[3.25rem] font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-[4.65rem]">
              Govern AI agents
              <br />
              <span className="text-[var(--accent)]">before they act.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted-strong)]">
              Discover agent and MCP identities, map what they can reach, enforce policy before sensitive tool execution, and preserve evidence you can verify.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AcquisitionCta
                href="/workspace"
                event="console_open"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110"
              >
                Open workspace <ArrowRight className="h-4 w-4" />
              </AcquisitionCta>
              <Link href="/security" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--border-strong)]">
                Explore the security model <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
              Evidence-led by design. Missing or unverified state is not presented as a confirmed security result.
            </p>
          </div>
          <SecurityWorkspacePreview />
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="max-w-3xl">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">The control model</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Four questions. One governed path.</h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
            Keep identity, authorization, execution, and verification connected—without treating a model response or a dashboard state as proof.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {controlPoints.map((point) => (
            <article key={point.number} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:border-[var(--border-strong)]">
              <div className="font-mono text-[10px] text-[var(--accent)]">{point.number}</div>
              <h3 className="mt-4 text-lg font-bold">{point.title}</h3>
              <p className="mt-2 text-sm font-semibold">{point.question}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{point.detail}</p>
            </article>
          ))}
        </div>
      </section>



      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-14 sm:px-7 sm:py-18 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Endpoint threat intelligence</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Bring endpoint evidence into the agent security control plane.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">
              Connect SentinelOne Singularity to ingest actual endpoint and threat records alongside agent identities, MCP reachability, and policy evidence. ELITZE distinguishes provider observations from verified response outcomes.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Threat and endpoint inventory", "Source-attributed evidence", "Read-only connection validation"].map((item) => (
                <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--muted-strong)]">
                  {item}
                </span>
              ))}
            </div>
            <Link href="/integrations" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110">
              Explore integrations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--muted)]">SentinelOne Singularity</p>
                <h3 className="mt-3 text-xl font-bold">Endpoint security integration</h3>
              </div>
              <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--accent)]" />
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Connector code is deployed with the ELITZE application. A customer console URL and authorized API token are required before a live connection can be confirmed.
            </p>
            <div className="mt-5 rounded-xl border border-[var(--border)] px-4 py-3">
              <p className="text-xs font-semibold">Live provider connection</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Not verified until credentials are configured and authenticated API checks pass.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-7 sm:py-12">
        <Link href="/about" className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 transition hover:border-[var(--accent-border)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">About ELITZE</div>
            <h2 className="mt-2 text-xl font-bold tracking-tight">Explore the platform and its security controls</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Product architecture, capability details, and the Sara + ELITZE agent model in one place.</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--accent)]">About ELITZE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-14 sm:px-7 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Authorized validation</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Test the path. Verify the fix.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">
              Define an authorized scope, validate a security condition, preserve the evidence, and retest the affected path after remediation.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Explicit scope", "Controlled execution", "Evidence and retest"].map((item) => (
                <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--muted-strong)]">
                  {item}
                </span>
              ))}
            </div>
            <Link href="/console/pentesting" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110">
              <Crosshair className="h-4 w-4" /> Open validation workbench <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-[var(--accent-border)] bg-black/20 shadow-[0_30px_100px_rgba(0,0,0,.25)]">
            <Image src="/elitze-security-validation.svg" alt="ELITZE authorized security validation, evidence collection, and retest workflow" width={1600} height={900} className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Secure workspace</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Operate from one governed workspace.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
              Open the ELITZE workspace to inspect tenant posture, agent identities, policy decisions, authorized validation, and source-bound evidence.
            </p>
          </div>
          <Link href="/workspace" className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 lg:mt-0">
            Open workspace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-7 text-xs text-[var(--muted)] sm:px-7">
          <span>ELITZE Agentic Security · Agent identity and MCP runtime security</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
            <Link href="/security" className="hover:text-[var(--text)]">Security</Link>
            <Link href="/privacy" className="hover:text-[var(--text)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text)]">Terms</Link>
            <Link href="/contact" className="hover:text-[var(--text)]">Contact</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
