"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bot, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import GovernedChat from "@/components/governed-chat";
import TeamCollaboration from "@/components/team-collaboration";

export default function ChatPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ ok: boolean; user: unknown | null }>)
      .then((session) => setAuthorized(Boolean(session.ok && session.user)))
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]"><div className="text-sm text-[var(--muted)]">Checking secure session…</div></main>;
  }

  if (!authorized) {
    return <main className="min-h-screen bg-[var(--bg)] px-4 py-16 text-[var(--text)]"><div className="mx-auto max-w-2xl rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-[var(--accent)]" /><h1 className="mt-4 text-3xl font-black tracking-tight">ELITZE Chat requires a secure session.</h1><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Sign in before using governed AI, tenant collaboration, uploads, or voice.</p><Link href="/login?next=%2Fchat" className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Sign in</Link></div></main>;
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/console" aria-label="Back to console" className="rounded-lg border border-[var(--border)] p-2"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex items-center gap-3"><Bot className="h-4 w-4 text-[var(--accent)]" /><div><div className="text-sm font-bold tracking-wide">ELITZE CHAT</div><div className="text-[9px] uppercase tracking-[.22em] text-[var(--muted)]">Governed intelligence workspace</div></div></div>
          <div className="ml-auto hidden items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--muted)] sm:flex"><span className="flex items-center gap-1.5"><LockKeyhole className="h-3 w-3" />Policy before generation</span><span className="flex items-center gap-1.5"><Users className="h-3 w-3" />Tenant scoped</span></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE command conversation</div>
          <h1 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-5xl">Chat. Investigate. Govern.</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">Bring your own model, agent, or bot connection without handing its secret to the browser. Every generation is tenant-scoped, policy-evaluated, and explicit about unavailable evidence.</p>
        </div>
        <GovernedChat />
        <TeamCollaboration />
      </div>
    </main>
  );
}
