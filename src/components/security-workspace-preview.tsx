"use client";

import Link from "next/link";
import { ArrowUpRight, Bot, CheckCircle2, CircleDot, Fingerprint, Network, ShieldCheck, Workflow } from "lucide-react";

const pathways = [
  { title: "Agent identity", x: 92, y: 74 },
  { title: "Agent runtime", x: 222, y: 42 },
  { title: "API gateway", x: 348, y: 92 },
  { title: "Protected data", x: 348, y: 190 },
  { title: "CI / CD", x: 174, y: 190 },
];

const workflows = [
  { icon: Fingerprint, title: "Identity & reach", detail: "Inspect authorized access paths", href: "/security" },
  { icon: Workflow, title: "Policy decisions", detail: "Review the enforcement boundary", href: "/platform" },
  { icon: Bot, title: "Agent workflows", detail: "Explore governed agent operations", href: "/chat" },
] as const;

export default function SecurityWorkspacePreview() {
  return (
    <section aria-label="ELITZE security workspace visual preview" className="relative mx-auto w-full max-w-[720px]">
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[radial-gradient(ellipse_at_50%_45%,rgba(34,211,238,.14),transparent_68%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/[.11] bg-[#090e14] text-white shadow-[0_35px_100px_rgba(0,0,0,.42)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[.08] px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] text-cyan-200"><ShieldCheck className="h-4 w-4" /></span>
            <div><div className="text-[11px] font-bold tracking-[.16em]">ELITZE</div><div className="mt-0.5 text-[9px] tracking-[.08em] text-white/40">AGENTIC SECURITY CONTROL PLANE</div></div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[.045] px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[.12em] text-cyan-100/80"><CircleDot className="h-3 w-3" /> Interface preview</span>
        </div>

        <div className="grid lg:grid-cols-[1.55fr_.8fr]">
          <div className="min-w-0 border-b border-white/[.07] p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="text-[9px] font-bold uppercase tracking-[.22em] text-cyan-200/75">Security intelligence</div><h2 className="mt-2 text-[23px] font-semibold leading-tight tracking-[-.04em] sm:text-[28px]">See the path.<br />Control the boundary.</h2></div>
              <span className="rounded-lg border border-white/[.08] bg-white/[.025] px-2.5 py-1.5 text-[8px] font-medium text-white/45">CONCEPT VIEW</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: "Identity", value: "Source-bound" },
                { label: "Policy", value: "Evidence-led" },
                { label: "Validation", value: "Retest required" },
              ].map((item) => <div key={item.label} className="min-w-0 rounded-xl border border-white/[.08] bg-white/[.025] p-3"><div className="text-[8px] uppercase tracking-[.12em] text-white/40">{item.label}</div><div className="mt-2 text-[10px] font-semibold leading-4 text-cyan-100/90">{item.value}</div></div>)}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.08] bg-[#070b10]">
              <div className="flex items-center justify-between gap-2 border-b border-white/[.06] px-3 py-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-white/80"><Network className="h-3.5 w-3.5 text-cyan-300" /> Security relationship map</div>
                <span className="text-[8px] uppercase tracking-[.1em] text-white/35">Illustrative topology</span>
              </div>
              <div className="relative px-2 py-3 sm:px-3">
                <svg viewBox="0 0 430 235" role="img" aria-label="Illustrative architecture linking identity, agent runtime, API gateway, protected data, and CI/CD; not live tenant telemetry" className="block h-auto w-full">
                  <defs>
                    <pattern id="elitze-preview-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#94a3b8" strokeOpacity=".07" strokeWidth=".7" /></pattern>
                    <linearGradient id="elitze-preview-line" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#67e8f9" stopOpacity=".85" /><stop offset="100%" stopColor="#0891b2" stopOpacity=".3" /></linearGradient>
                  </defs>
                  <rect width="430" height="235" fill="url(#elitze-preview-grid)" />
                  <g stroke="url(#elitze-preview-line)" strokeWidth="1.5" fill="none">
                    <path d="M 92 74 L 222 42 L 348 92" />
                    <path d="M 348 92 L 348 190 L 174 190 L 92 74" strokeDasharray="4 5" opacity=".7" />
                    <path d="M 222 42 L 174 190" opacity=".5" />
                  </g>
                  {pathways.map((node) => <g key={node.title} transform={`translate(${node.x} ${node.y})`}>
                    <circle r="19" fill="#083344" fillOpacity=".55" stroke="#22d3ee" strokeOpacity=".65" />
                    <circle r="4" fill="#67e8f9" />
                    <text y="32" textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="500">{node.title}</text>
                  </g>)}
                  <text x="12" y="220" fill="#64748b" fontSize="8">Conceptual paths only · no live events shown</text>
                </svg>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[.035] px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/80" />
              <p className="text-[9px] leading-4 text-white/45">Illustrative interface concept. The graph above is a design schematic, not connected tenant data or a claim of active protection.</p>
            </div>
          </div>

          <aside className="p-4 sm:p-6">
            <div className="text-[9px] font-bold uppercase tracking-[.2em] text-white/40">Control workspace</div>
            <div className="mt-3 rounded-2xl border border-white/[.08] bg-white/[.025] p-4">
              <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-white/80">Evidence state</span><span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" /></div>
              <div className="mt-3 text-[18px] font-semibold tracking-[-.03em]">No record.<br />No claim.</div>
              <p className="mt-2 text-[10px] leading-5 text-white/40">Live findings and metrics are shown only when returned by authorized, connected services.</p>
            </div>
            <div className="mt-3 space-y-2">
              {workflows.map(({ icon: Icon, title, detail, href }) => (
                <Link key={title} href={href} className="group flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.018] p-3 transition hover:border-cyan-200/25 hover:bg-cyan-300/[.035]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-300/10 bg-cyan-300/[.05] text-cyan-200"><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold text-white/85">{title}</span><span className="mt-1 block text-[9px] leading-4 text-white/40">{detail}</span></span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-200" />
                </Link>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/[.07] pt-3 text-[8px] uppercase tracking-[.14em] text-white/30"><span>Observe · Govern · Verify</span><span>ELITZE</span></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
