"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";
import GlobalThemeToggle from "@/components/global-theme-toggle";

const primaryLinks = [
  ["Platform", "/platform"],
  ["How it works", "/#how-it-works"],
  ["About", "/about"],
  ["Security", "/security"],
  ["Integrations", "/integrations"],
  ["How-to", "/how-to"],
  ["FAQ", "/faq"],
  ["Docs", "/docs"],
  ["Chat", "/chat"],
  ["Console", "/console"],
] as const;

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-2xl">
    <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-7">
    <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="ELITZE Agentic Security home">
    <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
    <ShieldCheck className="h-5 w-5" />
    </span>
    <span>
    <b className="block text-sm tracking-[.12em]">ELITZE</b>
    <span className="block text-[8px] uppercase tracking-[.26em] text-[var(--muted)]">Agentic Security</span>
    </span>
    </Link>

    <nav className="hidden items-center gap-6 text-xs font-semibold text-[var(--muted)] xl:flex" aria-label="Primary navigation">
    {primaryLinks.map(([label, href]) => (
    <Link key={href} href={href} className="transition hover:text-[var(--text)]">
    {label}
    </Link>
    ))}
    </nav>

    <div className="flex shrink-0 items-center gap-2">
    <Link href="/login" className="hidden px-3 py-2.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--text)] sm:inline-flex">
    Sign in
    </Link>
    <Link href="/register" className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110 sm:inline-flex">
    Create account
    </Link>
    <button
    type="button"
    onClick={() => setMobileOpen((open) => !open)}
    aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={mobileOpen}
    aria-controls="mobile-navigation"
    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] xl:hidden"
    >
    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
    <GlobalThemeToggle embedded />
    </div>
    </div>

    {mobileOpen && (
    <nav id="mobile-navigation" className="border-t border-[var(--border)] px-4 py-3 xl:hidden" aria-label="Mobile navigation">
    <div className="mx-auto flex max-w-[1400px] flex-col gap-1">
    {primaryLinks.map(([label, href]) => (
    <Link
    key={href}
    href={href}
    onClick={() => setMobileOpen(false)}
    className="rounded-xl px-3 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--text)]"
    >
    {label}
    </Link>
    ))}
    <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--text)]">
    Sign in
    </Link>
    <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-xl bg-[var(--accent-soft)] px-3 py-3 text-sm font-semibold text-[var(--accent)]">
    Start free
    </Link>
    </div>
    </nav>
    )}
    </header>
  );
}
