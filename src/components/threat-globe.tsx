"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Crosshair, Eye, ShieldAlert } from "lucide-react";

type Domain = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  color: string;
};

const domains: Domain[] = [
  { id: "identity", label: "Identity", detail: "Principal, service and agent access paths", x: 28, y: 38, color: "#60a5fa" },
  { id: "cloud", label: "Cloud", detail: "Exposure, workload and infrastructure paths", x: 64, y: 26, color: "#a78bfa" },
  { id: "application", label: "Application", detail: "Code, API and dependency attack surface", x: 72, y: 62, color: "#f87171" },
  { id: "ai", label: "AI", detail: "Models, agents, tools and data boundaries", x: 40, y: 72, color: "#34d399" },
  { id: "runtime", label: "Runtime", detail: "Observed behavior and containment paths", x: 24, y: 62, color: "#fbbf24" },
];

export function ThreatGlobe() {
  const [selected, setSelected] = useState(domains[0]);
  const [rotation, setRotation] = useState({ x: -8, y: 18 });
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (!dragging.current) {
        setRotation((current) => ({ ...current, y: current.y + 0.035 }));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const ringData = useMemo(() => Array.from({ length: 5 }, (_, index) => index), []);

  return (
    <div
      className="relative min-h-[560px] overflow-hidden rounded-[32px] border border-[var(--border-strong)] bg-[#05070c] shadow-[0_30px_100px_rgba(0,0,0,.45)]"
      onPointerDown={(event) => {
        dragging.current = true;
        pointer.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const dx = event.clientX - pointer.current.x;
        const dy = event.clientY - pointer.current.y;
        pointer.current = { x: event.clientX, y: event.clientY };
        setRotation((current) => ({ x: current.x - dy * 0.25, y: current.y + dx * 0.25 }));
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      aria-label="Interactive global threat surface"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(239,68,68,.18),transparent_36%),radial-gradient(circle_at_18%_18%,rgba(59,130,246,.14),transparent_28%)]" />
      <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-soft" />
        Global threat surface
      </div>
      <div className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-mono text-white/55 backdrop-blur-md">
        DRAG / EXPLORE
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <div
          className="relative h-[360px] w-[360px] rounded-full transition-transform duration-75 ease-linear sm:h-[430px] sm:w-[430px]"
          style={{ transform: `perspective(900px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        >
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,.18),transparent_20%),radial-gradient(circle_at_50%_55%,rgba(38,48,72,.95),rgba(5,7,12,1)_72%)] shadow-[inset_-60px_-40px_100px_rgba(0,0,0,.75),0_0_80px_rgba(239,68,68,.12)]" />
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-[6%] rounded-full border border-white/10" />
          {ringData.map((ring) => (
            <div
              key={ring}
              className="absolute rounded-full border border-white/[0.07]"
              style={{ inset: `${14 + ring * 8}%`, transform: `rotateX(${55 + ring * 4}deg) rotateZ(${ring * 16}deg)` }}
            />
          ))}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {domains.map((domain) => {
            const active = selected.id === domain.id;
            return (
              <button
                type="button"
                key={domain.id}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected(domain);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{ left: `${domain.x}%`, top: `${domain.y}%` }}
                aria-label={`Inspect ${domain.label} domain`}
              >
                <span className="relative block h-3.5 w-3.5 rounded-full" style={{ backgroundColor: domain.color, boxShadow: `0 0 ${active ? 30 : 14}px ${domain.color}` }}>
                  {active && <span className="absolute -inset-3 rounded-full border border-current opacity-40 animate-ping" style={{ color: domain.color }} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 grid gap-4 border-t border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:grid-cols-[1fr_auto] sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: selected.color }}>
            <Crosshair className="h-4 w-4" /> {selected.label}
          </div>
          <div className="mt-1 text-sm font-semibold text-white">{selected.detail}</div>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/50">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Observe</span>
            <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Detect</span>
            <span className="inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> Verify</span>
          </div>
        </div>
        <div className="flex items-end justify-start sm:justify-end">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">Connected data</div>
            <div className="mt-1 font-mono text-xs text-white/80">Source-dependent</div>
          </div>
        </div>
      </div>
    </div>
  );
}
