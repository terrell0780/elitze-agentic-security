import Link from "next/link";

export const metadata = {
  title: "Terms of Service | ELITZE",
  description: "ELITZE 2026 Terms of Service and AI-specific service terms.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] px-4 py-14 text-[var(--text)] sm:px-6 sm:py-20">
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
          <Link href="/" className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE</Link>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl">Terms of Service</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Version 2026.09 · Effective September 3, 2026</p>
        </header>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">AI-specific terms</div>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--muted-strong)]">
            <li>AI outputs may be probabilistic and require independent validation for consequential decisions.</li>
            <li>Agentic actions require authorized scope, credentials, targets, and applicable approval controls.</li>
            <li>Customers remain responsible for required AI disclosures and labeling of generated or materially altered content.</li>
            <li>Third-party model and integration processing is governed by the applicable provider and enterprise agreements.</li>
            <li>ELITZE REO uses provenance, evidence, uniqueness, risk, and publishing-governance controls.</li>
          </ul>
        </section>

        <nav className="flex flex-wrap gap-3 text-sm">
          <Link className="rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold" href="/">Back to ELITZE</Link>
          <Link className="rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold" href="/privacy">Privacy Notice</Link>
        </nav>

        <p className="text-xs leading-5 text-[var(--muted)]">The published legal terms and applicable signed enterprise agreement control. This page does not constitute legal advice.</p>
      </article>
    </main>
  );
}
