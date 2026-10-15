import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";

export type FeatureLink = { title: string; href: string; description: string };
export type FeaturePanel = { title: string; body: string; state?: string };

export default function SeoFeaturePage({
  eyebrow,
  title,
  description,
  panels,
  links,
  sectionTitle = "Built for evidence-first security operations",
}: {
  eyebrow: string;
  title: string;
  description: string;
  panels: FeaturePanel[];
  links: FeatureLink[];
  sectionTitle?: string;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE Agentic Security home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></span>
            <span><b className="block text-sm tracking-[.12em]">ELITZE</b><span className="block text-[8px] uppercase tracking-[.25em] text-[var(--muted)]">Agentic Security</span></span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-xs" aria-label="Feature navigation">
            <Link href="/platform" className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--text)]">Platform</Link>
            <Link href="/security" className="rounded-lg px-3 py-2 text-[var(--muted)] hover:text-[var(--text)]">Security</Link>
            <Link href="/console" className="rounded-lg bg-[var(--accent)] px-3 py-2 font-bold text-slate-950">Open Console</Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-50" />
        <div className="pointer-events-none absolute -right-32 -top-48 -z-10 h-[550px] w-[550px] rounded-full bg-[var(--accent-glow)] blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-7 sm:py-24">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />{eyebrow}</div>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-.055em] sm:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--muted-strong)] sm:text-lg">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?next=%2Fconsole" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Open security console <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/sales" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Acquisition and technical review <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Control plane</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{sectionTitle}</h2></div>
          <p className="max-w-md text-xs leading-5 text-[var(--muted)]">Unavailable integrations are labeled not configured. Missing evidence is described as not verified or not measurable.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {panels.map((panel) => (
            <article key={panel.title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent-border)]">
              <div className="flex items-start justify-between gap-3"><h3 className="text-base font-semibold">{panel.title}</h3><span className="rounded-full border border-[var(--border)] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[var(--muted)]">{panel.state ?? "Evidence first"}</span></div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{panel.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--panel)]/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-7">
          <h2 className="text-xl font-semibold">Related capabilities</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 hover:border-[var(--accent-border)]">
                <span className="flex items-center justify-between gap-3 text-sm font-semibold">{link.title}<ArrowUpRight className="h-4 w-4 text-[var(--accent)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">{link.description}</span>
              </Link>
            ))}
          </div>
          <div className="mt-9 border-t border-[var(--border)] pt-5 text-[10px] leading-5 text-[var(--muted)]">ELITZE does not claim a clean posture when telemetry is absent. Live source records, authorization scope, execution state, and verification evidence remain separately visible.</div>
        </div>
      </section>
    </main>
  );
}
