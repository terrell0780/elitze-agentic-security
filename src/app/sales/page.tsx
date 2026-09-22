import Link from "next/link";
import { ArrowRight, Check, FileCheck2, LockKeyhole, Network, ShieldCheck } from "lucide-react";
import AcquisitionCta from "@/components/acquisition-cta";
import FrontierHero from "@/components/frontier-hero";

export const metadata = {
  title: "ELITZE Agentic Security — Acquisition",
  description:
    "Buyer-facing acquisition surface for ELITZE Agentic Security: product scope, multi-system security architecture, transfer package, diligence boundaries and evidence standards.",
  alternates: { canonical: "/sales" },
};

const systems = [
  {
    label: "AI / AGENTS / MCP",
    body: "Agent identity, delegated capabilities, tool governance, policy decisions and runtime control.",
    state: "Documented product scope",
  },
  {
    label: "APIs / APPLICATIONS",
    body: "API and OpenAPI controls, application security context, authorization paths and protected execution.",
    state: "Documented product scope",
  },
  {
    label: "CODE / SUPPLY CHAIN",
    body: "Software and dependency context connected to security findings, release validation and evidence.",
    state: "Documented product scope",
  },
  {
    label: "CLOUD / IDENTITY / DATA",
    body: "Cloud posture, identities, sensitive-data pathways and authorization context across connected systems.",
    state: "Integration-dependent",
  },
  {
    label: "EXPOSURE / VULNERABILITY",
    body: "CVE, KEV, EPSS, attack-path and reachability context tied to remediation and retesting.",
    state: "Integration-dependent",
  },
  {
    label: "SOC / RESPONSE",
    body: "Investigation, approvals, controlled response, containment and audit/evidence workflows.",
    state: "Integration-dependent",
  },
  {
    label: "PENTEST / VALIDATION",
    body: "Authorized security testing, rules of engagement, evidence capture, retesting and closure proof.",
    state: "Authorization + executor dependent",
  },
  {
    label: "REO / RIO / GOVERNANCE",
    body: "Provenance, evidence state, outcome measurement, publishing and buyer-grade diligence controls.",
    state: "Evidence-gated",
  },
];

const controlPath = [
  ["01", "DISCOVER", "Map identities, agents, tools, APIs, assets and connected security sources."],
  ["02", "EXPLAIN", "Join the security graph, exposure, reachability and contextual evidence."],
  ["03", "AUTHORIZE", "Evaluate policy before a consequential action crosses a protected boundary."],
  ["04", "ACT", "Execute only through the separately controlled action path."],
  ["05", "RETEST", "Run authorized validation against the affected condition."],
  ["06", "PROVE", "Preserve source, decision, action, retest and outcome evidence."],
];

const assets = [
  "ELITZE Agentic Security application source and repository history",
  "Security console and product UI implementation",
  "Authentication, authorization and tenant-boundary implementation",
  "Database schema, migrations and database-backed API surface",
  "ELITZE SDK and implemented integration framework",
  "Security architecture, policy, evidence and validation documentation",
  "Pentest request workflow and evidence-expression tooling in the repository",
  "Owned ELITZE brand and visual assets, subject to ownership verification",
  "ELITZE.info domain, if transferable under the definitive agreement",
  "Acquisition, diligence, handoff and technical transfer materials",
];

const diligence = [
  "Exact transfer commit, repository history and ownership boundary",
  "Dependency inventory, license review, SBOM and secret-history review",
  "Typecheck, lint, test, sale-readiness and production-build results",
  "Authentication, session, RBAC, tenant isolation and authorization paths",
  "Database migrations, required environment variables and runtime dependencies",
  "Configured versus unavailable integrations and external executors",
  "Security graph, policy enforcement, audit ledger and evidence state model",
  "Pentest / ROE boundaries, retesting controls and containment behavior",
  "Public-claim, IP, domain, brand and third-party rights review",
  "Buyer-controlled deployment verification before closing",
];

const buyerFits = [
  "Cybersecurity platforms expanding into agentic security",
  "AI-security or developer-security companies adding a governed control plane",
  "MSSPs and security service providers building a reusable platform layer",
  "Enterprise software groups integrating security into existing portfolios",
  "Strategic acquirers seeking an extensible security-product foundation",
];

export default function SalesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-7">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <b className="block text-sm tracking-[.12em]">ELITZE</b>
              <span className="block text-[8px] uppercase tracking-[.25em] text-[var(--muted)]">Acquisition</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/platform" className="hidden rounded-xl px-3 py-2 text-xs text-[var(--muted)] sm:inline-flex">
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

      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
        <div className="relative mx-auto max-w-[1400px] px-4 py-16 sm:px-7 sm:py-24 lg:py-28">
          <div className="max-w-5xl">
            <div className="text-[9px] font-bold uppercase tracking-[.28em] text-[var(--accent)]">
              Complete product acquisition
            </div>
            <h1 className="mt-5 text-5xl font-black leading-[.9] tracking-[-.07em] sm:text-7xl">
              Acquire the security foundation.
              <br />
              <span className="text-[var(--accent)]">Verify the boundary.</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
              ELITZE Agentic Security is offered as a complete pre-revenue product asset acquisition.
              The buyer surface separates implemented product structure, integration dependencies,
              evidence limitations and transaction scope instead of treating architecture as proof of production outcomes.
            </p>
            <div className="mt-10">
              <FrontierHero
                src="/frontier-acquisition.svg"
                alt="ELITZE acquisition visual showing a governed security core connected to cloud, code, identity, data and runtime systems."
                eyebrow="ELITZE ASSET SURFACE"
                label="ACQUISITION VIEW"
              />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <AcquisitionCta
                href="mailto:tsh_cook@hotmail.com?subject=ELITZE%20Agentic%20Security%20-%20acquisition%20inquiry"
                event="acquisition_inquiry"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"
              >
                Discuss acquisition <ArrowRight className="h-4 w-4" />
              </AcquisitionCta>
              <AcquisitionCta
                href="/sales/access"
                event="repository_access_request"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold"
              >
                Controlled source review
              </AcquisitionCta>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-7 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[30px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-10">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-[var(--accent)]" />
              <span className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">
                Transaction scope
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">Outright asset acquisition</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
              The proposed transaction covers the ELITZE product asset set identified below. Consideration,
              representations, warranties, closing conditions and final transfer mechanics are negotiated
              privately and defined in the executed agreement.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">
                  Commercial terms
                </div>
                <div className="mt-2 text-2xl font-black">Private negotiation</div>
                <div className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  No fixed asking price is published on the public acquisition surface.
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">Access</div>
                <div className="mt-2 text-xl font-black">Controlled review</div>
                <div className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  Buyer identification, qualification and NDA precede private source access.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-10">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">
              Acquisition standard
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">No unsupported value claim.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
              Revenue, customers, benchmarks, certifications, savings, rankings, traffic, ROI percentages
              and security outcomes are not presented as established facts unless the underlying evidence
              is available and independently reviewable.
            </p>
            <div className="mt-7 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5 text-xs leading-6 text-[var(--muted)]">
              REO / RIO / ROE are evidence disciplines. Observed, inferred, simulated, unavailable and
              unmeasurable states remain distinct throughout diligence.
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">
              <Network className="h-4 w-4" />
              Multi-system security surface
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-5xl">
              One control model across the systems that agents can touch.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
              The acquisition is not framed as a single scanner or a single alert surface. The repository
              organizes security context around multiple connected systems, with actual runtime coverage
              determined by deployment configuration, credentials, executors and authorized data sources.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {systems.map((system) => (
              <div key={system.label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="font-mono text-[9px] tracking-[.16em] text-[var(--accent)]">{system.label}</div>
                <div className="mt-3 text-sm font-semibold leading-6">{system.body}</div>
                <div className="mt-4 text-[9px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">
                  {system.state}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Control path</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">From signal to proof.</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
              The documented operating model is a governed security loop, not a collection of isolated screens.
            </p>
            <div className="mt-7 grid gap-2">
              {controlPath.map(([number, label, body]) => (
                <div key={number} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[9px] text-[var(--accent)]">{number}</span>
                    <div>
                      <div className="text-sm font-bold">{label}</div>
                      <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Buyer thesis</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">
              The model is not the security boundary.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
              ELITZE is built around the idea that agent output should remain inside a separately governed
              security boundary. Policy, authorization, action control, continuous validation and evidence
              become the durable layer around changing models, tools and workloads.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["Agent reach", "Map what an identity or agent can actually reach."],
                ["Policy boundary", "Evaluate permission before consequential execution."],
                ["Pentest loop", "Validate authorized attack paths and retest fixes."],
                ["Evidence discipline", "Separate observed evidence from inference and absence."],
              ].map(([label, body]) => (
                <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                  <div className="text-sm font-bold">{label}</div>
                  <div className="mt-2 text-xs leading-5 text-[var(--muted)]">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
              <h2 className="text-2xl font-black">Included asset set</h2>
              <div className="mt-6 grid gap-2">
                {assets.map((asset) => (
                  <div
                    key={asset}
                    className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3 text-sm leading-6 text-[var(--muted-strong)]"
                  >
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--accent)]" />
                    {asset}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
              <div className="flex items-center gap-3">
                <FileCheck2 className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-2xl font-black">Diligence checklist</h2>
              </div>
              <div className="mt-6 grid gap-2">
                {diligence.map((item, index) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"
                  >
                    <span className="mr-3 font-mono text-[9px] text-[var(--accent)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-[var(--muted-strong)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Buyer fit</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Built to enter an existing security system.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
            Different acquirers can take the same underlying control-plane foundation in different directions.
            The acquisition package therefore describes the transferable engineering base and the system boundaries
            rather than promising a single commercial model.
          </p>
          <div className="mt-7 grid gap-2 md:grid-cols-2">
            {buyerFits.map((fit) => (
              <div key={fit} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm text-[var(--muted-strong)]">
                <Check className="mr-2 inline-block h-4 w-4 text-[var(--accent)]" />
                {fit}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-14 sm:px-7 sm:pb-20">
        <div className="rounded-[30px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 text-center sm:p-10">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Next controlled step</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">
            Review the source. Validate the boundary. Decide the transaction.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">
            Private repository access is handled separately from the public sales surface and remains subject
            to qualification, NDA and written terms. The public page intentionally does not publish a fixed asking price.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <AcquisitionCta
              href="/sales/access"
              event="repository_access_request"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"
            >
              Request controlled access <ArrowRight className="h-4 w-4" />
            </AcquisitionCta>
            <AcquisitionCta
              href="mailto:tsh_cook@hotmail.com?subject=ELITZE%20Agentic%20Security%20-%20acquisition%20inquiry"
              event="acquisition_inquiry"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold"
            >
              Email acquisition inquiry
            </AcquisitionCta>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap gap-5 px-4 py-8 text-xs text-[var(--muted)] sm:px-7">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/security">Security</Link>
          <Link href="/">ELITZE</Link>
        </div>
      </footer>
    </main>
  );
}
