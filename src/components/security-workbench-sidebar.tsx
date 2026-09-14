import Link from "next/link";
import { Bug, Crosshair, FileSearch, LayoutDashboard, Radar, ShieldCheck } from "lucide-react";

const items = [
  { href: "/console", label: "Command Center", icon: LayoutDashboard, description: "Live control plane" },
  { href: "/console/pentesting", label: "Pentesting", icon: Crosshair, description: "Authorized security testing" },
  { href: "/console/vulnerabilities", label: "Vulnerability Search", icon: Bug, description: "CVE, KEV, zero-day intelligence" },
  { href: "/security", label: "Security Model", icon: ShieldCheck, description: "Controls and boundaries" },
];

export default function SecurityWorkbenchSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/8 bg-[#08050a] lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/8 px-5 py-5">
          <Link href="/console" className="text-sm font-black tracking-[.22em] text-white">ELITZE</Link>
          <div className="mt-1 text-[10px] uppercase tracking-[.22em] text-red-300">Agentic Security</div>
        </div>
        <div className="px-3 py-4">
          <div className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-600">Security Workbench</div>
          <nav className="space-y-1">
            {items.map(({ href, label, icon: Icon, description }) => (
              <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition hover:border-white/8 hover:bg-white/[.035]">
                <Icon className="h-4 w-4 text-red-300" />
                <span className="min-w-0"><span className="block text-sm font-semibold text-slate-200">{label}</span><span className="block truncate text-[10px] text-slate-600">{description}</span></span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/8 px-4 py-4 text-[10px] leading-5 text-slate-600">
          <div className="flex items-center gap-2 text-slate-500"><Radar className="h-3.5 w-3.5" />Evidence-first operations</div>
          <div className="mt-1">No synthetic security findings.</div>
        </div>
      </div>
    </aside>
  );
}
