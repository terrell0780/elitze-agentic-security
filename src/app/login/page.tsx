"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function messageFor(error: string) {
  if (error === "email_verification_required") return "Verify your email before signing in.";
  if (error === "invalid_credentials") return "Email or password is incorrect.";
  return "Authentication is temporarily unavailable.";
}

export default function LoginPage() {
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
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, persistent }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setError(messageFor(payload.error ?? "")); return; }
      router.replace("/console"); router.refresh();
    } catch { setError("Authentication is temporarily unavailable."); }
    finally { setBusy(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07040a] px-6 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-8"><Link href="/" className="text-xs font-semibold tracking-[0.3em] text-red-300">ELITZE</Link><h1 className="mt-3 text-3xl font-semibold">Agentic Security</h1><p className="mt-2 text-sm text-slate-500">Secure access to your security control plane.</p></div>
        {params.get("verified") && <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">Email verified. You can sign in.</div>}
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <label className="block text-xs text-slate-400">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-red-400/50" /></label>
          <label className="block text-xs text-slate-400">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-red-400/50" /></label>
          <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={persistent} onChange={(event) => setPersistent(event.target.checked)} /> Keep me signed in</label>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
          <div className="text-center text-xs text-slate-500">Need an account? <Link href="/register" className="text-red-300 hover:text-red-200">Create one</Link></div>
        </form>
      </div>
    </main>
  );
}
