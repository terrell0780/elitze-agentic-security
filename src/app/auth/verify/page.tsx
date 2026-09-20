"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState("Verifying your email…");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      queueMicrotask(() => setState("Verification link is invalid or expired."));
      return;
    }

    void fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, { method: "POST" })
      .then(async (response) => {
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error);
        setState("Email verified. Redirecting to sign in…");
        window.setTimeout(() => router.replace("/login?verified=1"), 800);
      })
      .catch(() => setState("Verification link is invalid or expired."));
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center">
        <div className="text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">ELITZE</div>
        <h1 className="mt-4 text-xl font-semibold">Email verification</h1>
        <p className="mt-3 text-sm text-slate-500">{state}</p>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 text-[var(--text)]"><div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center"><div className="text-xs font-semibold tracking-[0.3em] text-[var(--accent)]">ELITZE</div><h1 className="mt-4 text-xl font-semibold">Email verification</h1><p className="mt-3 text-sm text-slate-500">Preparing verification…</p></div></main>}>
      <VerifyContent />
    </Suspense>
  );
}
