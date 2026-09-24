"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { trackElitzeEvent } from "@/lib/analytics-events";

type ConsentState = "unknown" | "granted" | "denied";

function readConsent(): ConsentState {
  if (typeof document === "undefined") return "unknown";
  const match = document.cookie.match(/(?:^|; )elitze_consent=([^;]+)/);
  const value = match?.[1];
  return value === "granted" || value === "denied" ? value : "unknown";
}

function writeConsent(value: Exclude<ConsentState, "unknown">) {
  document.cookie = `elitze_consent=${value}; Max-Age=31536000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(new Event("elitze-consent-changed"));
}

export default function PrivacyConsent() {
  const [consent, setConsent] = useState<ConsentState>("unknown");

  useEffect(() => {
    queueMicrotask(() => setConsent(readConsent()));
  }, []);

  if (consent !== "unknown") return null;

  const choose = (value: Exclude<ConsentState, "unknown">) => {
    writeConsent(value);
    setConsent(value);
    trackElitzeEvent(value === "granted" ? "privacy_consent_granted" : "privacy_consent_denied");
  };

  return (
    <aside
      aria-label="Privacy and measurement choices"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)]/96 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl sm:inset-x-6 sm:px-5 sm:py-3.5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Privacy</span>
            <span className="text-[11px] text-[var(--muted)]">Optional measurement is off by default.</span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted-strong)]">
            ELITZE uses essential browser storage to operate the site. Optional analytics measurement is only enabled after your choice.
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <Link href="/privacy" className="text-[11px] font-semibold text-[var(--muted)] underline underline-offset-4 hover:text-[var(--text)]">
            Privacy details
          </Link>
          <button
            type="button"
            onClick={() => choose("denied")}
            className="border-0 bg-transparent px-1 py-2 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)]"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[11px] font-bold text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,.18)]"
          >
            Allow optional measurement
          </button>
        </div>
      </div>
    </aside>
  );
}
