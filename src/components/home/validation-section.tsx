import { Activity, CheckCircle2, Fingerprint } from "lucide-react";

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
      </div>
    </section>
  );
}
