"use client";

import { useMemo, useState } from "react";

type Domain = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  orbit: number;
};

const domains: Domain[] = [
  { id: "apps", label: "Apps", detail: "Application and release security", x: 50, y: 30, orbit: 14 },
  { id: "agents", label: "Agents", detail: "Agent, tool and MCP boundaries", x: 73, y: 43, orbit: 20 },
  { id: "identity", label: "Identity", detail: "Human and service identity", x: 67, y: 70, orbit: 18 },
  { id: "cloud", label: "Cloud", detail: "Cloud assets and exposure paths", x: 35, y: 72, orbit: 21 },
  { id: "data", label: "Data", detail: "Sensitive data and authorization", x: 27, y: 45, orbit: 17 },
];

export default function GodsEyeGlobe() {
  const [active, setActive] = useState("apps");
  const activeDomain = useMemo(() => domains.find((domain) => domain.id === active) ?? domains[0], [active]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[radial-gradient(circle_at_50%_45%,rgba(239,68,68,.14),transparent_48%),linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-5 shadow-[0_30px_100px_rgba(0,0,0,.25)] sm:p-7">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] pulse-soft" /> Gods Eye AI
          </div>
          <h2 className="mt-2 text-lg font-bold sm:text-xl">Global security view</h2>
          <p className="mt-1 max-w-md text-xs leading-5 text-[var(--muted)]">Interactive command surface for connected security domains. Live posture appears only when verified integrations are present.</p>
        </div>
        <div className="hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-right sm:block">
          <div className="font-mono text-[10px] text-[var(--muted)]">MODE</div>
          <div className="mt-0.5 text-xs font-semibold">Evidence first</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          <div className="absolute inset-[8%] rounded-full border border-[var(--accent-border)] opacity-70" />
          <div className="absolute inset-[14%] rounded-full border border-white/8" />
          <div className="absolute inset-[20%] rounded-full border border-white/8" />
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(248,250,252,.16),transparent_22%),radial-gradient(circle_at_50%_50%,rgba(239,68,68,.13),transparent_55%),rgba(7,4,10,.15)] shadow-[inset_0_0_90px_rgba(239,68,68,.08)]" />
          <div className="absolute inset-[8%] rounded-full bg-[repeating-radial-gradient(circle_at_50%_50%,transparent_0,transparent_42px,rgba(255,255,255,.035)_43px,transparent_44px)]" />
          <div className="absolute inset-[8%] rounded-full [background-image:linear-gradient(90deg,transparent 49.7%,rgba(255,255,255,.06) 50%,transparent 50.3%),linear-gradient(0deg,transparent 49.7%,rgba(255,255,255,.06) 50%,transparent 50.3%)]" />
          <div className="absolute inset-[8%] rounded-full border border-[var(--accent-border)]/30" />

          <div className="absolute inset-0 animate-[spin_24s_linear_infinite]">
            <div className="absolute left-1/2 top-[4%] h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_20px_rgba(239,68,68,.7)]" />
            <div className="absolute bottom-[6%] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/60" />
          </div>

          <svg className="absolute inset-[3%] h-[94%] w-[94%] overflow-visible" viewBox="0 0 100 100" aria-label="Gods Eye security globe">
            <defs>
              <radialGradient id="godsEyeCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(239,68,68,.24)" />
                <stop offset="70%" stopColor="rgba(239,68,68,0)" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="28" fill="url(#godsEyeCore)" />
            {domains.map((domain, index) => (
              <g key={domain.id}>
                <line x1="50" y1="50" x2={domain.x} y2={domain.y} stroke="rgba(239,68,68,.2)" strokeDasharray="1.4 2" />
                <circle cx={domain.x} cy={domain.y} r={active === domain.id ? 3.4 : 2.2} fill={active === domain.id ? "#ef4444" : "rgba(248,250,252,.45)"} className={index % 2 === 0 ? "animate-pulse" : ""} />
                <circle cx={domain.x} cy={domain.y} r={domain.orbit / 3.2} fill="none" stroke="rgba(239,68,68,.1)" />
                <foreignObject x={domain.x - 8} y={domain.y - 9} width="16" height="18">
                  <button
                    type="button"
                    className="grid h-5 w-16 -translate-x-1/2 place-items-center text-[7px] font-bold uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
                    onClick={() => setActive(domain.id)}
                    title={domain.detail}
                  >
                    {domain.label}
                  </button>
                </foreignObject>
              </g>
            ))}
          </svg>

          <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--accent-border)] bg-black/30 text-center shadow-[0_0_55px_rgba(239,68,68,.12)] backdrop-blur-md sm:h-32 sm:w-32">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">Gods Eye</div>
              <div className="mt-1 text-sm font-bold">Security graph</div>
              <div className="mt-1 text-[9px] text-[var(--accent)]">{activeDomain.label} focus</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Focused domain</div>
          <div className="mt-3 text-2xl font-bold">{activeDomain.label}</div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{activeDomain.detail}</p>
          <div className="mt-6 space-y-2">
            {domains.map((domain) => (
              <button key={domain.id} type="button" onClick={() => setActive(domain.id)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition ${active === domain.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-transparent hover:bg-[var(--panel-strong)]"}`}>
                <span className="font-semibold">{domain.label}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-black/10 p-3 text-[10px] leading-5 text-[var(--muted)]">The globe is a control surface, not a synthetic world map. Production state is resolved from connected, verifiable sources.</div>
        </div>
      </div>
    </div>
  );
}
