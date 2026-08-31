"use client";

import { Cookie, ShieldCheck, ShieldX, Wifi, Zap } from "lucide-react";
import { useState } from "react";

const categories = [
  {
    name: "Essential",
    desc: "Required for the security graph and policy engine to function. Cannot be disabled.",
    required: true,
  },
  {
    name: "Performance & CDN",
    desc: "Enables edge-cached security policies, static assets, and low-latency guardrail evaluation globally.",
    required: false,
  },
  {
    name: "Analytics",
    desc: "Anonymous interaction metrics (click paths, feature usage). No user-level tracking.",
    required: false,
  },
  {
    name: "Agent Reach Cookies",
    desc: "Vault-brokered session cookies for Reach routes (social/read paths). Scoped to domain, ephemeral, never shared.",
    required: false,
  },
];

export default function CookieSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    Essential: true,
    "Performance & CDN": true,
    Analytics: false,
    "Agent Reach Cookies": false,
  });

  return (
    <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-6">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
          <Cookie className="h-5 w-5 text-red-300" />
        </div>
        <div>
          <div className="text-lg font-semibold text-white">Cookie Settings</div>
          <p className="text-xs text-slate-400">Manage cookies, CDN consent, and Reach session scope.</p>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {categories.map((c) => (
          <div
            key={c.name}
            className="flex items-start justify-between gap-3 rounded-lg border border-red-950/40 bg-black/20 px-4 py-3"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                {c.required ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <ShieldX className="h-3.5 w-3.5 text-slate-500" />
                )}
                {c.name}
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${
                    c.required
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-red-400/30 bg-red-400/10 text-red-300"
                  }`}
                >
                  {c.required ? "required" : "optional"}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">{c.desc}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                !c.required && setEnabled({ ...enabled, [c.name]: !enabled[c.name] })
              }
              disabled={c.required}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
                enabled[c.name]
                  ? "bg-red-500"
                  : "bg-slate-700"
              } ${c.required ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  enabled[c.name] ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-amber-900/40 bg-amber-500/[0.05] p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
          <Zap className="h-3.5 w-3.5" />
          CDN & Performance
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Elitze uses a privacy-respecting CDN for guardrail rules and static assets.
          No personal data leaves your region. Disable optional cookies to reduce tracking surface; performance remains intact.
        </p>
        <div className="mt-3 flex gap-2 text-[10px] font-mono text-slate-500">
          <span>Region: auto-detected</span>
          <span>·</span>
          <span>Latency: 41ms</span>
          <span>·</span>
          <span>Encryption: TLS 1.3 + AES-256</span>
          <span>·</span>
          <span>Data residency: EU / US / APAC selectable</span>
        </div>
      </div>
    </div>
  );
}
