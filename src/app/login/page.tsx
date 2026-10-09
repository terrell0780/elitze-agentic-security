"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type LoginResponse = { ok?: boolean; mfaRequired?: boolean; error?: string };

const messages: Record<string, string> = {
  invalid_credentials: "Email or password is incorrect.",
  email_verification_required: "Verify your email before signing in.",
  too_many_attempts: "Too many attempts. Please wait and try again.",
  authentication_unavailable: "Sign-in is temporarily unavailable. Please try again.",
  csrf_rejected: "Security check failed. Refresh the page and try again.",
  invalid_mfa_code: "That authenticator or recovery code was not accepted.",
  invalid_or_expired_mfa_challenge: "The security challenge expired. Sign in again.",
  mfa_challenge_required: "Sign in again to start a new security challenge.",
  mfa_unavailable: "Multi-factor verification is temporarily unavailable.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfa, setMfa] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(mfa ? "/api/auth/mfa/login" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mfa ? { code: code.trim() } : { email: email.trim(), password, persistent: true }),
      });
      const payload = await response.json().catch(() => ({})) as LoginResponse;
      if (!response.ok || !payload.ok) {
        setError(messages[payload.error ?? ""] ?? "Sign-in failed. Please try again.");
        if (mfa && (payload.error === "invalid_or_expired_mfa_challenge" || payload.error === "mfa_challenge_required")) {
          setMfa(false);
          setCode("");
        }
        return;
      }
      if (payload.mfaRequired) {
        setMfa(true);
        setNotice("Enter your authenticator code or a one-time recovery code.");
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("next") ?? "/console";
      const destination = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/console";
      window.location.assign(destination);
    } catch {
      setError("Could not reach ELITZE. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-7 shadow-2xl sm:p-10">
          <Link href="/" className="text-xs font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE Agentic Security</Link>
          <p className="mt-8 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Owner and authorized user access</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">{mfa ? "Verify it’s you." : "Open your workspace."}</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-strong)]">
            Sign in to access the ELITZE console and security workbenches. Public visitors use the separate acquisition page; they do not receive owner access.
          </p>
          <form onSubmit={submit} className="mt-8 grid gap-4">
            {!mfa ? (
              <>
                <label className="grid gap-2 text-sm font-semibold">Email
                  <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-normal outline-none focus:border-[var(--accent)]" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">Password
                  <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-normal outline-none focus:border-[var(--accent)]" />
                </label>
              </>
            ) : (
              <label className="grid gap-2 text-sm font-semibold">Authenticator or recovery code
                <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 font-normal outline-none focus:border-[var(--accent)]" />
              </label>
            )}
            {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
            {notice && <p role="status" className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-3 text-sm">{notice}</p>}
            <button type="submit" disabled={busy} className="mt-2 rounded-xl bg-[var(--accent)] px-5 py-3.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Please wait…" : mfa ? "Verify and open workspace" : "Sign in to ELITZE"}
            </button>
            {mfa && <button type="button" onClick={() => { setMfa(false); setCode(""); setError(""); setNotice(""); }} className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm">Back to sign in</button>}
          </form>
          {!mfa && <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]"><Link className="underline underline-offset-4 hover:text-[var(--text)]" href="/forgot-password">Forgot password?</Link><Link className="underline underline-offset-4 hover:text-[var(--text)]" href="/sales">Acquisition information</Link></div>}
          <p className="mt-8 border-t border-[var(--border)] pt-5 text-xs leading-5 text-[var(--muted)]">Access is authenticated. Do not share credentials. Security testing remains subject to authorization and rules of engagement.</p>
        </section>
      </div>
    </main>
  );
}
