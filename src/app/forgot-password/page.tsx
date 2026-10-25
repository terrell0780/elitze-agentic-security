"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setState("");
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setState(response.ok
        ? "If an active account matches that address, a reset link has been sent."
        : "Password reset is temporarily unavailable.");
    } catch {
      setState("Password reset is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">ELITZE</Link>
          <h1 className="mt-3 text-3xl font-semibold">Reset your password</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Enter your account email and ELITZE will send a one-time reset link.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <label className="block text-xs text-[var(--muted-strong)]">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          {state && <p role="status" className="text-xs text-[var(--muted)]">{state}</p>}
          <button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <div className="text-center text-xs text-[var(--muted)]">
            <Link href="/login" className="text-[var(--accent)]">Back to sign in</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
