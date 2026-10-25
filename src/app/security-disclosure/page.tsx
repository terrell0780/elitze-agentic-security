import Link from "next/link";
import { productionConfig } from "@/config/production";

export const metadata = {
  title: "Security Disclosure Policy",
  description: "How to report suspected security vulnerabilities in ELITZE-controlled services and what information helps us investigate safely.",
  alternates: { canonical: "/security-disclosure" },
  openGraph: { title: "Security Disclosure Policy | ELITZE Agentic Security", description: "Responsible reporting guidance for suspected vulnerabilities affecting ELITZE-controlled services.", url: `${productionConfig.canonicalOrigin}/security-disclosure`, type: "website" },
};

const contactEmail = "tsh_cook@hotmail.com";

export default function SecurityDisclosurePage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] px-4 py-14 text-[var(--text)] sm:px-6 sm:py-20">
      <article className="mx-auto max-w-4xl space-y-8">
        <header className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
          <Link href="/" className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE Agentic Security</Link>
          <h1 className="mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl">Security Disclosure Policy</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Last reviewed: October 10, 2026. This policy describes a reporting channel and safe-research boundaries. It does not promise a response time, reward, or legal safe harbor.</p>
        </header>
        <section className="space-y-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 text-sm leading-7 text-[var(--muted-strong)] sm:p-9">
          <h2 className="text-xl font-bold text-[var(--text)]">How to report a suspected vulnerability</h2>
          <p>Email <a className="font-semibold text-[var(--accent)] underline underline-offset-4" href={`mailto:${contactEmail}?subject=ELITZE%20security%20disclosure`}>{contactEmail}</a>. Please do not include passwords, private keys, access tokens, customer data, or unnecessary personal information in the initial report.</p>
          <p>Include the affected ELITZE-controlled URL or component, a concise description, reproducible steps, potential impact, relevant timestamps, and redacted evidence where available. If a report contains sensitive material, explain what it contains before sending additional details.</p>
          <h2 className="pt-2 text-xl font-bold text-[var(--text)]">Safe research boundaries</h2>
          <ul className="list-disc space-y-2 pl-5"><li>Test only systems you own or are explicitly authorized to assess.</li><li>Stop when you have enough evidence to demonstrate the issue. Avoid data access beyond the minimum needed to validate impact.</li><li>Do not perform denial-of-service testing, social engineering, destructive actions, persistence, or production data modification.</li><li>Do not access customer environments or third-party systems through ELITZE unless you have separate explicit authorization.</li><li>Keep suspected vulnerabilities private while a coordinated resolution is being discussed, where practical.</li></ul>
          <h2 className="pt-2 text-xl font-bold text-[var(--text)]">What happens after a report</h2>
          <p>Reports are intended to follow an intake, acknowledgement, triage, severity assessment, remediation, retest, and closure process. A report is not confirmation that a vulnerability exists or that a particular response time can be met. No bounty, contractual change, waiver, or authorization to exceed scope is created by submitting a report.</p>
          <h2 className="pt-2 text-xl font-bold text-[var(--text)]">Scope and limitations</h2>
          <p>This channel is for suspected security issues in ELITZE-controlled services and product components. Do not submit unrelated personal information or confidential third-party material. If the affected asset is not controlled by ELITZE, report it to its owner.</p>
        </section>
        <nav aria-label="Related policies" className="flex flex-wrap gap-4 text-sm"><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/privacy">Privacy notice</Link><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/terms">Terms of service</Link><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/accessibility">Accessibility statement</Link><Link className="font-semibold text-[var(--accent)] underline underline-offset-4" href="/">ELITZE home</Link></nav>
      </article>
    </main>
  );
}
