import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function WorkspaceCtaSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
    <div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
    <div>
    <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Secure workspace</div>
    <h2 className="mt-3 text-3xl font-black tracking-[-.04em] sm:text-4xl">Operate from one governed workspace.</h2>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
    Open the ELITZE workspace to inspect tenant posture, agent identities, policy decisions, authorized validation, and source-bound evidence.
    </p>
    </div>
    <Link href="/workspace" className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110 lg:mt-0">
    Open workspace <ArrowRight className="h-4 w-4" />
    </Link>
    </div>
    </section>
  );
}
