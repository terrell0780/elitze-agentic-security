"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setState("This reset link is invalid or expired.");
      return;
    }
    if (password !== confirm) {
      setState("Passwords do not match.");
      return;
    }
    setBusy(true);
    setState("");
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        setState(payload.error === "password_policy"
          ? "Use a password between 12 and 256 characters."
          : "This reset link is invalid or expired.");
        return;
      }
      setState("Password updated. You can now sign in.");
    } catch {
      setState("Password reset is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">ELITZE</Link>
          <h1 className="mt-3 text-3xl font-semibold">Choose a new password</h1>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <label className="block text-xs text-[var(--muted-strong)]">
            New password
            <input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
          </label>
          <label className="block text-xs text-[var(--muted-strong)]">
            Confirm password
            <input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
          </label>
          {state && <p role="status" className="text-xs text-[var(--muted)]">{state}</p>}
          <button type="submit" disabled={busy || !token} className="min-h-12 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">
            {busy ? "Updating…" : "Update password"}
          </button>
          <div className="text-center text-xs text-[var(--muted)]">
            <Link href="/login" className="text-[var(--accent)]">Back to sign in</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]"><div className="text-sm text-[var(--muted)]">Preparing secure password reset…</div></main>}><ResetPasswordContent /></Suspense>;
}
