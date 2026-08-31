"use client";

import { ShieldCheck, Wifi, Globe, Lock } from "lucide-react";

export default function CDNStatus() {
  return (
    <div className="rounded-xl border border-red-900/40 bg-[#0c060c] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Wifi className="h-4 w-4 text-red-300" />
        CDN & Edge Status
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Security policies, guardrail definitions, and audit templates are cached globally. No agent secrets are cached — only signed, hashed policy artifacts.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { k: "Edge nodes", v: "42 regions" },
          { k: "Policy sync", v: "< 5 sec" },
          { k: "Encryption", v: "TLS 1.3 + AES-256" },
          { k: "Data residency", v: "EU / US / APAC selectable" },
        ].map((row) => (
          <div
            key={row.k}
            className="rounded-lg border border-red-950/40 bg-black/30 px-3 py-2.5"
          >
            <div className="font-mono text-[11px] text-slate-500">{row.k}</div>
            <div className="text-sm font-semibold text-red-200">{row.v}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-300">
        <ShieldCheck className="h-3.5 w-3.5" />
        Privacy-first CDN: no tracking headers, no personal data in caches, signed artifacts only
      </div>
    </div>
  );
}
