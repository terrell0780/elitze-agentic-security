"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_COOKIE = "__Host-ELITZE_CONSENT";
const MAX_AGE = 60 * 60 * 24 * 180;

function readConsent(): "necessary" | "analytics" | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;)\\s*${CONSENT_COOKIE}=([^;]+)`),
  );
  const value = match?.[1];
  return value === "analytics" || value === "necessary" ? value : null;
}

function writeConsent(value: "necessary" | "analytics") {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event("elitze-consent-updated"));
}

export default function CookieConsent() {
  const [consent, setConsent] = useState<
    "necessary" | "analytics" | null
  >(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = readConsent();
    setConsent(current);

    const handleOpen = () => setOpen(true);
    window.addEventListener("elitze-open-cookie-settings", handleOpen);
    return () =>
      window.removeEventListener("elitze-open-cookie-settings", handleOpen);
  }, []);

  const save = (value: "necessary" | "analytics") => {
    writeConsent(value);
    setConsent(value);
    setOpen(false);
  };

  if (consent && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[90] rounded-full border border-white/15 bg-black/75 px-3 py-2 text-xs text-white/75 shadow-lg backdrop-blur hover:bg-black/90 hover:text-white"
        aria-label="Open cookie settings"
      >
        Cookie settings
      </button>
    );
  }

  return (
    <section
      aria-label="Cookie settings"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-2xl border border-white/15 bg-[#081018]/95 p-5 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:left-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Privacy & cookies</p>
          <p className="mt-2 text-sm leading-6 text-white/70">
            ELITZE uses necessary cookies for site operation and security.
            Optional analytics cookies are off until you allow them. Read the
            <Link
              href="/privacy"
              className="ml-1 underline underline-offset-4 hover:text-white"
            >
              Privacy Notice
            </Link>
            .
          </p>
        </div>
        {consent ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-white/50 hover:text-white"
            aria-label="Close cookie settings"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => save("analytics")}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => save("necessary")}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
        >
          Necessary only
        </button>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-white/45">
        You can change this choice at any time from Cookie settings.
      </p>
    </section>
  );
}
