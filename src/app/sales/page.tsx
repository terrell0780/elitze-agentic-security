import Link from "next/link";
import { ArrowRight, Check, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import AcquisitionCta from "@/components/acquisition-cta";

export const metadata = {
  title: "ELITZE Agentic Security — Acquisition",
  description: "Buyer-facing acquisition surface for ELITZE Agentic Security, including product scope, diligence boundaries and evidence-gated RIO / ROI measurement.",
  alternates: { canonical: "/sales" },
};

const assets = [
  "ELITZE.info public product surface",
  "Canonical private source repository and commit history",
  "Application interface and security console",
  "Authentication implementation",
  "Database schema and migrations",
  "ELITZE SDK and implemented integration code",
  "Security architecture and product documentation",
  "Acquisition and technical diligence materials",
  "Owned ELITZE brand and visual assets",
  "Founder transition allowance described in the written agreement",
];

const controls = [
  ["DISCOVER", "Agent, MCP, tool and workload discovery"],
  ["IDENTITY", "Tenant-scoped workload identity"],
  ["REACH", "Observed paths across tools, APIs, secrets and data"],
  ["ENFORCE", "Policy evaluation before sensitive execution"],
  ["VALIDATE", "Runtime observation and retesting"],
  ["EVIDENCE", "Provenance-bound records and auditable state"],
];

const diligence = [
  "Repository and commit history review",
  "Dependency and lifecycle-script posture",
  "Application build, typecheck and lint gates",
  "Authentication, tenancy and authorization boundaries",
  "Database schema, migrations and data-plane dependencies",
  "Implemented integrations and their required credentials",
  "Runtime behavior and deployment configuration",
  "Evidence model, limitations and measurement states",
];

export default function SalesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-7">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span><span><b className="block text-sm tracking-[.12em]">ELITZE</b><span className="block text-[8px] uppercase tracking-[.25em] text-[var(--muted)]">Acquisition</span></span></Link>
          <div className="flex items-center gap-2"><Link href="/platform" className="hidden rounded-xl px-3 py-2 text-xs text-[var(--muted)] sm:inline-flex">Platform</Link><AcquisitionCta href="/sales/access" event="repository_access_request" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950">Request diligence access <ArrowRight className="h-3.5 w-3.5" /></AcquisitionCta></div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
        <div className="relative mx-auto max-w-[1400px] px-4 py-16 sm:px-7 sm:py-24 lg:py-28">
          <div className="max-w-5xl">
            <div className="text-[9px] font-bold uppercase tracking-[.28em] text-[var(--accent)]">Complete product acquisition</div>
            <h1 className="mt-5 text-5xl font-black leading-[.9] tracking-[-.07em] sm:text-7xl">Acquire the control plane.<br /><span className="text-[var(--accent)]">Verify everything.</span></h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE Agentic Security is presented for outright acquisition as an early-stage product asset. The buyer surface is intentionally evidence-led: implemented capabilities, source boundaries, dependencies and diligence requirements are stated separately.</p>
            <div className="mt-8 flex flex-wrap gap-3"><AcquisitionCta href="mailto:terrell0780@gmail.com?subject=ELITZE%20Agentic%20Security%20-%20acquisition%20inquiry" event="acquisition_inquiry" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Start acquisition inquiry <ArrowRight className="h-4 w-4" /></AcquisitionCta><AcquisitionCta href="/sales/access" event="repository_access_request" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Controlled source review</AcquisitionCta></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-7 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[30px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-10"><div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-[var(--accent)]" /><span className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Transaction scope</span></div><h2 className="mt-4 text-3xl font-black tracking-[-.04em]">Outright asset acquisition</h2><p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">The proposed transaction covers the ELITZE product asset set identified below. Final ownership, transfer mechanics, representations, warranties, consideration and closing conditions belong in the executed agreement.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">Reference asking price</div><div className="mt-2 text-3xl font-black">$18,000 USD</div><div className="mt-2 text-xs leading-5 text-[var(--muted)]">Subject to written agreement and diligence.</div></div><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">Access</div><div className="mt-2 text-xl font-black">Controlled review</div><div className="mt-2 text-xs leading-5 text-[var(--muted)]">Qualification and NDA precede private source access.</div></div></div></div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-10"><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Buyer principle</div><h2 className="mt-4 text-3xl font-black tracking-[-.04em]">No unsupported value claim.</h2><p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">No customer count, revenue, benchmark, certification, savings, ROI percentage or security outcome is presented as fact unless an underlying authorized record supports it.</p><div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5 text-xs leading-6 text-[var(--muted)]">RIO / ROI measurement is an evidence workflow, not a marketing number. Security observations and financial assumptions remain separate until both are supported.</div></div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20"><div className="max-w-3xl"><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Product asset</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">What the buyer is acquiring.</h2><p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">The product architecture centers on a security control path rather than a passive dashboard.</p></div><div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{controls.map(([label,body]) => <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="font-mono text-[9px] text-[var(--accent)]">{label}</div><div className="mt-3 text-sm font-semibold">{body}</div></div>)}</div></div></section>

      <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20"><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9"><h2 className="text-2xl font-black">Included asset set</h2><div className="mt-6 grid gap-2">{assets.map((x) => <div key={x} className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3 text-sm leading-6 text-[var(--muted-strong)]"><Check className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />{x}</div>)}</div></div><div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9"><div className="flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-[var(--accent)]" /><h2 className="text-2xl font-black">Diligence checklist</h2></div><div className="mt-6 grid gap-2">{diligence.map((x,i) => <div key={x} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><span className="mr-3 font-mono text-[9px] text-[var(--accent)]">0{i+1}</span><span className="text-sm text-[var(--muted-strong)]">{x}</span></div>)}</div></div></div></section>

      <section className="mx-auto max-w-[1400px] px-4 pb-14 sm:px-7 sm:pb-20"><div className="rounded-[30px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 text-center sm:p-10"><div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Next controlled step</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Review the source. Validate the boundary. Decide the transaction.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">Private repository access is handled separately from the public sales surface and remains subject to qualification, NDA and written terms.</p><div className="mt-7 flex justify-center"><AcquisitionCta href="/sales/access" event="repository_access_request" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Request controlled access <ArrowRight className="h-4 w-4" /></AcquisitionCta></div></div></section>

      <footer className="border-t border-[var(--border)]"><div className="mx-auto flex max-w-[1400px] flex-wrap gap-5 px-4 py-8 sm:px-7 text-xs text-[var(--muted)]"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/">ELITZE</Link></div></footer>
    </main>
  );
}
