"use client";

import { Suspense, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function messageFor(error: string) {
  if (error === "email_verification_required") return "Verify your email before signing in.";
  if (error === "invalid_credentials") return "Email or password is incorrect.";
  if (error === "too_many_attempts") return "Too many attempts. Wait before trying again.";
  return "Authentication is temporarily unavailable.";
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [persistent, setPersistent] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), password, persistent }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setError(messageFor(payload.error ?? "")); return; }
      router.replace("/console"); router.refresh();
    } catch { setError("Authentication is temporarily unavailable."); }
    finally { setBusy(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6"><div className="w-full max-w-md"><div className="mb-8"><Link href="/" className="text-xs font-bold tracking-[0.3em] text-[var(--accent)]">ELITZE</Link><h1 className="mt-3 text-3xl font-black tracking-tight">Agentic Security</h1><p className="mt-2 text-sm text-[var(--muted)]">Secure access to your security control plane.</p></div>{params.get("verified") && <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">Email verified. You can sign in.</div>}<form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl sm:p-6"><label className="block text-xs font-medium text-[var(--muted-strong)]">Email<input required type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" /></label><label className="block text-xs font-medium text-[var(--muted-strong)]">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" /></label><label className="flex min-h-11 items-center gap-2 text-xs text-[var(--muted)]"><input type="checkbox" checked={persistent} onChange={(event) => setPersistent(event.target.checked)} /> Keep me signed in on this device</label>{error && <p role="alert" className="text-xs text-rose-300">{error}</p>}<button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button><div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]"><span>Solo, team or enterprise access</span><Link href="/register" className="font-semibold text-[var(--accent)]">Create an account</Link></div></form><p className="mt-5 text-center text-xs leading-5 text-[var(--muted)]"><Link href="/" className="hover:text-[var(--text)]">Back to ELITZE</Link></p></div></main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]"><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center"><div className="text-xs font-bold tracking-[0.3em] text-[var(--accent)]">ELITZE</div><h1 className="mt-4 text-xl font-semibold">Agentic Security</h1><p className="mt-3 text-sm text-[var(--muted)]">Preparing secure sign in…</p></div></main>}><LoginContent /></Suspense>;
}
