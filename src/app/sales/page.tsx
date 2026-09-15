import Link from "next/link";

export const metadata = {
  title: "Enterprise Sales & Acquisition",
  description: "ELITZE Agentic Security enterprise, licensing and acquisition information.",
};

const capabilities = [
  "Security decision and evidence plane for agentic systems",
  "Identity, agent, model, MCP, API, asset and exposure relationships",
  "Policy enforcement before generation and tool execution",
  "SOC incident → action → support → verification workflow",
  "Continuous validation and evidence-bound security state",
  "REO provenance, evidence, uniqueness and governance model",
  "Mobile-ready experience for solo operators and teams",
  "Enterprise integration boundaries for cloud, endpoint, network and threat intelligence",
];

const included = [
  "ELITZE.ca domain",
  "Complete private source repository",
  "Git commit history",
  "Website and security console",
  "Authentication implementation",
  "Database schema and migrations",
  "ELITZE SDK",
  "CI/CD configuration",
  "Deployment documentation",
  "Security architecture documentation",
  "Product and sales materials",
  "Owned logos, designs, and visual assets",
  "Transferable product accounts",
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
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="text-sm font-black tracking-[.22em] text-[var(--accent)]">ELITZE</Link>
          <Link href="/console" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold">Open Console</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-4xl">
          <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Enterprise / acquisition</div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">ELITZE Agentic Security is built to become the security decision layer for the agentic enterprise.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">For organizations evaluating deployment, licensing, strategic partnership or outright acquisition, this is the concise operating view. Technical evidence, repository history and actual implementation status should be reviewed during diligence.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:terrell0780@gmail.com?subject=ELITZE%20acquisition%20%E2%80%94%20private%20technical%20review"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"
            >
              Request Private Technical Review
            </a>
            <Link href="/security" className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Review security model</Link>
          </div>
        </div>

        <section className="mt-14 rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-10">
          <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Transaction</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.03em] sm:text-4xl">Complete Product Acquisition</h2>
          <p className="mt-5 text-lg font-semibold">ELITZE is available as a complete early-stage product asset acquisition.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
              <div className="text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">Asking price</div>
              <div className="mt-2 text-3xl font-black">$18,000 USD</div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
              <div className="text-xs font-bold uppercase tracking-[.18em] text-[var(--muted)]">Accelerated cash-close</div>
              <div className="mt-2 text-3xl font-black">$10,000 USD</div>
              <p className="mt-2 text-sm text-[var(--muted-strong)]">Available to qualified buyers.</p>
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold text-[var(--muted-strong)]">Offer expiration: September 17, 2026, at 5:00 p.m. Pacific Time.</p>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-[var(--muted-strong)]">The proposed transaction includes ELITZE.ca, the complete private source repository, owned brand assets, product documentation, SDK, database and deployment materials, and limited founder transition support.</p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted-strong)]">Private technical access is provided after buyer qualification and NDA.</p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted)]">ELITZE is an early-stage product asset. Production capability, integrations, commercial terms, and implementation status remain subject to buyer diligence.</p>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
            <h2 className="text-2xl font-black">Included</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm leading-6 text-[var(--muted-strong)]">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
            <h2 className="text-2xl font-black">Excluded</h2>
            <div className="mt-6 grid gap-3">
              {excluded.map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm leading-6 text-[var(--muted-strong)]">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
          <h2 className="text-2xl font-black">What is being offered</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((item) => <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm leading-6 text-[var(--muted-strong)]">{item}</div>)}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
            <h2 className="text-2xl font-black">Buyer diligence</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">No synthetic metrics or invented production claims are used as diligence evidence. A serious buyer should validate source code, dependency posture, CI gates, deployment configuration, database state, integrations, identity controls, tenancy, telemetry and operational performance.</p>
            <div className="mt-6 space-y-3 text-sm">
              <div><b>Commercial paths</b><p className="text-[var(--muted)]">Strategic acquisition · enterprise license · technology/IP transaction · partnership</p></div>
              <div><b>Evaluation</b><p className="text-[var(--muted)]">Technical review · security review · product demonstration · architecture diligence · legal/commercial diligence</p></div>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
            <h2 className="text-2xl font-black">Private source access</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">The canonical source repository is private. Qualified buyers can request a controlled technical review; source access is handled separately after qualification and NDA.</p>
            <a
              href="mailto:terrell0780@gmail.com?subject=ELITZE%20acquisition%20%E2%80%94%20private%20technical%20review"
              className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950"
            >
              Request Private Technical Review
            </a>
          </section>
        </div>

        <section className="mt-4 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
          <h2 className="text-2xl font-black">The operating promise</h2>
          <p className="mt-4 text-lg font-semibold">Pentest every release. Govern every agent. Verify every fix.</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">The model is not the security boundary. ELITZE is designed around policy, identity, reachability, evidence and verification.</p>
        </section>

        <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-xs leading-5 text-[var(--muted)]"><b className="text-[var(--text)]">Trust disclosure:</b> References to government agencies, standards bodies, technology providers or other third parties are informational only and do not imply endorsement, certification, partnership or affiliation with ELITZE unless a separate written relationship exists. Product capabilities, implementation status and commercial terms remain subject to technical and legal diligence.</section>
        <footer className="mt-12 flex flex-wrap gap-5 text-xs text-[var(--muted)]"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/">Home</Link></footer>
      </div>
    </main>
  );
}
