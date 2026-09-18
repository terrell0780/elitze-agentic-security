"use client";

import { useState } from "react";

export default function PrivacyPreferences() {
  const [message, setMessage] = useState("");

  const reset = () => {
    document.cookie = "elitze_consent=; Max-Age=0; Path=/; SameSite=Lax; Secure";
    setMessage("Preference reset. The optional measurement banner will appear again on the next page load.");
    window.dispatchEvent(new Event("elitze-consent-changed"));
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5">
      <div className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">Measurement preference</div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
        Optional analytics and advertising measurement are disabled until consent is granted. You can reset that choice here.
      </p>
      <button type="button" onClick={reset} className="mt-4 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold">
        Reset optional measurement choice
      </button>
      {message ? <p className="mt-3 text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
