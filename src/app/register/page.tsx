"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function messageFor(error: string) {
  if (error === "password_policy") return "Use a password between 12 and 256 characters.";
  if (error === "email_already_active") return "This email already has an active account. Sign in instead.";
  if (error === "email_delivery_not_configured") return "Account creation is temporarily unavailable because verification email delivery is not configured.";
  if (error === "csrf_rejected") return "This deployment rejected the sign-up request origin. Reload the current ELITZE deployment and try again.";
  if (error === "registration_unavailable") return "Account creation is temporarily unavailable because the account service could not reach its database.";
  if (error === "too_many_attempts") return "Too many account-creation attempts. Wait before trying again.";
  return "Unable to create the account. Check the database/auth configuration and try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim(), email: email.trim(), password }),
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        setError(messageFor(payload.error ?? ""));
        return;
      }

      router.replace("/login?registered=1");
    } catch {
      setError("Authentication is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link href="/" className="text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">ELITZE</Link>
          <h1 className="mt-3 text-3xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Start with a tenant-isolated security workspace.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
          <label className="block text-xs text-[var(--muted-strong)]">
            Name
            <input type="text" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
          </label>
          <label className="block text-xs text-[var(--muted-strong)]">
            Email
            <input required type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
          </label>
          <label className="block text-xs text-[var(--muted-strong)]">
            Password
            <input required minLength={12} maxLength={256} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
          </label>

          {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}

          <button type="submit" disabled={busy} className="min-h-12 w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Creating…" : "Create account"}
          </button>

          <div className="text-center text-xs text-[var(--muted)]">
            Already have an account? <Link href="/login" className="text-[var(--accent)]">Sign in</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
