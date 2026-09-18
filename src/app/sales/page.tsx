import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";
import AcquisitionCta from "@/components/acquisition-cta";

export const metadata = {
  title: "Enterprise Sales & Acquisition | ELITZE Agentic Security",
  description: "ELITZE Agentic Security enterprise licensing and complete product acquisition information, with evidence-gated RIO and ROI measurement.",
};

const capabilities = [
  "Agent and MCP discovery",
  "Tenant-scoped workload identity",
  "Reachability and security graph context",
  "Policy evaluation before sensitive execution",
  "Runtime observation and evidence",
  "Retesting and evidence-backed closure",
  "REO / RIO / ROE evidence controls",
  "Private repository and diligence access",
];

const included = [
  "ELITZE.ca domain",
  "Complete private source repository",
  "Git commit history",
  "Website and security console",
  "Authentication implementation",
  "Database schema and migrations",
  "ELITZE SDK",
  "Deployment documentation",
  "Security architecture documentation",
  "Product and sales materials",
  "Owned logos, designs and visual assets",
  "Transferable product accounts where legally transferable",
  "Ten hours of transition support over 30 days",
];

const excluded = [
  "Personal GitHub account",
  "Personal email account",
  "Personal banking and payment accounts",
  "Unrelated repositories",
  "Non-transferable vendor subscriptions",
  "Third-party intellectual property",
  "Future development beyond the transition allowance",
];

export default function SalesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></div>
            <span className="text-sm font-black tracking-[.18em]">ELITZE</span>
          </Link>
          <AcquisitionCta href="/sales/access" event="repository_access_request" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm font-semibold">
            Request source access <ArrowRight className="h-4 w-4" />
          </AcquisitionCta>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Enterprise / acquisition</div>
            <h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">ELITZE Agentic Security.</h1>
            <p className="mt-4 text-2xl font-semibold tracking-[-.02em] text-[var(--muted-strong)]">A security control plane built around identity, reach, policy, execution and proof.</p>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--muted-strong)]">For deployment, licensing, strategic partnership or outright acquisition, this is the buyer-facing operating view. Technical evidence, repository history, implementation status and commercial terms remain subject to diligence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AcquisitionCta
                href="mailto:terrell0780@gmail.com?subject=ELITZE%20Agentic%20Security%20-%20private%20technical%20review"
                event="acquisition_inquiry"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"
              >
                Request private technical review <ArrowRight className="h-4 w-4" />
              </AcquisitionCta>
              <AcquisitionCta href="/sales/access" event="repository_access_request" className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">
                Repository access process
              </AcquisitionCta>
            </div>
            <div className="mt-5 text-xs leading-5 text-[var(--muted)]">Measurement is consent-gated. No analytics event is treated as a qualified buyer, transaction, revenue event or security outcome.</div>
          </div>
          <div className="overflow-hidden rounded-[30px] border border-[var(--accent-border)] bg-black/20">
            <Image src="/elitze-command-plane-2026.svg" alt="ELITZE command plane acquisition visual" width={1600} height={1000} priority className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-9">
          <div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-[var(--accent)]" /><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Transaction</div></div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.035em]">Complete Product Acquisition</h2>
          <p className="mt-4 max-w-3xl text-lg font-semibold">ELITZE is available as a complete early-stage product asset acquisition.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">Asking price</div><div className="mt-2 text-3xl font-black">$18,000 USD</div></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">Accelerated cash-close</div><div className="mt-2 text-3xl font-black">Expedited close</div><div className="mt-2 text-sm text-[var(--muted-strong)]">Commercial terms can be agreed with a qualified buyer.</div></div>
          </div>
          <p className="mt-5 text-sm font-semibold text-[var(--muted-strong)]">Current acquisition terms are subject to written agreement and buyer diligence.</p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--muted-strong)]">The proposed transaction includes ELITZE.ca, the complete private source repository, owned brand assets, product documentation, SDK, database and deployment materials, and limited founder transition support.</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Private technical access is provided after buyer qualification and NDA. Capability and implementation claims remain subject to technical diligence.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">RIO / ROI</div>
          <h2 className="mt-3 text-2xl font-black">Measured business value only when the evidence exists.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">ELITZE separates observed security results from business impact and financial assumptions. No public acquisition metric is presented as revenue, savings, ROI or customer outcome without its underlying source.</p>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[var(--accent)]">RIO · Result</div><div className="mt-2 text-sm font-semibold">Observed control decisions and runtime evidence.</div><div className="mt-2 text-xs leading-5 text-[var(--muted)]">Source: connected ELITZE records. No source means unavailable.</div></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[var(--accent)]">RIO · Impact</div><div className="mt-2 text-sm font-semibold">Security or business significance supported by evidence.</div><div className="mt-2 text-xs leading-5 text-[var(--muted)]">Monetary impact requires an approved customer financial basis.</div></div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5"><div className="font-mono text-[9px] uppercase tracking-[.2em] text-[var(--accent)]">ROI · Outcome</div><div className="mt-2 text-sm font-semibold">Financial return only after benefit and cost are evidenced.</div><div className="mt-2 text-xs leading-5 text-[var(--muted)]">No defaults, synthetic savings, rankings or projected revenue are used as facts.</div></div>
          </div>
          <div className="mt-6 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 text-sm leading-6 text-[var(--muted-strong)]"><b className="text-[var(--text)]">Current public state:</b> no acquisition revenue, customer savings, conversion rate or ROI percentage is asserted here because no authorized underlying dataset is connected to the public sales surface.</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-4 sm:px-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><h2 className="text-2xl font-black">Included</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{included.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm leading-6 text-[var(--muted-strong)]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />{item}</div>)}</div></div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><h2 className="text-2xl font-black">Excluded</h2><div className="mt-6 grid gap-3">{excluded.map((item) => <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm leading-6 text-[var(--muted-strong)]">{item}</div>)}</div></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
          <div className="flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-[var(--accent)]" /><h2 className="text-2xl font-black">Buyer diligence</h2></div>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--muted-strong)]">No synthetic metrics or invented production claims are used as diligence evidence. A serious buyer should validate source code, dependency posture, CI gates, deployment configuration, database state, integrations, identity controls, tenancy, telemetry and runtime performance.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{capabilities.map((item, i) => <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><div className="font-mono text-[9px] text-[var(--accent)]">0{i + 1}</div><div className="mt-2 text-sm font-semibold">{item}</div></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><h2 className="text-2xl font-black">Private source access</h2><p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">The canonical source repository is private. Qualified buyers can request controlled technical review; repository access is handled separately after qualification and NDA.</p><AcquisitionCta href="/sales/access" event="repository_access_request" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Request repository access <ArrowRight className="h-4 w-4" /></AcquisitionCta></div>
          <div className="rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-8"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Operating promise</div><h2 className="mt-3 text-2xl font-black">Pentest every release. Govern every agent. Verify every fix.</h2><p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">The model is not the security boundary. ELITZE is designed around policy, identity, reachability, evidence and verification.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-xs leading-5 text-[var(--muted)]"><b className="text-[var(--text)]">Trust disclosure:</b> Third-party references are informational only and do not imply endorsement, certification, partnership or affiliation with ELITZE unless a separate written relationship exists. Product capabilities, implementation status and commercial terms remain subject to technical and legal diligence.</div>
        <footer className="mt-8 flex flex-wrap gap-5 pb-10 text-xs text-[var(--muted)]"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/">Home</Link></footer>
      </section>
    </main>
  );
}
