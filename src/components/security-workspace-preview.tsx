import Link from "next/link";
import { ArrowUpRight, Bot, Fingerprint, Network, ShieldCheck, ScanSearch, Workflow } from "lucide-react";

const workflows = [
  { icon: ScanSearch, title: "Assess exposure", detail: "Review attack paths and validation", href: "/console/pentesting", tone: "violet" },
  { icon: Fingerprint, title: "Govern agents", detail: "Identity, tools and permissions", href: "/console", tone: "silver" },
  { icon: Workflow, title: "Inspect evidence", detail: "Trace decisions to source records", href: "/security", tone: "violet" },
] as const;

export default function SecurityWorkspacePreview() {
  return (
    <section aria-label="ELITZE security workspace" className="relative mx-auto w-full max-w-[620px]">
      <div className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[radial-gradient(ellipse_at_50%_45%,rgba(139,92,246,.17),transparent_68%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/[.11] bg-[#101116] text-white shadow-[0_35px_100px_rgba(0,0,0,.42)]">
        <div className="flex items-center justify-between border-b border-white/[.08] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/20 bg-violet-300/[.09] text-violet-200"><ShieldCheck className="h-4 w-4" /></span>
            <div><div className="text-[11px] font-bold tracking-[.16em]">ELITZE</div><div className="mt-0.5 text-[9px] tracking-[.08em] text-white/40">SECURITY WORKSPACE</div></div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-[9px] font-medium text-white/55"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Evidence-led</span>
        </div>
        <div className="px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
          <div className="text-[9px] font-bold uppercase tracking-[.23em] text-violet-200/80">Your security, in one workspace</div>
          <h2 className="mt-3 max-w-lg text-[26px] font-semibold leading-[1.12] tracking-[-.045em] sm:text-[34px]">What do you need to secure?</h2>
          <p className="mt-3 max-w-md text-[13px] leading-6 text-white/50">Choose a workflow to explore your environment, govern AI agents, or review evidence. Protected operations require a secure session.</p>
          <div className="mt-6 grid gap-2.5">
            {workflows.map(({ icon: Icon, title, detail, href, tone }) => (
              <Link key={title} href={href} className="group flex items-center gap-3 rounded-2xl border border-white/[.085] bg-white/[.025] p-3.5 transition duration-200 hover:border-violet-200/30 hover:bg-white/[.05] sm:p-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${tone === "violet" ? "border-violet-200/15 bg-violet-200/[.07] text-violet-200" : "border-white/10 bg-white/[.04] text-white/75"}`}><Icon className="h-[17px] w-[17px]" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-white/90">{title}</span><span className="mt-1 block text-[11px] leading-4 text-white/40">{detail}</span></span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-200" />
              </Link>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[.06] bg-black/20 px-4 py-3">
            <div className="flex items-center gap-2 text-[10px] text-white/40"><Bot className="h-3.5 w-3.5" /> Governed AI workspace</div>
            <Link href="/chat" className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-200 hover:text-white">Open chat <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/[.07] bg-white/[.018] px-5 py-3.5 text-[9px] text-white/30 sm:px-6">
          <span className="inline-flex items-center gap-2"><Network className="h-3 w-3" /> CONTROL · GOVERN · VERIFY</span>
          <span>No record. No claim.</span>
        </div>
      </div>
    </section>
  );
}
