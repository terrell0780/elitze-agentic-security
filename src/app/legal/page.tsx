import Link from "next/link";
import { FileCheck2, Gavel, Mail, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Legal & Trust | ELITZE Agentic Security",
  description: "ELITZE legal, privacy, security, ownership and provenance controls.",
  alternates: { canonical: "/legal" },
};

const controls = [
  ["Terms of Service", "Customer and AI-specific service terms", "/terms"],
  ["Privacy Notice", "Privacy, measurement consent and data-processing boundary", "/privacy"],
  ["Security Architecture", "Visible technical controls and evidence boundary", "/security"],
  ["IP Ownership & Provenance", "Diligence register for authorship, licenses, domains and transfer evidence", "/legal/ownership"],
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span><span className="text-sm font-black tracking-[.16em]">ELITZE</span></Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950"><Mail className="h-4 w-4" /> Contact</Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-4xl">
          <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE legal & trust</div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">Evidence before legal claims.</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--muted-strong)]">ELITZE separates product controls, legal terms, privacy obligations, third-party rights, ownership provenance and independent assurance. A policy or code path is never treated as proof of certification, legal compliance or intellectual-property title by itself.</p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {controls.map(([title, description, href]) => (
            <article key={title} className="rounded-[26px] border border-[var(--border)] bg-[var(--panel)] p-6">
              <div className="flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-[var(--accent)]" /><h2 className="text-lg font-bold">{title}</h2></div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
              {href ? <Link href={href} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[var(--accent)]">Open control <span aria-hidden="true">→</span></Link> : <div className="mt-5 text-[10px] font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Controlled diligence document</div>}
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-[26px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7">
          <div className="flex items-center gap-3"><Gavel className="h-5 w-5 text-[var(--accent)]" /><h2 className="text-lg font-bold">Legal control pack</h2></div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">The repository maintains controlled drafts for acceptable use, AI transparency, data processing, enterprise legal controls, incident response, security addendum, subprocessors, terms, and vulnerability disclosure. Applicability and final enforceability depend on the governing agreement, customer context, jurisdiction and qualified legal review.</p>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">Canonical identity: https://elitze.info · Primary host: https://www.elitze.info · Acquisition/legal contact: tsh_cook@hotmail.com</p>
        </div>

        <nav className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold">Back to ELITZE</Link>
          <Link href="/help" className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold">Help</Link>
          <Link href="/contact" className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold">Contact</Link>
        </nav>
      </section>
    </main>
  );
}
