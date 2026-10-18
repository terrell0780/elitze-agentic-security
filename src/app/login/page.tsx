"use client";

import { Suspense, FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
    <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4 py-10 font-sans text-[#111827] sm:px-6">
      <div className="w-full max-w-[420px]">
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-[0_18px_50px_rgba(17,24,39,0.08)] sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]" aria-hidden="true">
              <span className="text-sm font-black tracking-[0.18em] text-[#111827]">E</span>
            </div>
            <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.025em]">Sign in to your account</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">Access your ELITZE security workspace.</p>
          </div>

          {params.get("verified") && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Email verified. You can sign in.
            </div>
          )}

          {params.get("registered") && (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Account created. Check your email for the verification link before signing in.
            </div>
          )}

          {mfaRequired && (
            <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
              Multi-factor authentication is required. Enter your authenticator or recovery code.
            </div>
          )}

          {error && (
            <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <label className={mfaRequired ? "hidden" : "block"}>
              <span className="text-sm font-medium text-[#374151]">Email address</span>
              <input
                required
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 disabled:bg-[#F9FAFB]"
              />
            </label>

            <label className={mfaRequired ? "hidden" : "block"}>
              <span className="text-sm font-medium text-[#374151]">Password</span>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 disabled:bg-[#F9FAFB]"
              />
            </label>

            <div className={mfaRequired ? "hidden" : "flex items-center justify-between gap-4"}>
              <label className="flex min-h-11 items-center gap-2 text-sm text-[#6B7280]">
                <input
                  type="checkbox"
                  checked={persistent}
                  onChange={(event) => setPersistent(event.target.checked)}
                  disabled={busy}
                  className="size-4 rounded border-[#D1D5DB]"
                />
                Keep me signed in
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-[#111827] underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            </div>

            {mfaRequired && (
              <label className="block">
                <span className="text-sm font-medium text-[#374151]">Authenticator or recovery code</span>
                <input
                  required
                  type="text"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={20}
                  value={mfaCode}
                  onChange={(event) => setMfaCode(event.target.value)}
                  disabled={busy}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-3 text-sm text-[#111827] outline-none transition focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 disabled:bg-[#F9FAFB]"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#111827]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <Spinner />}
              {busy ? (mfaRequired ? "Verifying…" : "Signing in…") : (mfaRequired ? "Verify and sign in" : "Continue with Email")}
            </button>

            {mfaRequired && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMfaRequired(false);
                  setMfaCode("");
                  setError("");
                }}
                className="w-full text-sm font-medium text-[#6B7280] hover:text-[#111827]"
              >
                Back to password sign in
              </button>
            )}
          </form>

          <p className="mt-7 text-center text-sm text-[#6B7280]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-[#111827] underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </section>

        <p className="mt-5 text-center text-xs text-[#9CA3AF]">
          <Link href="/" className="hover:text-[#6B7280]">Back to ELITZE</Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-6 text-[#111827]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-[0_18px_50px_rgba(17,24,39,0.08)]">
            <div className="mx-auto size-10 animate-spin rounded-full border-2 border-[#111827] border-r-transparent" />
            <p className="mt-4 text-sm text-[#6B7280]">Preparing secure sign in…</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
