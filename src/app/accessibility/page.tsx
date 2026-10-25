import Link from "next/link";
import { productionConfig } from "@/config/production";

export const metadata = {
  title: "Accessibility Statement",
  description: "ELITZE Agentic Security accessibility goals, known limitations, and how to report an accessibility barrier.",
  alternates: { canonical: "/accessibility" },
  openGraph: { title: "Accessibility Statement | ELITZE Agentic Security", description: "Accessibility goals and reporting contact for ELITZE Agentic Security.", url: `${productionConfig.canonicalOrigin}/accessibility`, type: "website" },
};

const contactEmail = "tsh_cook@hotmail.com";

export default function AccessibilityPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] px-4 py-14 text-[var(--text)] sm:px-6 sm:py-20">
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
          <Link href="/" className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE Agentic Security</Link>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl">Accessibility Statement</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Last reviewed: October 10, 2026.</p>
        </header>
        <section className="space-y-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 text-sm leading-7 text-[var(--muted-strong)] sm:p-9">
          <h2 className="text-xl font-bold text-[var(--text)]">Our approach</h2>
          <p>ELITZE aims to make its public website and product interfaces perceivable, operable, understandable, and robust for people with different access needs. Accessibility is an ongoing engineering and review responsibility, not a status that can be established by a statement alone.</p>
          <p>Design and implementation work considers semantic page structure, keyboard navigation, visible focus, text alternatives where appropriate, readable contrast, responsive layouts, form labels and errors, and reduced-motion preferences. These considerations are not a claim that every route or workflow has passed an independent accessibility audit.</p>
          <h2 className="pt-2 text-xl font-bold text-[var(--text)]">Known limitations and verification</h2>
          <p>A complete independent conformance assessment has not been established by this statement. Some complex security visualizations, third-party integrations, or newly changed interfaces may require additional evaluation. Current conformance status is therefore <strong>UNVERIFIED</strong> until supported by documented testing evidence.</p>
          <h2 className="pt-2 text-xl font-bold text-[var(--text)]">Report an accessibility barrier</h2>
          <p>Email <a className="font-semibold text-[var(--accent)] underline underline-offset-4" href={`mailto:${contactEmail}?subject=ELITZE%20accessibility%20feedback`}>{contactEmail}</a>. Describe the page or workflow, the barrier encountered, the assistive technology or browser involved if you are comfortable sharing it, and an alternative way to contact you if a reply is needed. Please avoid sending passwords, credentials, or confidential security data.</p>
          <p>Reports will be reviewed as resources permit. This statement does not promise a fixed response or remediation deadline.</p>
        </section>
        <nav aria-label="Related policies" className="flex flex-wrap gap-4 text-sm"><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/security-disclosure">Security disclosure policy</Link><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/privacy">Privacy notice</Link><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/terms">Terms of service</Link><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/">ELITZE home</Link></nav>
      </article>
    </main>
  );
}
