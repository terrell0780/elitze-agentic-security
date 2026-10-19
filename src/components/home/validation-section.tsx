import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";

export default function ValidationSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--section)]">
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-14 sm:px-7 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
    <div>
    <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Authorized validation</div>
    <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Test the path. Verify the fix.</h2>
    <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">
    Define an authorized scope, validate a security condition, preserve the evidence, and retest the affected path after remediation.
    </p>
    <div className="mt-6 flex flex-wrap gap-2">
    {["Explicit scope", "Controlled execution", "Evidence and retest"].map((item) => (
    <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--muted-strong)]">
    {item}
    </span>
    ))}
    </div>
    <Link href="/console/pentesting" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110">
    <Crosshair className="h-4 w-4" /> Open validation workbench <ArrowRight className="h-4 w-4" />
    </Link>
    </div>
    <div className="overflow-hidden rounded-[24px] border border-[var(--accent-border)] bg-black/20 shadow-[0_30px_100px_rgba(0,0,0,.25)]">
    <Image src="/elitze-security-validation.svg" alt="ELITZE authorized security validation, evidence collection, and retest workflow" width={1600} height={900} className="h-auto w-full" />
    </div>
    </div>
    </section>
  );
}
