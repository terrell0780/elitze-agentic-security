"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AcceptInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNeedsSignIn(false);
    if (!token || token.length < 20) {
      setError("This invitation link is missing a valid token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Use a password with at least 12 characters.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/invitations/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password, displayName: displayName.trim() || undefined }),
      });
      const payload = await response.json() as { ok: boolean; error?: string; status?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "invitation_acceptance_failed");
      if (payload.status === "ACCOUNT_CREATED_SIGN_IN_REQUIRED") {
        setNeedsSignIn(true);
        setPassword("");
        setConfirmPassword("");
        return;
      }
      router.replace("/console");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "invitation_acceptance_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-[#070b10] px-4 py-10 text-slate-100">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[.025] p-6 shadow-2xl sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-cyan-200"><ShieldCheck className="h-5 w-5" /> ELITZE</Link>
        <p className="mt-8 text-[10px] font-bold uppercase tracking-[.22em] text-cyan-300">Organization invitation</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Finish setting up your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Choose a password to join the organization that invited you. Your invitation is single-use and expires after seven days.</p>

        {!token && <div role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[.05] p-3 text-sm text-rose-100">Invitation token not found. Open the complete link from your invitation email.</div>}
        {error && <div role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[.05] p-3 text-sm text-rose-100">{error}</div>}
        {needsSignIn && <div role="status" className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] p-3 text-sm text-cyan-100">Your account was created, but sign-in could not be started automatically. Use the login page to continue.</div>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="display-name" className="mb-2 block text-sm font-medium text-slate-300">Name (optional)</label>
            <input id="display-name" name="displayName" autoComplete="name" maxLength={160} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-cyan-300/50" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">Create password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-cyan-300/50" />
            <p className="mt-1 text-[11px] text-slate-500">At least 12 characters.</p>
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
            <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-cyan-300/50" />
          </div>
          <button type="submit" disabled={busy || !token} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Creating account…" : "Accept invitation"}</button>
        </form>
        {needsSignIn && <p className="mt-5 text-center text-sm"><Link className="font-semibold text-cyan-200 underline underline-offset-4" href="/login">Continue to sign in</Link></p>}
        <p className="mt-6 text-center text-xs text-slate-500">Did not request access? You can safely ignore this email.</p>
      </section>
    </main>
  );
}
