import { Activity, CheckCircle2, Fingerprint } from "lucide-react";

const pillars = [
  {
    number: "01",
    icon: Activity,
    title: "Find exposure early",
    summary: "Discover reachable assets and test only within an authorized scope.",
    detail:
      "Define the target, boundaries, test profile, and authorization reference before testing. A request is reported as executed only after an authorized, configured runner returns an outcome.",
    proof: "Asset discovery · bounded scope · verified result",
  },
  {
    number: "02",
    icon: Fingerprint,
    title: "Enforce the access boundary",
    summary: "Tie sensitive operations to authenticated identity, tenant, and policy.",
    detail:
      "Protected operations derive actor and tenant context on the server. Client-supplied tenant identifiers are not accepted as proof of authorization.",
    proof: "Verified identity · tenant scope · policy decision",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Prove remediation",
    summary: "Close findings with retest evidence, not an unsupported status label.",
    detail:
      "Remediation is verified only when an authorized retest supplies an observable outcome. Missing telemetry and unverified results remain distinct from a pass.",
    proof: "Finding · retest · attributable evidence",
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

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8" aria-labelledby="security-trust-heading">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Security and evidence</div>
          <h3 id="security-trust-heading" className="mt-3 text-xl font-bold tracking-tight">Security claims must be backed by evidence.</h3>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--muted-strong)]">
            Public product pages do not need customer-specific operational records. Workspace data remains behind server-side authorization and tenant-scoped queries. A queued test is not a completed assessment, and missing telemetry is not presented as a pass.
          </p>
        </div>

        <p className="mt-6 max-w-4xl text-xs leading-6 text-[var(--muted)]">
          Implementation is not the same as a verified live deployment. Actual pentest execution depends on valid authorization, an available runner, and its returned result. Database-enforced row-level security and end-to-end production isolation remain separate verification items.
        </p>
      </div>
    </section>
  );
}
