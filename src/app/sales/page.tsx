import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acquisition",
  description:
    "ELITZE Agentic Security is offered as a pre-revenue software and IP asset. Outright acquisition, not a seller-managed hosted service. Status and residual risk are stated, not staged.",
  alternates: { canonical: "/sales" },
  openGraph: {
    title: "Acquisition | ELITZE Agentic Security",
    description:
      "Pre-revenue software and IP asset. Outright acquisition. Residual risk stated.",
    url: "/sales",
  },
};

const rows: Array<[string, string]> = [
  ["Asset", "ELITZE Agentic Security — agent & MCP control plane"],
  ["Legal entity", "TrueElitze Digital · Terrell Hall · Victoria, BC, Canada"],
  ["Stage", "Pre-revenue. No paying customer is claimed."],
  ["What transfers", "Source, brand (ELITZE / Sara), domain elitze.info, IONOS DNS, scan engine, skill registry, landing, docs"],
  ["What does not transfer", "Certifications (none held). Live customer tenants (none claimed). MDR. Endpoint agent."],
  ["Stack", "Next.js App Router + TypeScript · Neon PostgreSQL · Vercel · GitHub Actions"],
  ["Health (19 Nov 2026)", "App 200. /api/health 503 until DATABASE_URL + migrations are applied on the buyer/seller environment. Stated, not hidden."],
  ["Certifications", "SOC 2 / ISO 27001: not held."],
  ["Payment rails (operations)", "Interac e-Transfer and KOHO. Google Pay requires a processor the seller does not yet have."],
  ["US / Canada contact", "tsh_cook@hotmail.com · terrell0780@gmail.com"],
];

export default function SalesPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">TrueElitze Digital</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Acquisition</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">
          ELITZE Agentic Security is offered as a complete pre-revenue software and IP asset.
          This is an outright acquisition, not a seller-managed hosted service, and not a
          promise that it replaces CrowdStrike, Palo Alto Networks, Microsoft, or SentinelOne.
        </p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b border-[var(--border)] last:border-0">
                  <th scope="row" className="w-48 bg-white/[0.02] px-4 py-3 align-top font-medium text-[var(--muted)]">
                    {k}
                  </th>
                  <td className="px-4 py-3 text-[var(--muted-strong)]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5 text-sm leading-6 text-amber-100/90">
          <b>Residual risk, stated.</b> As of 19 November 2026 the public health endpoint
          returns 503 until a migrated PostgreSQL is attached. The production schema is not
          present on the current Neon endpoint. SOC 2 and ISO 27001 are not held. The GitHub
          repository should be private before diligence. A full evidence log is in
          <code className="mx-1 rounded bg-black/30 px-1">docs/exit/PRE-SALE-AUDIT-2026-11-19.md</code>.
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="rounded-xl bg-cyan-200 px-4 py-2 text-sm font-semibold text-[#061018]" href="mailto:terrell0780@gmail.com?subject=ELITZE%20acquisition%20inquiry">
            Email the builder
          </a>
          <a className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm" href="/contact">
            Contact
          </a>
          <a className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm" href="/trust">
            Trust
          </a>
        </div>
        <p className="mt-10 text-xs text-[var(--muted)]">
          © 2026 TrueElitze Digital · Terrell Hall · Victoria, BC. This page is a statement of
          what is for sale. It is not a warranty, a SOC 2 report, or a substitute for diligence.
        </p>
      </div>
    </main>
  );
}
