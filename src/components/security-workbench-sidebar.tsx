import Link from "next/link";
import { Activity, Bug, Crosshair, FileSearch, Globe2, LayoutDashboard, Radar, ShieldCheck, Siren, Workflow, ClipboardCheck, Bot } from "lucide-react";

const groups = [
  {
    label: "OPERATE",
    items: [
      { href: "/console", label: "Command Center", icon: LayoutDashboard, description: "Live identity, policy and evidence" },
      { href: "/console/analyst", label: "Autonomous SOC Analyst", icon: Bot, description: "Analyst workflow and investigation" },
      { href: "/control-room", label: "SecOps & Red Team", icon: Siren, description: "Attack, observe, prove and retest" },
      { href: "/console/threat-detection", label: "Runtime Threat Detection", icon: Siren, description: "Observed runtime signals and response evidence" },
      { href: "/console/vulnerabilities", label: "Vulnerability Intelligence", icon: Bug, description: "CVE, KEV and threat findings" },
      { href: "/console/readiness", label: "Release Readiness", icon: ClipboardCheck, description: "Production and security proof gates" },
    ],
  },
  {
    label: "GOVERN",
    items: [
      { href: "/console/skills", label: "Security Skills & Policies", icon: ShieldCheck, description: "Governed security capabilities" },
      { href: "/orchestration", label: "Orchestration", icon: Workflow, description: "Agent and workflow coordination" },
      { href: "/console/google-ads", label: "Google Ads Governance", icon: ShieldCheck, description: "Policy-gated advertising controls" },
    ],
  },
  {
    label: "UNDERSTAND",
    items: [
      { href: "/#global-security", label: "Global Security View", icon: Globe2, description: "Interactive security graph" },
      { href: "/console/roi", label: "Security Value", icon: Radar, description: "Evidence-backed value analysis" },
      { href: "/security", label: "Security Model", icon: FileSearch, description: "Controls and trust boundaries" },
    ],
  },
];

export default function SecurityWorkbenchSidebar() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/8 bg-[#070a0f] lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/8 px-5 py-5">
            <Link href="/console" className="text-sm font-black tracking-[.24em] text-white">ELITZE</Link>
            <div className="mt-1 text-[9px] uppercase tracking-[.22em] text-cyan-300/80">Agentic Security Control Plane</div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] p-4">
              <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200/80">CONTROL PATH</div>
              <div className="mt-2 text-xs font-semibold leading-5 text-slate-200">Discover → Identify → Map Reach → Decide → Execute → Observe → Prove → Retest</div>
            </div>
            {groups.map((group) => (
              <section key={group.label} className="mb-5">
                <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">{group.label}</div>
                <nav className="space-y-1" aria-label={group.label}>
                  {group.items.map(({ href, label, icon: Icon, description }) => (
                    <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition hover:border-cyan-300/10 hover:bg-cyan-300/[.035]">
                      <Icon className="h-4 w-4 shrink-0 text-cyan-300/80" />
                      <span className="min-w-0"><span className="block text-sm font-semibold text-slate-200">{label}</span><span className="block truncate text-[10px] text-slate-600">{description}</span></span>
                    </Link>
                  ))}
                </nav>
              </section>
            ))}
          </div>
          <div className="border-t border-white/8 px-4 py-4 text-[10px] leading-5 text-slate-600">
            <div className="flex items-center gap-2 text-slate-400"><Radar className="h-3.5 w-3.5 text-cyan-300/80" />Evidence-first operations</div>
            <div className="mt-1">No record. No claim. No synthetic telemetry.</div>
          </div>
        </div>
      </aside>
      <nav aria-label="Security workbench mobile navigation" className="sticky top-0 z-40 flex gap-2 overflow-x-auto border-b border-white/10 bg-[#070a0f] px-3 py-2 lg:hidden">
        {groups.flatMap((group) => group.items).map(({ href, label }) => (
          <Link key={href} href={href} className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200">{label}</Link>
        ))}
      </nav>
    </>
  );
}
