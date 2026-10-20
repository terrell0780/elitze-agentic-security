import { Activity, Database, Fingerprint, KeyRound, MailCheck, ShieldCheck } from "lucide-react";

const capabilities = [
  {
    icon: MailCheck,
    title: "Account lifecycle",
    description: "Server-side email/password registration, email confirmation, password recovery, and session revocation are represented as explicit authentication flows.",
    evidence: "Auth API routes",
  },
  {
    icon: KeyRound,
    title: "Authenticator MFA",
    description: "TOTP enrollment and verification use server-side factor records, encrypted secrets, and recovery-code support.",
    evidence: "MFA routes + PostgreSQL",
  },
  {
    icon: Database,
    title: "Persistent security state",
    description: "PostgreSQL schemas store security decisions, validation requests, findings, schedules, and validation events rather than relying on a static dashboard.",
    evidence: "Database migrations + API handlers",
  },
  {
    icon: Fingerprint,
    title: "Tenant-aware authorization",
    description: "Authenticated server-side identity supplies the tenant context used by security request and evidence queries. Database-enforced RLS is not claimed as verified.",
    evidence: "Session-bound tenant checks",
  },
  {
    icon: ShieldCheck,
    title: "Security-test lifecycle",
    description: "Requests carry target, scope, profile, authorization reference, status, and evidence state. A request is not presented as a completed test simply because it was recorded.",
    evidence: "Persisted request records",
  },
  {
    icon: Activity,
    title: "Live readiness contracts",
    description: "Health endpoints check required production configuration and database connectivity, returning unavailable when a dependency or required secret check fails.",
    evidence: "No cached success claim",
  },
] as const;

export default function ValidationSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--section)]">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
        <div className="max-w-3xl">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">
            The application behind the control plane
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">
            Real workflows. Persistent state. Verifiable boundaries.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
            ELITZE is more than a security concept or a dashboard mock-up. The repository contains authentication endpoints, database-backed security records, controlled validation request handling, and readiness checks that can fail honestly.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description, evidence }) => (
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent-border)]">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.13em] text-[var(--muted)]">
                  Implemented surface
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
              <p className="mt-5 border-t border-[var(--border)] pt-3 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--accent)]">
                {evidence}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-6 max-w-4xl text-xs leading-6 text-[var(--muted)]">
          Source implementation does not, by itself, prove a live production dependency is healthy. Email delivery depends on provider configuration; security testing depends on explicit authorization and an available runner. If the runner is absent, ELITZE records that state rather than reporting a successful execution. Database-enforced row-level security remains a separate verification item.
        </p>
      </div>
    </section>
  );
}
