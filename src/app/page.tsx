"use client";
import Link from "next/link";
import { useLayoutEffect, useState } from "react";
import { Activity, ArrowRight, Bot, Check, Fingerprint, LockKeyhole, Menu, Moon, Network, ScanSearch, ShieldCheck, Sparkles, Sun, Workflow, X } from "lucide-react";
import { ThreatGlobe } from "@/components/threat-globe";
import ObsidianIntelligence from "@/components/obsidian-intelligence";

const cards = [
  [Fingerprint,"Identity","Know who can act before anything acts."],
  [Network,"Attack paths","See how access, assets and dependencies connect."],
  [Bot,"AI agents","Control tools, purpose and data at the execution boundary."],
  [ScanSearch,"Offensive validation","Test the path and verify whether the weakness is real."],
  [LockKeyhole,"Runtime defense","Contain suspicious behavior without losing control."],
  [Workflow,"Evidence","Keep the decision, action and retest tied together."],
] as const;
const loop = ["Detect","Explain","Authorize","Act","Retest","Evidence"];

function ThemeToggle(){
 const [light,setLight]=useState(false);
 useLayoutEffect(()=>{const stored=window.localStorage.getItem("elitze-theme");const next=stored?stored==="light":window.matchMedia("(prefers-color-scheme: light)").matches;setLight(next);document.documentElement.dataset.theme=next?"light":"dark";},[]);
 const toggle=()=>{const next=!light;setLight(next);document.documentElement.dataset.theme=next?"light":"dark";window.localStorage.setItem("elitze-theme",next?"light":"dark");};
 return <button type="button" onClick={toggle} aria-label="Toggle theme" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--muted-strong)]">{light?<Moon className="h-4 w-4"/>:<Sun className="h-4 w-4"/>}</button>;
}

export default function HomePage(){
 const [mobileOpen,setMobileOpen]=useState(false);
 return <main className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
  <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
   <Link href="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5"/></span><span><b className="block text-sm">ELITZE</b><span className="block text-[9px] uppercase tracking-[.2em] text-[var(--accent)]">Agentic Security</span></span></Link>
   <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex"><Link href="/platform">Platform</Link><Link href="/security">Security</Link><Link href="/compare">Compare</Link><Link href="/about">About</Link><Link href="/faq">FAQ</Link></nav>
   <div className="flex items-center gap-2"><ThemeToggle/><Link href="/console" className="hidden rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex">Open Console</Link><button type="button" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] md:hidden">{mobileOpen?<X className="h-5 w-5"/>:<Menu className="h-5 w-5"/>}</button></div>
  </div>{mobileOpen&&<nav className="border-t border-[var(--border)] px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1">{[["Platform","/platform"],["Security","/security"],["Compare","/compare"],["About","/about"],["FAQ","/faq"],["Console","/console"]].map(([label,href])=><Link key={href} href={href} onClick={()=>setMobileOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[var(--muted)]">{label}</Link>)}</div></nav>}</header>

  <section className="relative overflow-hidden border-b border-[var(--border)]"><div className="pointer-events-none absolute inset-0 hero-grid opacity-70"/><div className="pointer-events-none absolute left-1/2 top-[-180px] h-[700px] w-[950px] -translate-x-1/2 rounded-full bg-[var(--accent-glow)] blur-3xl"/>
   <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[.88fr_1.12fr] lg:items-center lg:py-24">
    <div className="order-2 lg:order-1"><div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] pulse-soft"/> Security that sees the whole system</div>
     <h1 className="mt-6 max-w-3xl text-[3.35rem] font-black leading-[.9] tracking-[-.065em] sm:text-6xl lg:text-7xl xl:text-[5.2rem]">See the threat.<br/><span className="text-[var(--accent)]">Control the path.</span><br/>Prove the fix.</h1>
     <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted-strong)]">ELITZE turns software, cloud, identities, AI agents and runtime behavior into one governed security decision.</p>
     <div className="mt-8 flex flex-wrap gap-3"><Link href="/console" className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(239,68,68,.28)]">Enter ELITZE <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></Link><Link href="#surface" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Explore threat surface</Link></div>
     <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted)]"><div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3"><div className="font-mono text-[var(--accent)]">01</div>Context</div><div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3"><div className="font-mono text-[var(--accent)]">02</div>Decision</div><div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3"><div className="font-mono text-[var(--accent)]">03</div>Evidence</div></div>
    </div>
    <div id="surface" className="order-1 lg:order-2"><ThreatGlobe/></div>
   </div>
  </section>

  <section className="border-b border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-7 sm:px-6"><div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--muted)]"><span className="inline-flex items-center gap-2 text-[var(--accent)]"><Activity className="h-3.5 w-3.5"/> Detect</span><span>→</span><span>Explain</span><span>→</span><span>Authorize</span><span>→</span><span>Act</span><span>→</span><span>Retest</span><span>→</span><span className="text-[var(--accent)]">Evidence</span></div></div></section>

  <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([Icon,title,desc],i)=><article key={title} className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[var(--accent-border)]"><div className="absolute right-4 top-4 font-mono text-[9px] text-[var(--muted)]">0{i+1}</div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><Icon className="h-5 w-5"/></div><h2 className="mt-5 text-base font-bold">{title}</h2><p className="mt-1.5 text-xs leading-5 text-[var(--muted)]">{desc}</p><div className="mt-6 h-px w-10 bg-[var(--accent)] transition-all group-hover:w-20"/></article>)}</div></section>

  <section className="border-y border-[var(--border)] bg-[var(--section)]"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><ObsidianIntelligence/></div></section>

  <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]"><div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]"><Workflow className="h-4 w-4"/> Continuous control</div><h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">A threat is not a ticket. It is a path that must change.</h2><div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-6">{loop.map((step,i)=><div key={step} className={`rounded-xl border p-3 ${i===5?"border-[var(--accent-border)] bg-[var(--accent-soft)]":"border-[var(--border)] bg-[var(--panel-strong)]"}`}><div className="font-mono text-[9px] text-[var(--accent)]">0{i+1}</div><div className="mt-2 text-xs font-semibold">{step}</div></div>)}</div></div><div className="rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-8"><Sparkles className="h-6 w-6 text-[var(--accent)]"/><h2 className="mt-4 text-2xl font-bold">No green badge without proof.</h2><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Security state should trace back to connected evidence. No synthetic assets. No invented events. No silent failure.</p><div className="mt-7 space-y-2 text-xs font-semibold"><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]"/> Source-bound security state</div><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]"/> Policy-bound actions</div><div className="flex items-center gap-2"><Check className="h-4 w-4 text-[var(--accent)]"/> Retest-backed closure</div></div></div></div></section>

  <section className="border-t border-[var(--border)]"><div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20"><div className="text-xs font-bold uppercase tracking-[.22em] text-[var(--accent)]">The new security operating model</div><h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black tracking-[-.04em] sm:text-5xl">One place to see the threat, decide the response and prove what happened.</h2><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white">Open Console <ArrowRight className="h-4 w-4"/></Link><Link href="/about" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">How ELITZE works</Link></div></div></section>
 </main>;
}
