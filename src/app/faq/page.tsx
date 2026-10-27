import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CircleHelp, MessageCircle, ShieldCheck } from "lucide-react";
import FaqBrowser from "@/components/faq-browser";

export const metadata: Metadata = {
  title: "FAQ | ELITZE Agentic Security",
  description: "Search answers about ELITZE dashboards, chat, scanners, integrations, evidence, authorization and release readiness.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="size-4" /></span><span className="text-sm font-black tracking-[.12em]">ELITZE</span></Link>
        <nav className="flex items-center gap-3 text-xs"><Link href="/how-to" className="text-[var(--muted)] hover:text-[var(--text)]">How-to</Link><Link href="/help" className="text-[var(--muted)] hover:text-[var(--text)]">Help</Link><Link href="/console" className="rounded-xl bg-[var(--accent)] px-3.5 py-2.5 font-bold text-slate-950">Open console</Link></nav>
      </div>
    </header>
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><CircleHelp className="size-5" /></span><div><div className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Product support</div><h1 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">Frequently asked questions</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Search and filter answers about workspaces, security tools, integrations, governed chat and evidence.</p></div></div>
      <FaqBrowser />
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/how-to" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold"><ArrowLeft className="size-4" /> Step-by-step guides</Link><Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold"><MessageCircle className="size-4" /> Contact support</Link></div>
    </section>
  </main>;
}
