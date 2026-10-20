import { Activity, CheckCircle2, Fingerprint } from "lucide-react";

const pillars = [
  {
    number: "01",
    icon: Activity,
    title: "Pentest every release",
    summary: "Make release assurance part of the release path—not a once-a-year PDF.",
    detail:
      "Define the HTTPS target, bounded scope, test profile, and authorization reference for release-assurance work. A test is reported as executed only when an authorized, configured runner returns its outcome.",
    proof: "Scoped request · authorization · runner result",
  },
  {
    number: "02",
    icon: Fingerprint,
    title: "Govern every agent",
    summary: "Keep agent actions behind authenticated identity, tenant context, and policy.",
    detail:
      "Security requests and decisions derive identity and tenant context on the server. TOTP MFA enrollment and verification have explicit flows; the application does not trust a tenant ID supplied by the browser.",
    proof: "Authenticated session · tenant-aware authorization · MFA",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Verify every fix",
    summary: "A finding is not resolved just because someone says it is.",
    detail:
      "Treat remediation as verified only when an authorized retest supplies an observable outcome and associated evidence. Queued work, missing telemetry, and unverified results stay distinct from a pass.",
    proof: "Finding · retest · observed evidence",
  },
] as const;

export default function ValidationSection() {
  return (
    <section id="control-pillars" className="border-y border-[var(--border)] bg-[var(--section)]">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="max-w-3xl">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">
            The ELITZE operating model
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">
            Three pillars. One evidence-governed loop.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
            Continuous testing matters only when the scope is authorized, the agent boundary is governed, and the result can be verified.
          </p>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {pillars.map(({ number, icon: Icon, title, summary, detail, proof }) => (
            <article key={number} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 transition hover:border-[var(--accent-border)] sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-xs text-[var(--accent)]">{number}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted-strong)]">{summary}</p>
              <p className="mt-4 flex-1 text-sm leading-6 text-[var(--muted)]">{detail}</p>
              <p className="mt-6 border-t border-[var(--border)] pt-4 text-[10px] font-semibold uppercase leading-5 tracking-[.12em] text-[var(--accent)]">
                {proof}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-6 max-w-4xl text-xs leading-6 text-[var(--muted)]">
          Implementation is not the same as a verified live deployment. Actual pentest execution depends on valid authorization, an available runner, and its returned result. Database-enforced row-level security and end-to-end production isolation remain separate verification items.
        </p>
      </div>
    </section>
  );
}
