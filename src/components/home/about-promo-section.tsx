import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutPromoSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-7 sm:py-12">
    <Link href="/about" className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 transition hover:border-[var(--accent-border)] sm:flex-row sm:items-center sm:justify-between">
    <div>
    <div className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">About ELITZE</div>
    <h2 className="mt-2 text-xl font-bold tracking-tight">Explore the platform and its security controls</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Product architecture, capability details, and the Sara + ELITZE agent model in one place.</p>
    </div>
    <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--accent)]">About ELITZE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
    </Link>
    </section>
  );
}
