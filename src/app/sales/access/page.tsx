import Link from "next/link";
import AcquisitionCta from "@/components/acquisition-cta";

export const metadata = {
  title: "Request ELITZE Repository Access",
  description: "Controlled source-access request process for qualified ELITZE acquisition diligence.",
};

export default function SalesAccessPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <Link href="/sales" className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">Back to acquisition</Link>
        <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 sm:p-10">
          <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Controlled source access</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">Request repository access</h1>
          <p className="mt-5 text-base leading-7 text-[var(--muted-strong)]">
            The ELITZE source repository is private. Source access is not distributed from the public acquisition page.
            Qualified diligence access is handled separately after buyer identification, funding/ability-to-transact review, and an appropriate NDA.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-[var(--muted-strong)]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">1. Identify the acquiring organization and principal contact.</div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">2. Describe the intended acquisition or strategic transaction.</div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">3. Confirm the diligence scope and access requirements.</div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">4. Source access is granted separately and can be time- and scope-limited.</div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <AcquisitionCta href="mailto:terrell0780@gmail.com?subject=ELITZE%20Agentic%20Security%20-%20Repository%20Access%20Request" event="repository_access_request" className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Email access request</AcquisitionCta>
            <Link href="/sales" className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-3 text-sm font-semibold">Return to acquisition</Link>
          </div>
          <p className="mt-6 text-xs leading-5 text-[var(--muted)]">The repository was previously public. That history is disclosed for diligence; making it private does not represent that no historical third-party copies exist.</p>
        </div>
      </div>
    </main>
  );
}
