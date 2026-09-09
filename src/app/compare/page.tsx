import Link from "next/link";
import { ArrowRight, Check, Gauge, ShieldCheck, Zap } from "lucide-react";

const benchmark = [
  ["CrowdStrike Falcon", "Endpoint / XDR", 92, "Detection"],
  ["Wiz", "Cloud / CNAPP", 94, "Cloud context"],
  ["Microsoft Defender XDR", "Enterprise XDR", 90, "Ecosystem"],
  ["Zscaler", "Zero Trust / SASE", 91, "Access policy"],
  ["Palo Alto Cortex XSIAM", "SOC / XSIAM", 89, "Consolidation"],
];

const dimensions = [
  ["Security graph", "Connect code, assets, identities, agents, dependencies, cloud and runtime context."],
  ["Decision quality", "Prioritize exploitability, reachability and business impact instead of alert volume."],
  ["Action path", "Move from finding to governed response without forcing operators through a maze of consoles."],
  ["Retest", "Re-run the original security condition after remediation."],
  ["Evidence", "Every meaningful decision should resolve to source and proof."],
  ["Agent control", "Identity, purpose, capability, MCP/tool and data boundaries before execution."],
];

function Bar({ value }: { value: number }) {
  return <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),#fb7185)]" style={{ width: `${value}%` }} /></div>;
}

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-[#07040a] text-slate-100">
      <header className="border-b border-white/8 bg-[#09050a]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300"><ShieldCheck className="h-5 w-5" /></div><span className="text-sm font-bold">ELITZE</span></Link><div className="flex items-center gap-2"><Link href="/about" className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white">About</Link><Link href="/console" className="rounded-xl bg-red-500 px-4 py-2.5 text-xs font-semibold text-white">Open Console</Link></div></div></header>

      <section className="relative overflow-hidden border-b border-white/8"><div className="pointer-events-none absolute inset-0 hero-grid opacity-70" /><div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300"><Gauge className="h-3.5 w-3.5" /> 2026 benchmark</div><h1 className="mt-5 text-4xl font-bold tracking-[-0.045em] sm:text-6xl">Best-in-class capabilities.<br /><span className="text-red-400">Less operational drag.</span></h1><p className="mt-5 max-w-2xl text-sm leading-6 text-slate-400">ELITZE benchmarks strong enterprise platforms, then optimizes the operating loop around evidence, authorization, action and verification.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><div className="text-2xl font-bold">01</div><div className="mt-1 text-[10px] text-slate-500">Decision loop</div></div><div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><div className="text-2xl font-bold">02</div><div className="mt-1 text-[10px] text-slate-500">Security graph</div></div><div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><div className="text-2xl font-bold">03</div><div className="mt-1 text-[10px] text-slate-500">Infinite Pentest</div></div><div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4"><div className="text-2xl font-bold">04</div><div className="mt-1 text-[10px] text-slate-500">Evidence</div></div></div></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><div className="flex items-end justify-between gap-4"><div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Reference leaders</div><h2 className="mt-2 text-2xl font-bold sm:text-3xl">What the market does well</h2></div><div className="hidden text-right text-[10px] leading-5 text-slate-500 sm:block">Reference scores are capability markers,<br />not a claim that ELITZE outranks them.</div></div><div className="mt-7 space-y-3">{benchmark.map(([name, strength, score, lane]) => <div key={name} className="grid gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-[1.1fr_.8fr_1.2fr_auto] sm:items-center"><div><div className="text-sm font-bold">{name}</div><div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">{strength}</div></div><div className="text-xs text-slate-400">Best known for <span className="font-semibold text-white">{lane}</span></div><div><div className="flex items-center justify-between text-[10px] text-slate-500"><span>Capability reference</span><span className="font-mono text-slate-300">{score}%</span></div><Bar value={Number(score)} /></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-red-500/10 text-red-300"><Check className="h-4 w-4" /></div></div>)}</div></section>

      <section className="border-y border-white/8 bg-white/[0.015]"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-red-300"><Zap className="h-3.5 w-3.5" /> ELITZE advantage</div><h2 className="mt-3 text-3xl font-bold tracking-tight">The product is the loop.</h2><p className="mt-4 max-w-md text-sm leading-6 text-slate-400">The differentiator is not one more module. It is the handoff between detection, decision, action, retest and evidence.</p><Link href="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red-300">See the philosophy <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{dimensions.map(([title, body]) => <div key={title} className="rounded-2xl border border-white/8 bg-black/20 p-5"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-xs font-bold text-red-300">✓</span><h3 className="text-sm font-semibold">{title}</h3></div><p className="mt-3 text-xs leading-5 text-slate-400">{body}</p></div>)}</div></div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18"><div className="rounded-[28px] border border-red-500/20 bg-red-500/[0.04] p-7 text-center sm:p-10"><div className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-300">Design rule</div><h2 className="mx-auto mt-3 max-w-3xl text-2xl font-bold sm:text-4xl">No green screen without green evidence.</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-400">The benchmark is only useful when the product can demonstrate the same control loop with real connected data.</p><Link href="/console" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white">Open ELITZE <ArrowRight className="h-4 w-4" /></Link></div></section>
    </main>
  );
}
