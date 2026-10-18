import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";

const EMAIL = "tsh_cook@hotmail.com";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-black tracking-[.16em]">ELITZE</Link>
          <Link href="/help" className="text-xs font-semibold text-[var(--accent)]">Help</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)]"><Mail className="h-5 w-5 text-[var(--accent)]" /></div>
        <div className="mt-7 text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE contact</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">One channel. No guesswork.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--muted-strong)]">For product questions, security review, integration discussions, or support, use the single ELITZE contact address below.</p>
        <a href={"mailto:" + EMAIL} className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[var(--accent)] px-6 py-4 text-sm font-black text-slate-950"><Mail className="h-4 w-4" />{EMAIL}</a>
        <div className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 text-[10px] text-[var(--muted)]"><ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />Canonical site: https://elitze.info · Primary host: www.elitze.info</div>
        <p className="mt-5 text-[10px] leading-5 text-[var(--muted)]">ELITZE does not publish or use a second contact email on this product surface.</p>
      </div>
    </main>
  );
}
