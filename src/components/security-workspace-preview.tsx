"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Bot, Braces, CheckCircle2, CircleDot, Fingerprint, GitBranch, LockKeyhole, Network, Radar, ShieldCheck, Workflow, Zap } from "lucide-react";

const nodes = [
  { id: "identity", label: "Identity provider", sub: "OIDC / workload", x: 68, y: 96, icon: Fingerprint, tone: "cyan" },
  { id: "agent", label: "Agent runtime", sub: "Execution context", x: 225, y: 58, icon: Bot, tone: "cyan" },
  { id: "mcp", label: "MCP gateway", sub: "Tool boundary", x: 382, y: 96, icon: Braces, tone: "violet" },
  { id: "api", label: "API services", sub: "Authorized routes", x: 382, y: 224, icon: Network, tone: "blue" },
  { id: "data", label: "Protected data", sub: "Sensitive resources", x: 225, y: 262, icon: LockKeyhole, tone: "amber" },
  { id: "pipeline", label: "CI / CD", sub: "Build provenance", x: 68, y: 224, icon: GitBranch, tone: "blue" },
] as const;

const workflows = [
  { icon: Fingerprint, title: "Identity & reach", detail: "Inspect authorized access paths", href: "/security" },
  { icon: Workflow, title: "Policy decisions", detail: "Review enforcement boundaries", href: "/platform" },
  { icon: Bot, title: "Agent workflows", detail: "Explore governed operations", href: "/chat" },
] as const;

export default function SecurityWorkspacePreview() {
  return (
    <section aria-label="ELITZE security relationship map preview" className="relative mx-auto w-full max-w-[820px]">
      <div className="pointer-events-none absolute -inset-10 rounded-[48px] bg-[radial-gradient(ellipse_at_50%_45%,rgba(34,211,238,.16),transparent_68%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/[.12] bg-[#080d13] text-white shadow-[0_40px_120px_rgba(0,0,0,.5)] ring-1 ring-cyan-100/[.035]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] bg-white/[.018] px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-cyan-300/25 bg-cyan-300/[.09] text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,.08)]"><ShieldCheck className="h-5 w-5" /></span>
            <div><div className="text-[12px] font-bold tracking-[.18em]">ELITZE</div><div className="mt-1 text-[9px] tracking-[.14em] text-white/40">AGENTIC SECURITY / CONTROL PLANE</div></div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[.12] bg-white/[.035] px-3 py-2 text-[8px] font-bold uppercase tracking-[.15em] text-white/60"><CircleDot className="h-3 w-3 text-cyan-300" /> Architecture preview</span>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0 p-4 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-cyan-200/80"><Radar className="h-3.5 w-3.5" /> Relationship intelligence</div><h2 className="mt-3 text-[27px] font-semibold leading-[1.08] tracking-[-.045em] sm:text-[34px]">Map the path.<br /><span className="text-white/55">Govern every boundary.</span></h2><p className="mt-3 max-w-lg text-[11px] leading-5 text-white/45">A visual model of how identity, agents, tools, services and data relate across a controlled environment.</p></div>
              <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[.045] px-3 py-2"><div className="text-[8px] uppercase tracking-[.15em] text-white/40">Evidence mode</div><div className="mt-1.5 flex items-center gap-2 text-[10px] font-semibold text-cyan-100"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Conceptual topology</div></div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[{ label: "Trust model", value: "Identity-bound", icon: Fingerprint }, { label: "Decision point", value: "Policy boundary", icon: ShieldCheck }, { label: "Verification", value: "Evidence + retest", icon: CheckCircle2 }].map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-2xl border border-white/[.08] bg-gradient-to-b from-white/[.045] to-white/[.015] p-3 sm:p-3.5"><Icon className="h-4 w-4 text-cyan-200/80" /><div className="mt-3 text-[8px] uppercase tracking-[.14em] text-white/40">{label}</div><div className="mt-1.5 text-[10px] font-semibold leading-4 text-white/85 sm:text-[11px]">{value}</div></div>)}
            </div>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-white/[.10] bg-[#070b10] shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3.5 sm:px-5">
                <div><div className="flex items-center gap-2 text-[11px] font-semibold text-white/90"><Network className="h-4 w-4 text-cyan-300" /> Security relationship map</div><div className="mt-1 text-[9px] text-white/35">Identity â†’ execution â†’ resources</div></div>
                <span className="rounded-lg border border-white/[.08] px-2.5 py-1.5 text-[8px] font-semibold uppercase tracking-[.13em] text-white/40">Illustrative Â· not live telemetry</span>
              </div>
              <div className="px-2 py-2 sm:px-4 sm:py-4">
                <svg viewBox="0 0 450 325" role="img" aria-label="Conceptual security relationship map connecting identity provider, agent runtime, MCP gateway, API services, protected data, and CI/CD. This is not live tenant telemetry." className="block h-auto w-full">
                  <defs>
                    <pattern id="elitze-map-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#94a3b8" strokeOpacity=".075" strokeWidth=".7" /></pattern>
                    <linearGradient id="elitze-map-link" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#67e8f9" stopOpacity=".9" /><stop offset="52%" stopColor="#38bdf8" stopOpacity=".55" /><stop offset="100%" stopColor="#a78bfa" stopOpacity=".65" /></linearGradient>
                    <linearGradient id="elitze-map-node" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#132a38" /><stop offset="100%" stopColor="#0c151f" /></linearGradient>
                    <filter id="elitze-map-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  </defs>
                  <rect width="450" height="325" rx="14" fill="url(#elitze-map-grid)" />
                  <g fill="none" stroke="url(#elitze-map-link)" strokeWidth="1.5">
                    <path d="M68 96 L225 58 L382 96" />
                    <path d="M382 96 L382 224 L225 262 L68 224 L68 96" strokeDasharray="5 6" opacity=".72" />
                    <path d="M225 58 L225 262" strokeDasharray="3 7" opacity=".45" />
                    <path d="M68 224 L225 58" opacity=".3" />
                    <path d="M225 58 L382 224" opacity=".35" />
                  </g>
                  <g fill="#67e8f9" filter="url(#elitze-map-glow)"><circle cx="146" cy="77" r="2.2" /><circle cx="303" cy="77" r="2.2" /><circle cx="382" cy="160" r="2.2" /><circle cx="303" cy="243" r="2.2" /><circle cx="146" cy="243" r="2.2" /></g>
                  {nodes.map(({ id, label, sub, x, y, tone }) => {
                    const stroke = tone === "violet" ? "#a78bfa" : tone === "amber" ? "#fbbf24" : tone === "blue" ? "#60a5fa" : "#67e8f9";
                    return <g key={id} transform={`translate(${x} ${y})`}>
                      <rect x="-51" y="-27" width="102" height="54" rx="11" fill="url(#elitze-map-node)" stroke={stroke} strokeOpacity=".55" />
                      <rect x="-50" y="-26" width="100" height="2" rx="1" fill={stroke} fillOpacity=".7" />
                      <circle cx="-35" cy="-8" r="8" fill={stroke} fillOpacity=".13" />
                      <text x="-35" y="-5" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="700">{label.slice(0, 1)}</text>
                      <text x="-22" y="-5" fill="#e2e8f0" fontSize="8.1" fontWeight="600">{label}</text>
                      <text x="-35" y="12" fill="#94a3b8" fontSize="6.8">{sub}</text>
                    </g>;
                  })}
                  <text x="14" y="310" fill="#64748b" fontSize="7.5" letterSpacing="1.1">SCHEMATIC RELATIONSHIPS Â· NO LIVE EVENTS</text>
                </svg>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[.06] px-4 py-3 text-[8px] text-white/45 sm:px-5">
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />Identity / agent</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" />Tool boundary</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-300" />Service path</span><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Sensitive resource</span>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-white/[.08] bg-white/[.025] px-3.5 py-3"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-200/75" /><p className="text-[9px] leading-4 text-white/45">Design concept only. Connections are illustrative, not discovered relationships. No tenant data, live findings, or active protection state is implied.</p></div>
          </div>

          <aside className="border-t border-white/[.08] bg-white/[.018] p-4 sm:p-6 xl:border-l xl:border-t-0">
            <div className="flex items-center justify-between"><div className="text-[9px] font-bold uppercase tracking-[.2em] text-white/45">Control workspace</div><Zap className="h-3.5 w-3.5 text-cyan-200/70" /></div>
            <div className="mt-4 rounded-2xl border border-cyan-300/[.16] bg-gradient-to-br from-cyan-300/[.07] to-transparent p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-white/75"><CircleDot className="h-3 w-3 text-cyan-300" /> Evidence discipline</div>
              <div className="mt-4 text-[21px] font-semibold leading-[1.1] tracking-[-.04em]">No record.<br /><span className="text-cyan-100/75">No claim.</span></div>
              <p className="mt-3 text-[10px] leading-5 text-white/45">Operational states must come from authorized connected sources and verifiable records.</p>
            </div>
            <div className="mt-5 text-[8px] font-bold uppercase tracking-[.18em] text-white/35">Explore control surfaces</div>
            <div className="mt-2 space-y-2">
              {workflows.map(({ icon: Icon, title, detail, href }) => <Link key={title} href={href} className="group flex items-center gap-3 rounded-xl border border-white/[.07] bg-[#0b1118] p-3 transition hover:border-cyan-200/25 hover:bg-cyan-300/[.035]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.025] text-cyan-200"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold text-white/85">{title}</span><span className="mt-1 block text-[9px] leading-4 text-white/40">{detail}</span></span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cyan-200" /></Link>)}
            </div>
            <div className="mt-5 rounded-xl border border-white/[.07] px-3 py-3"><div className="flex items-center gap-2 text-[9px] font-semibold text-white/65"><ArrowDownRight className="h-3.5 w-3.5 text-cyan-200/70" /> Evidence-led workflow</div><p className="mt-2 text-[9px] leading-4 text-white/35">Observe â†’ govern â†’ validate â†’ preserve proof.</p></div>
            <div className="mt-5 border-t border-white/[.08] pt-3 text-[8px] uppercase tracking-[.14em] text-white/30">ELITZE Â· Architecture concept</div>
          </aside>
        </div>
      </div>
    </section>
  );
}
