import Link from "next/link";
import { ELITZE_GLOBAL_COMPLIANCE_CATALOG, ELITZE_SECURITY_INTEGRATION_PACKS } from "@/lib/elitze-secure/compliance-catalog";

export const metadata = {
  title: "Security & Compliance | ELITZE Agentic Security",
  description: "Evidence-gated security, privacy, regulatory and enterprise assurance coverage for ELITZE Agentic Security.",
  alternates: { canonical: "/compliance" },
};

const groups = [
  ["Canada", ["CA-PIPEDA", "CA-BC-PIPA", "CA-QC-LAW25"]],
  ["Global privacy & regulation", ["EU-GDPR", "EU-AI-ACT", "EU-NIS2", "EU-DORA", "UK-UKGDPR", "US-CCPA-CPRA", "BR-LGPD", "IN-DPDP", "AU-PRIVACY-ACT", "SG-PDPA", "JP-APPI", "KR-PIPA", "CN-PIPL"]],
  ["Assurance & frameworks", ["ISO-27001", "ISO-27701", "ISO-42001", "SOC2", "NIST-CSF-2", "NIST-AI-RMF", "PCI-DSS"]],
] as const;

export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-bold tracking-wide">ELITZE</Link>
          <div className="flex items-center gap-2">
            <Link href="/security" className="rounded-lg px-3 py-2 text-xs text-[var(--muted)]">Security</Link>
            <Link href="/terms" className="rounded-lg px-3 py-2 text-xs text-[var(--muted)]">Terms</Link>
            <Link href="/privacy" className="rounded-lg px-3 py-2 text-xs text-[var(--muted)]">Privacy</Link>
          </div>
        </div>
      </header>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-4xl">
            <div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">Evidence-gated control plane</div>
            <h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">Security, privacy and compliance without fake green badges.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE maps legal requirements, security frameworks and enterprise integrations to controls and evidence. A mapped framework is not a certification, legal opinion or blanket compliance claim.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[["No evidence, no claim.","Claims stay unclaimable until required evidence exists."],["Current evidence only.","Expired or stale evidence cannot silently support a current state."],["Scope matters.","Customer, jurisdiction, tenant and processing context are explicit."]].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5">
                  <div className="text-sm font-bold">{title}</div>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div><div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Framework map</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Coverage is mapped. Assurance is earned.</h2></div>
          <span className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">Evidence required</span>
        </div>
        <div className="mt-8 space-y-4">
          {groups.map(([label, ids]) => (
            <section key={label} className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
              <h3 className="text-lg font-semibold">{label}</h3>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ids.map((id) => {
                  const entry = ELITZE_GLOBAL_COMPLIANCE_CATALOG.find((item) => item.id === id);
                  if (!entry) return null;
                  return (
                    <article key={id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5">
                      <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--accent)]">{entry.kind}</div>
                      <h4 className="mt-2 text-base font-semibold">{entry.name}</h4>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{entry.scope}</p>
                      <div className="mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">Evidence scope</div>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{entry.requiredEvidence.slice(0, 4).join(" · ")}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
      <section className="border-y border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Security ecosystem</div>
          <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Bring evidence from the systems that already run the enterprise.</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ELITZE_SECURITY_INTEGRATION_PACKS.map((pack) => (
              <article key={pack.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--accent)]">{pack.category.replaceAll("_", " ")}</div>
                <h3 className="mt-2 text-base font-semibold">{pack.name}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{pack.observe.slice(0, 3).join(" · ")}</p>
                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-[10px] leading-4 text-[var(--muted-strong)]">{pack.executionBoundary}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-9">
            <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Legal control set</div>
            <h2 className="mt-3 text-2xl font-black">Contract layers</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">{["Terms of Service","Privacy Notice","Data Processing Addendum","Security Addendum","Subprocessor Register","Acceptable Use Policy","Vulnerability Disclosure Policy","Incident Response Framework"].map((item) => <div key={item} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-xs font-semibold">{item}</div>)}</div>
          </div>
          <div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9">
            <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">External verification boundary</div>
            <h2 className="mt-3 text-2xl font-black">ELITZE records assurance; it does not manufacture it.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">Independent auditors, certification bodies, penetration testers, counsel, insurers and regulators remain the authoritative source for their respective independent conclusions.</p>
            <Link href="/security" className="mt-6 inline-flex rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-xs font-bold">Review security architecture</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
