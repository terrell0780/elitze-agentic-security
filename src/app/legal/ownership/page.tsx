import Link from "next/link";
import { ArrowLeft, FileCheck2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "IP Ownership & Provenance | ELITZE Agentic Security",
  description: "ELITZE ownership, authorship, licensing and provenance control boundary.",
  alternates: { canonical: "/legal/ownership" },
};

const states = [
  ["Repository control", "VERIFIED_CONTROL_PATH", "The canonical repository is identified; repository administration is not treated as conclusive proof of legal title."],
  ["Domain control", "EVIDENCE_REQUIRED", "Registrar and DNS records are the authoritative evidence for control of the production domains."],
  ["Copyright chain", "DOCUMENT_REQUIRED", "Authorship, employment, contractor and assignment records must support any ownership assertion."],
  ["Third-party rights", "REVIEW_REQUIRED", "Dependencies, APIs, datasets, models, images, fonts, trademarks and other external material keep their own license/rights boundary."],
  ["Buyer transfer", "EXECUTION_REQUIRED", "A transaction is complete only after definitive transfer documents and agreed accounts/assets are transferred."],
];

export default function OwnershipPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/legal" className="flex items-center gap-3 text-sm font-black tracking-[.16em]">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            ELITZE
          </Link>
          <Link href="/contact" className="text-xs font-bold text-[var(--accent)]">Rights review</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE legal control</div>
        <h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">Ownership is a chain of evidence.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">
          ELITZE does not convert repository access, a brand name, AI-assisted development, or a domain name into an unsupported legal-ownership claim. Rights are recorded by source, provenance, license or assignment evidence, and transfer status.
        </p>

        <div className="mt-10 space-y-3">
          {states.map(([title, state, description]) => (
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-5 w-5 text-[var(--accent)]" />
                  <h2 className="text-base font-bold">{title}</h2>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">{state}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6">
          <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Canonical ELITZE identity</div>
          <div className="mt-3 text-sm font-semibold">ELITZE Agentic Security · https://elitze.info · https://www.elitze.info</div>
          <div className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">The detailed diligence register is maintained in the controlled legal documentation. It is not itself a transfer instrument or legal opinion.</div>
        </div>

        <Link href="/legal" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back to legal
        </Link>
      </section>
    </main>
  );
}
