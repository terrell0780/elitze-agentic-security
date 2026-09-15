import Link from "next/link";
import { Activity, Bug, Crosshair, FileSearch, Globe2, LayoutDashboard, Radar, ShieldCheck } from "lucide-react";

const groups = [
  {
    label: "OPERATE",
    items: [
      { href: "/console", label: "Command Center", icon: LayoutDashboard, description: "Identity, policy and evidence" },
      { href: "/control-room", label: "Control Room", icon: Activity, description: "Attack, observe, prove" },
      { href: "/console/pentesting", label: "Pentesting", icon: Crosshair, description: "Authorized security validation" },
      { href: "/console/vulnerabilities", label: "Vulnerability Search", icon: Bug, description: "CVE, KEV and vulnerability intelligence" },
    ],
  },
  {
    label: "UNDERSTAND",
    items: [
      { href: "/#global-security", label: "Global Security View", icon: Globe2, description: "Interactive security graph" },
      { href: "/console/skills", label: "Security Skills", icon: ShieldCheck, description: "Governed security capabilities" },
      { href: "/console/roi", label: "Security Value", icon: Radar, description: "Evidence-backed value" },
      { href: "/security", label: "Security Model", icon: FileSearch, description: "Controls and boundaries" },
    ],
  },
];

export default function SecurityWorkbenchSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/8 bg-[#070a0f] lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/8 px-5 py-5">
          <Link href="/console" className="text-sm font-black tracking-[.24em] text-white">ELITZE</Link>
          <div className="mt-1 text-[9px] uppercase tracking-[.22em] text-cyan-300/80">The accountability layer for autonomous agents</div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[.035] p-4">
            <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200/80">CONTROL PATH</div>
            <div className="mt-2 text-xs font-semibold leading-5 text-slate-200">Discover → Identify → Map Reach → Decide → Execute → Prove → Retest</div>
          </div>
          {groups.map((group) => (
            <section key={group.label} className="mb-5">
              <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-600">{group.label}</div>
              <nav className="space-y-1" aria-label={group.label}>
                {group.items.map(({ href, label, icon: Icon, description }) => (
                  <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition hover:border-cyan-300/10 hover:bg-cyan-300/[.035]">
                    <Icon className="h-4 w-4 text-cyan-300/80" />
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
  );
}
