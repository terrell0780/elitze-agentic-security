import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  Database,
  FileCheck2,
  GitBranch,
  KeyRound,
  Layers3,
  LockKeyhole,
  Network,
  ScanSearch,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import AcquisitionCta from "@/components/acquisition-cta";

export const metadata = {
  title: "ELITZE Agentic Security — Acquisition Brief",
  description:
    "A new acquisition brief for the ELITZE Agentic Security product asset, showing the implemented control plane, evidence boundary and diligence path.",
  alternates: { canonical: "/sales" },
};

const architecture = [
  ["DISCOVER", "Agents, MCP servers, tools and workloads", Network],
  ["REACH", "Observed paths across APIs, secrets and data", ScanSearch],
  ["ENFORCE", "Policy decisions before sensitive execution", ShieldCheck],
  ["VALIDATE", "Runtime observation, retesting and fix verification", Activity],
  ["EVIDENCE", "Provenance-bound records and auditable state", FileCheck2],
] as const;

const included = [
  ["Product surface", "Web application, authenticated console, security workbench and buyer-facing interfaces.", Layers3],
  ["Security system", "Policy enforcement, MCP controls, observation, progressive proofing and evidence handling.", ShieldCheck],
  ["Engineering asset", "TypeScript application code, database migrations, SDK and integration implementation.", TerminalSquare],
  ["Identity layer", "Session controls, MFA, passkeys/WebAuthn and enterprise SSO paths where configured.", KeyRound],
  ["Data plane", "Tenant-scoped persistence, evidence records and migrations required to operate the product.", Database],
  ["Source history", "Private repository history, build gates and technical diligence material for review.", GitBranch],
] as const;

const diligence = [
  "Repository and commit history",
  "Dependency, SBOM and lifecycle-script posture",
  "Authentication, session and tenant boundaries",
  "Database migrations and production data-plane requirements",
  "Implemented integrations and credential requirements",
  "Evidence states, limitations and verification boundaries",
  "Build, typecheck, lint and security self-tests",
  "Deployment configuration and buyer transition requirements",
];

const proofStates = [
  ["IMPLEMENTED", "Capability exists in the repository and is covered by code or static verification."],
  ["LIVE-DEPENDENT", "A production provider, credential, runner or data source is required before live behavior can be measured."],
  ["UNMEASURABLE", "ELITZE does not invent a result when the underlying evidence is unavailable."],
];

export default function SalesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center justify-between px-4 sm:px-7">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <b className="block text-sm tracking-[.14em]">ELITZE</b>
              <span className="block text-[8px] uppercase tracking-[.28em] text-[var(--muted)]">Acquisition brief</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/platform" className="hidden rounded-xl px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] sm:inline-flex">
              Platform
            </Link>
            <AcquisitionCta
              href="/sales/access"
              event="repository_access_request"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950"
            >
              Request diligence access <ArrowRight className="h-3.5 w-3.5" />
            </AcquisitionCta>
          </div>
        </div>
      </header>

      <section className="relative border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[var(--accent)]/[.08] blur-3xl" />
        <div className="relative mx-auto grid max-w-[1480px] gap-10 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1 text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">
              Private acquisition brief
            </div>
            <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[.92] tracking-[-.07em] sm:text-7xl lg:text-[86px]">
              Acquire the system.
              <span className="block text-[var(--accent)]">Take the roadmap.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-[var(--muted-strong)] sm:text-lg">
              ELITZE Agentic Security is offered as a complete early-stage product asset. This surface is a transaction brief—not a performance claim: it separates what is implemented, what requires live infrastructure, and what remains unmeasurable without evidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AcquisitionCta
                href="mailto:terrell0780@gmail.com?subject=ELITZE%20Agentic%20Security%20-%20acquisition%20inquiry"
                event="acquisition_inquiry"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"
              >
                Open acquisition conversation <ArrowRight className="h-4 w-4" />
              </AcquisitionCta>
              <AcquisitionCta
                href="/sales/access"
                event="repository_access_request"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold"
              >
                Review the diligence path
              </AcquisitionCta>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-[var(--accent-border)] bg-[var(--panel)] p-6 shadow-[0_30px_100px_rgba(0,0,0,.3)] sm:p-7">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-soft)] via-transparent to-transparent" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Transaction frame</span>
                <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[.18em] text-[var(--muted)]">Evidence-led</span>
              </div>
              <div className="mt-7 space-y-3">
                {[
                  ["Asset", "Complete ELITZE Agentic Security product asset"],
                  ["Commercial stage", "Early-stage / pre-revenue"],
                  ["Source", "Private repository; controlled diligence"],
                  ["Measurement", "Evidence-backed or explicitly unavailable"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)]/80 p-4">
                    <div className="text-[8px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">{label}</div>
                    <div className="mt-2 text-sm font-semibold leading-6">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-7 sm:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Control path</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-5xl">The product is a control loop.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--muted-strong)]">The architecture is organized around observing agentic behavior, enforcing policy at sensitive boundaries, validating changes and preserving evidence.</p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {architecture.map(([label, body, Icon], index) => (
              <div key={label} className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] tracking-[.2em] text-[var(--accent)]">0{index + 1}</span>
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div className="mt-7 text-sm font-black tracking-[.08em]">{label}</div>
                <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{body}</div>
                {index < architecture.length - 1 && <div className="pointer-events-none absolute right-0 top-1/2 hidden h-px w-3 translate-x-1/2 bg-[var(--accent-border)] md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Asset transfer map</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">What changes hands.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">The acquisition surface is built around the product itself: source, architecture, controls, interfaces, documentation and the materials required for technical diligence.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {included.map(([label, body, Icon]) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5">
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                  <div className="mt-4 text-sm font-bold">{label}</div>
                  <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Verification boundary</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">What is proven stays separate from what is pending.</h2>
            <div className="mt-8 space-y-3">
              {proofStates.map(([label, body]) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5">
                  <div className="text-[9px] font-black uppercase tracking-[.2em] text-[var(--accent)]">{label}</div>
                  <div className="mt-2 text-xs leading-6 text-[var(--muted-strong)]">{body}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 text-xs leading-6 text-[var(--muted-strong)]">
              RIO / ROI remains an evidence workflow. No financial result is presented where authorized inputs or underlying security evidence are missing.
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-[1480px] px-4 py-14 sm:px-7 sm:py-20">
          <div className="max-w-3xl">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Diligence sequence</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-5xl">A buyer can inspect the work in layers.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">Start with the repository and evidence model, then validate identity, data, integrations and live requirements before making transaction decisions.</p>
          </div>
          <div className="mt-9 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {diligence.map((item, index) => (
              <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="font-mono text-[9px] text-[var(--accent)]">STEP {String(index + 1).padStart(2, "0")}</div>
                <div className="mt-4 text-sm font-semibold leading-6">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="relative overflow-hidden rounded-[34px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-10 lg:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent)]/[.08] blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Next controlled step</div>
              <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-.05em] sm:text-5xl">Review the source. Verify the boundary. Then negotiate the transaction.</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">Repository access is private and handled through a controlled diligence process. Final transaction terms, ownership transfer, representations and closing conditions belong in the definitive agreement.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <AcquisitionCta href="/sales/access" event="repository_access_request" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">
                Request controlled access <ArrowRight className="h-4 w-4" />
              </AcquisitionCta>
              <Link href="/security" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">
                Review security surface
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1480px] flex-wrap gap-5 px-4 py-8 text-xs text-[var(--muted)] sm:px-7">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/security">Security</Link>
          <Link href="/">ELITZE</Link>
        </div>
      </footer>
    </main>
  );
}
