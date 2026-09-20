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

  useEffect(() => setConsent(readConsent()), []);

  if (consent !== "unknown") return null;

  return (
    <aside
      aria-label="Privacy and analytics choices"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-xl sm:inset-x-6 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">Privacy controls</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
            ELITZE uses essential browser storage for site operation. Optional analytics and advertising measurement remain off until you choose to allow them.
          </p>
          <Link href="/privacy" className="mt-2 inline-flex text-xs font-semibold text-[var(--accent)] underline underline-offset-4">
            Review the privacy notice
          </Link>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              writeConsent("denied");
              setConsent("denied");
              trackElitzeEvent("privacy_consent_denied");
            }}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold"
          >
            Continue without optional measurement
          </button>
          <button
            type="button"
            onClick={() => {
              writeConsent("granted");
              setConsent("granted");
              trackElitzeEvent("privacy_consent_granted");
            }}
            className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-slate-950"
          >
            Allow analytics and advertising measurement
          </button>
        </div>
      </div>
    </aside>
  );
}
