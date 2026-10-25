import Link from "next/link";
import PrivacyPreferences from "@/components/privacy-preferences";

export const metadata = {
  title: "Privacy Notice | ELITZE",
  description: "ELITZE 2026 Privacy Notice.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] px-4 py-14 text-[var(--text)] sm:px-6 sm:py-20">
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
          <Link href="/" className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE</Link>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl">Privacy Notice</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Version 2026.09 · Effective September 3, 2026</p>
        </header>
        <section className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 text-sm leading-7 text-[var(--muted-strong)] sm:p-9">
          <p>ELITZE may process account information, authentication metadata, service configuration, security telemetry, integration metadata, support communications, usage information, Customer Content, and audit/evidence records needed to provide and secure the Services.</p>
          <p>Processing purposes include service delivery, security, authentication, policy enforcement, incident investigation, audit, support, abuse prevention, service operations, and legal compliance.</p>
          <p>Where AI models or automated systems are used, inputs and outputs may be processed to provide the requested function. Model-provider routing depends on configuration and applicable contractual and provider terms.</p>
          <p>Retention, deletion, international processing, subprocessors, and individual rights are governed by applicable law and the applicable enterprise agreement or data-processing terms.</p>
          <p>Customers are responsible for lawful collection, required notices, permissions, access controls, data-routing rules, and retention configuration for information submitted to the Services.</p><p>ELITZE stores an essential <code>elitze_consent</code> cookie for up to one year to remember the visitor&apos;s optional measurement choice. Optional Google Analytics and Google Ads measurement tags are blocked until the visitor grants consent. No optional measurement script is emitted when the visitor declines or has not yet chosen.</p><p>The public site measurement layer records only consent-gated event names and limited page/destination context. It does not place email message contents, passwords, credentials, security telemetry, or customer security data into advertising events.</p>
        </section>
        <PrivacyPreferences />
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold" href="/">Back to ELITZE</Link>
          <Link className="rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold" href="/terms">Terms of Service</Link>
        </div>
        <p className="text-xs leading-5 text-[var(--muted)]">For the complete legal draft, see <code>docs/legal/ELITZE-PRIVACY-NOTICE-2026.md</code> in the repository.</p>
      </article>
    </main>
  );
}
