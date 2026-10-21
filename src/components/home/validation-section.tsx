import { Activity, CheckCircle2, CircleHelp, Database, FileCheck2, Fingerprint } from "lucide-react";

const pillars = [
  {
    number: "01",
    icon: Activity,
    title: "Map exposure and reach",
    summary: "Understand which identities, services, APIs, and tools can reach sensitive resources.",
    detail:
      "Connect approved sources, map reachable execution paths, and keep missing telemetry distinct from confirmed exposure. Unknown reach is not reported as safe.",
    proof: "Source-linked inventory · reachability · evidence status",
  },
  {
    number: "02",
    icon: Fingerprint,
    title: "Enforce identity and policy",
    summary: "Make authorization—not model output—the boundary for sensitive actions.",
    detail:
      "Evaluate identity, tenant context, scope, and policy before authorized execution. Reject out-of-scope requests and preserve decision records for review.",
    proof: "Authenticated identity · tenant-aware policy · decision record",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Verify remediation",
    summary: "Track fixes through observation, retesting, and evidence.",
    detail:
      "Treat remediation as verified only when an observable retest supports the result. Queued work, missing telemetry, and unverified outcomes remain distinct from a pass.",
    proof: "Finding · remediation · retest · observed evidence",
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
            Discover. Control. Observe. Prove.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
            Security decisions must follow verified identity, authorized scope, observable behavior, and evidence—not assumptions.
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

        <section aria-label="Security trust boundaries" className="mt-8 border-t border-[var(--border)] pt-7">
          <div className="max-w-3xl">
            <h3 className="text-lg font-bold tracking-tight">Security boundaries, made explicit.</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Public product information is separated from authenticated workspace data and privileged operations. Actual enforcement is verified through route-level controls and security tests, not through the appearance of the interface.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <Fingerprint className="h-5 w-5 text-[var(--accent)]" />
              <h4 className="mt-3 text-sm font-semibold">Identity-bound access</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Sensitive operations resolve identity and authorization on the server.</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <Database className="h-5 w-5 text-[var(--accent)]" />
              <h4 className="mt-3 text-sm font-semibold">Tenant-scoped records</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Workspace data access must remain within the authenticated tenant boundary.</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <FileCheck2 className="h-5 w-5 text-[var(--accent)]" />
              <h4 className="mt-3 text-sm font-semibold">Evidence with provenance</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Findings distinguish source observations from inference and unverified states.</p>
            </article>
            <article className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <CircleHelp className="h-5 w-5 text-[var(--accent)]" />
              <h4 className="mt-3 text-sm font-semibold">Unknown stays unknown</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Missing telemetry is not counted as proof of security or successful execution.</p>
            </article>
          </div>
        </section>

        <p className="mt-6 max-w-4xl text-xs leading-6 text-[var(--muted)]">
          Implementation is not the same as a verified live deployment. Actual pentest execution depends on valid authorization, an available runner, and its returned result. Database-enforced row-level security and end-to-end production isolation remain separate verification items.
        </p>
      </div>
    </section>
  );
}
