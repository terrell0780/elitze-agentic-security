"use client";

import { Suspense, FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";

const AUTH_STORAGE_PATTERNS = [
  /^auth/i,
  /^session/i,
  /^token/i,
  /^user/i,
  /^account/i,
  /^identity/i,
  /^mfa/i,
  /^elitze[_-]?(auth|session|token|user|identity|mfa)/i,
];

function isAuthStorageKey(key: string) {
  return AUTH_STORAGE_PATTERNS.some((pattern) => pattern.test(key));
}

function clearClientAuthState() {
  if (typeof window === "undefined") return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keys = Object.keys(storage);
    for (const key of keys) {
      if (isAuthStorageKey(key)) storage.removeItem(key);
    }
  }

  // Client JavaScript cannot remove an HttpOnly authentication cookie.
  // The server-side logout endpoint handles that cookie securely.
  window.dispatchEvent(new Event("elitze:auth-reset"));
}

async function clearServerSession() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok && response.status !== 403) {
      throw new Error("session_clear_failed");
    }
  } catch {
    // The local purge still runs even when the server-side session endpoint
    // is unavailable. Login will report its own authentication failure.
  }
}

async function resetAuthContext() {
  clearClientAuthState();
  await clearServerSession();
  clearClientAuthState();
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

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
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const prepareLogin = useCallback(async () => {
    setError("");
    await resetAuthContext();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void prepareLogin();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [prepareLogin]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await prepareLogin();

      const endpoint = mfaRequired ? "/api/auth/mfa/login" : "/api/auth/login";
      const body = mfaRequired
        ? { code: mfaCode.trim(), persistent }
        : { email: email.trim(), password, persistent };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({})) as {
        error?: string;
        mfaRequired?: boolean;
      };

      if (!response.ok) {
        if (mfaRequired) {
          if (payload.error === "invalid_mfa_code") {
            setError("The verification code is incorrect.");
          } else if (payload.error === "invalid_or_expired_mfa_challenge") {
            setMfaRequired(false);
            setMfaCode("");
            setError("The verification challenge expired. Sign in again.");
          } else {
            setError(messageFor(payload.error ?? ""));
          }
        } else {
          setError(messageFor(payload.error ?? ""));
        }
        return;
      }

      if (!mfaRequired && payload.mfaRequired === true) {
        setMfaRequired(true);
        setMfaCode("");
        return;
      }

      router.replace("/console");
      router.refresh();
    } catch {
      setError("Authentication is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen overflow-hidden bg-[#071018] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(103,232,249,.14),transparent_30%),radial-gradient(circle_at_85%_70%,rgba(167,139,250,.12),transparent_34%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.08fr_.92fr]">
        <section className="flex flex-col justify-between px-6 py-7 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
          <Link href="/" className="inline-flex w-fit items-center gap-3" aria-label="Back to ELITZE home">
            <span className="grid size-10 place-items-center rounded-2xl border border-cyan-200/25 bg-cyan-200/[.08] text-cyan-100"><ShieldCheck className="size-5" /></span>
            <span><span className="block text-sm font-bold tracking-[.18em]">ELITZE</span><span className="block text-[9px] uppercase tracking-[.24em] text-slate-500">Agentic security</span></span>
          </Link>
          <div className="max-w-xl py-16 lg:py-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-100"><span className="size-1.5 rounded-full bg-cyan-200" /> Secure workspace access</div>
            <h1 className="mt-7 text-4xl font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl">See the threat. <span className="text-cyan-200">Control the path.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">Sign in to investigate agent and runtime risk, govern sensitive actions, and retain the evidence behind every security decision.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[[Fingerprint, "Identity-aware", "Every action has a governed subject."], [LockKeyhole, "Policy-first", "Sensitive execution crosses policy before it runs."], [CheckCircle2, "Evidence-backed", "Unverified state stays clearly unverified."]].map(([Icon, title, description]) => { const SecurityIcon = Icon as typeof Fingerprint; return <div key={title as string} className="rounded-2xl border border-white/[.1] bg-white/[.025] p-4"><SecurityIcon className="size-4 text-cyan-200" /><div className="mt-3 text-sm font-semibold">{title as string}</div><div className="mt-1 text-xs leading-5 text-slate-500">{description as string}</div></div>; })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[.14em] text-slate-600"><span>Tenant-scoped controls</span><span className="size-1 rounded-full bg-slate-700" /><span>No synthetic telemetry</span></div>
        </section>

        <section className="flex items-center border-t border-white/[.08] px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-16">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 lg:hidden"><Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-200"><ArrowRight className="size-3 rotate-180" /> Back to ELITZE</Link></div>
            <div className="mb-8"><div className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200">Workspace sign in</div><h2 className="mt-3 text-3xl font-semibold tracking-[-.05em]">Welcome back.</h2><p className="mt-2 text-sm text-slate-500">Continue to your security operations workspace.</p></div>

            {params.get("verified") && <div className="mb-5 rounded-xl border border-emerald-300/20 bg-emerald-300/[.07] px-4 py-3 text-sm text-emerald-100">Email verified. You can sign in.</div>}
            {params.get("registered") && <div className="mb-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[.07] px-4 py-3 text-sm text-cyan-100">Account created. Check your email for the verification link before signing in.</div>}
            {mfaRequired && <div className="mb-5 rounded-xl border border-violet-300/20 bg-violet-300/[.07] px-4 py-3 text-sm text-violet-100">Multi-factor authentication is required. Enter your authenticator or recovery code.</div>}
            {error && <div role="alert" className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/[.07] px-4 py-3 text-sm text-rose-100">{error}</div>}

            <form onSubmit={submit} className="rounded-[26px] border border-white/[.12] bg-[#0c151e]/90 p-6 shadow-[0_30px_90px_rgba(0,0,0,.3)] sm:p-8">
              <label className={mfaRequired ? "hidden" : "block"}><span className="text-xs font-semibold text-slate-300">Email address</span><input required type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="mt-2 min-h-12 w-full rounded-xl border border-white/[.12] bg-white/[.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/60 focus:bg-white/[.06] focus:ring-2 focus:ring-cyan-200/10 disabled:opacity-60" /></label>
              <label className={mfaRequired ? "hidden" : "mt-5 block"}><span className="text-xs font-semibold text-slate-300">Password</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} className="mt-2 min-h-12 w-full rounded-xl border border-white/[.12] bg-white/[.04] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-200/60 focus:bg-white/[.06] focus:ring-2 focus:ring-cyan-200/10 disabled:opacity-60" /></label>
              <div className={mfaRequired ? "hidden" : "mt-4 flex items-center justify-between gap-4"}><label className="flex min-h-10 items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={persistent} onChange={(event) => setPersistent(event.target.checked)} disabled={busy} className="size-4 rounded border-white/20 bg-white/[.06]" />Keep me signed in</label><Link href="/forgot-password" className="text-xs font-semibold text-cyan-200 hover:text-cyan-100">Forgot password?</Link></div>
              {mfaRequired && <label className="block"><span className="text-xs font-semibold text-slate-300">Authenticator or recovery code</span><input required type="text" autoComplete="one-time-code" inputMode="numeric" maxLength={20} value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} disabled={busy} className="mt-2 min-h-12 w-full rounded-xl border border-white/[.12] bg-white/[.04] px-3.5 py-3 text-sm text-white outline-none transition focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-200/10 disabled:opacity-60" /></label>}
              <button type="submit" disabled={busy} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 px-4 py-3 text-sm font-bold text-[#061018] transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60">{busy && <Spinner />}{busy ? (mfaRequired ? "Verifying…" : "Signing in…") : (mfaRequired ? "Verify and sign in" : "Sign in to workspace")}<ArrowRight className="size-4" /></button>
              {mfaRequired && <button type="button" disabled={busy} onClick={() => { setMfaRequired(false); setMfaCode(""); setError(""); }} className="mt-4 w-full text-xs font-semibold text-slate-500 hover:text-white">Back to password sign in</button>}
              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.13em] text-slate-600"><LockKeyhole className="size-3" /> Protected workspace access</div>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">Don&apos;t have an account? <Link href="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">Create your workspace</Link></p>
            <p className="mt-4 text-center text-xs text-slate-600 lg:hidden"><Link href="/" className="hover:text-slate-300">Back to ELITZE</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-[#071018] px-6 text-white">
          <div className="rounded-[26px] border border-white/[.12] bg-[#0c151e] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,.3)]">
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-cyan-200 border-r-transparent" />
            <p className="mt-4 text-sm text-slate-400">Preparing secure workspace access…</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
