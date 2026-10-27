"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, Bot, BookOpen, BrainCircuit, CheckCircle2, ClipboardCheck,
  FileSearch, Fingerprint, Gauge, MessageSquareText, Network, Radar,
  Search, ShieldAlert, ShieldCheck, Workflow, Wrench,
} from "lucide-react";

type AreaId = "discover" | "investigate" | "validate" | "govern" | "chat" | "evidence" | "learn";
type Destination = { title: string; href: string; summary: string; tags: string[] };

const areas: Array<{ id: AreaId; label: string; icon: typeof Gauge; description: string; items: Destination[] }> = [
  {
    id: "discover", label: "Discover", icon: Radar,
    description: "Inventory the security surface and understand which identities, agents, tools and integrations are actually connected.",
    items: [
      { title: "Command center", href: "/console", summary: "Tenant-scoped metrics, security graph and workspace shortcuts.", tags: ["dashboard", "overview", "graph"] },
      { title: "Integrations", href: "/console/integrations", summary: "Configure data sources and verify their observed connection state.", tags: ["connectors", "sources", "mcp"] },
      { title: "Agentic SOC", href: "/console/agentic-soc", summary: "Review connected event evidence and run the bounded SOC analyst.", tags: ["agents", "events", "soc"] },
      { title: "Security skills", href: "/console/skills", summary: "Review scoped security capabilities and available skills.", tags: ["skills", "tools", "capabilities"] },
    ],
  },
  {
    id: "investigate", label: "Investigate", icon: FileSearch,
    description: "Investigate source-backed detections, connected events and exposure without treating missing data as a clean result.",
    items: [
      { title: "Autonomous analyst", href: "/console/analyst", summary: "Analyze eligible tenant evidence with bounded model review.", tags: ["analyst", "ai", "soc"] },
      { title: "Runtime threat detection", href: "/console/threat-detection", summary: "Inspect detections, source records and response recommendations.", tags: ["detections", "runtime", "threats"] },
      { title: "Vulnerability intelligence", href: "/console/vulnerabilities", summary: "Search CVE, CISA KEV and EPSS data; separate public intel from asset exposure.", tags: ["cve", "kev", "epss", "scanner"] },
      { title: "Agentic SOC", href: "/console/agentic-soc", summary: "Correlate observed signals and inspect evidence gaps.", tags: ["agent", "investigation", "evidence"] },
    ],
  },
  {
    id: "validate", label: "Validate", icon: ShieldAlert,
    description: "Run security checks within explicit authorization and scope, then preserve remediation and retest evidence.",
    items: [
      { title: "Adversary emulation", href: "/console/adversary-emulation", summary: "Launch authorized validation workflows with scope and approval controls.", tags: ["red team", "emulation", "pentest"] },
      { title: "Pentesting", href: "/console/pentesting", summary: "Review and run the available scoped security-test workflow.", tags: ["scanner", "nmap", "tests"] },
      { title: "Production readiness", href: "/console/readiness", summary: "Review deployment, authentication, database and integration release gates.", tags: ["release", "checklist", "health"] },
      { title: "Security tools", href: "/console/skills", summary: "Inspect supported tools and their operational boundaries.", tags: ["tools", "scanners", "integrations"] },
    ],
  },
  {
    id: "govern", label: "Govern", icon: Fingerprint,
    description: "Keep tenant identity, role permissions, tool capability, approval and policy ahead of sensitive actions.",
    items: [
      { title: "Organization & members", href: "/console/organization", summary: "Manage tenant membership and access.", tags: ["team", "rbac", "roles"] },
      { title: "Integrations", href: "/console/integrations", summary: "Review provider setup and authorization prerequisites.", tags: ["provider", "secrets", "mcp"] },
      { title: "Security model", href: "/security", summary: "Read about identity boundaries, policy gates and evidence states.", tags: ["policy", "authorization", "security"] },
      { title: "Compliance", href: "/compliance", summary: "Map operating controls and evidence to assurance requirements.", tags: ["grc", "controls", "audit"] },
    ],
  },
  {
    id: "chat", label: "Chat & agents", icon: MessageSquareText,
    description: "Work in governed conversations and agent workflows; execution authority remains separate from model output.",
    items: [
      { title: "ELITZE Chat", href: "/chat", summary: "Tenant-scoped conversation, collaboration and configured model connections.", tags: ["chat", "voice", "files", "collaboration"] },
      { title: "Recursive agents", href: "/recursive-agents", summary: "Inspect bounded multi-step agent workflows and evidence links.", tags: ["agents", "workflow", "model"] },
      { title: "Orchestration", href: "/orchestration", summary: "Explore policy-governed orchestration paths and execution boundaries.", tags: ["orchestration", "automation", "agent"] },
      { title: "SOC analyst", href: "/console/analyst", summary: "Use the analyst workspace for evidence-led investigation.", tags: ["chat", "analyst", "soc"] },
    ],
  },
  {
    id: "evidence", label: "Evidence", icon: ClipboardCheck,
    description: "Trace a finding through source, decision, authorization, action, remediation and retest.",
    items: [
      { title: "Readiness & release gates", href: "/console/readiness", summary: "Inspect blocking requirements instead of treating missing proof as success.", tags: ["evidence", "release", "status"] },
      { title: "Security value", href: "/console/roi", summary: "Review value inputs and their evidence state.", tags: ["roi", "value", "business case"] },
      { title: "Compliance", href: "/compliance", summary: "Review audit and control mapping.", tags: ["compliance", "audit", "controls"] },
      { title: "Documentation", href: "/docs", summary: "Read technical guides, controls and operating boundaries.", tags: ["docs", "guides", "architecture"] },
    ],
  },
  {
    id: "learn", label: "Learn", icon: BookOpen,
    description: "Get started, understand the product and find direct answers without navigating a long document.",
    items: [
      { title: "How-to guides", href: "/how-to", summary: "Follow the setup, investigation, validation and evidence walkthroughs.", tags: ["tutorial", "onboarding", "how to"] },
      { title: "About ELITZE", href: "/about", summary: "Understand the product boundary and capability groups.", tags: ["about", "platform"] },
      { title: "FAQ", href: "/faq", summary: "Search common questions about controls, data and integrations.", tags: ["faq", "answers", "help"] },
      { title: "Product help", href: "/help", summary: "Find chat, voice, model connection and evidence rules.", tags: ["help", "chat", "support"] },
    ],
  },
];

const walkthrough = [
  { label: "Discover", title: "Establish the real surface", description: "Start with connected sources and identities. Empty data or an unavailable provider must remain visible as a gap.", href: "/console/integrations", cta: "Review integrations", icon: Radar },
  { label: "Map", title: "Understand a path", description: "Use the security graph and event context to see which agent, tool, identity or asset is involved.", href: "/console", cta: "Open command center", icon: Network },
  { label: "Decide", title: "Evaluate before execution", description: "Review identity, permissions, requested scope, policy result and required human approval.", href: "/security", cta: "Review security model", icon: ShieldCheck },
  { label: "Validate", title: "Run only authorized checks", description: "Confirm target scope and permission before starting validation. Do not test third-party systems without authorization.", href: "/console/adversary-emulation", cta: "Open validation", icon: Wrench },
  { label: "Prove", title: "Keep the retest and evidence", description: "Trace each conclusion to a source. Preserve unresolved evidence gaps instead of marking the system healthy by default.", href: "/console/readiness", cta: "Check readiness", icon: CheckCircle2 },
];

export default function InteractiveProductHub() {
  const [activeArea, setActiveArea] = useState<AreaId>("discover");
  const [query, setQuery] = useState("");
  const [step, setStep] = useState(0);
  const selected = areas.find((area) => area.id === activeArea) ?? areas[0];
  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = areas.flatMap((area) => area.items.map((item) => ({ ...item, area: area.label, areaId: area.id })));
    return all.filter((item) => !q || [item.title, item.summary, item.area, ...item.tags].join(" ").toLowerCase().includes(q));
  }, [query]);
  const stage = walkthrough[step];
  const StageIcon = stage.icon;

  return (
    <section id="interactive-product-hub" className="border-b border-[var(--border)] bg-[#08131c] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200"><BrainCircuit className="size-4" /> Interactive product explorer</div>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-.05em] sm:text-5xl">One workspace. Purpose-built security surfaces.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Open the dashboard, work chat, analyst, vulnerability intelligence, validation workflows, integrations or evidence gates directly. Choose a domain or search the product surface.</p>
          </div>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4">
            <Search className="size-4 shrink-0 text-cyan-200" />
            <span className="sr-only">Search product areas</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find dashboards, chat, scanners, policies, evidence…" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500" />
            {query && <button type="button" onClick={() => setQuery("")} className="text-xs text-slate-400 hover:text-white">Clear</button>}
          </label>
        </div>

        {query.trim() ? (
          <div className="mt-7">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">{visibleItems.length} matching product surfaces</div>
            {visibleItems.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleItems.map((item) => <Link key={item.href + item.title} href={item.href} className="group rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-cyan-200/35 hover:bg-cyan-200/[.045]"><div className="flex items-start justify-between gap-3"><div className="text-sm font-semibold">{item.title}</div><ArrowRight className="size-4 shrink-0 text-cyan-200 transition group-hover:translate-x-1" /></div><p className="mt-2 text-xs leading-5 text-slate-400">{item.summary}</p><div className="mt-3 text-[9px] uppercase tracking-[.15em] text-slate-600">{item.area}</div></Link>)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-sm text-slate-400">No matching surface. Try “chat”, “scanner”, “agent”, “integration” or “evidence”.</div>}
          </div>
        ) : (
          <>
            <div role="tablist" aria-label="Product areas" className="mt-8 flex gap-2 overflow-x-auto pb-2">
              {areas.map((area) => { const Icon = area.icon; return <button key={area.id} role="tab" aria-selected={activeArea === area.id} onClick={() => setActiveArea(area.id)} className={"inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-3 text-xs font-semibold transition " + (activeArea === area.id ? "border-cyan-200/40 bg-cyan-200/10 text-cyan-100" : "border-white/10 bg-white/[.02] text-slate-400 hover:text-white")}><Icon className="size-4" />{area.label}</button>; })}
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
              <article className="rounded-3xl border border-cyan-200/20 bg-cyan-200/[.04] p-6">
                <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200">Selected domain</div>
                <h3 className="mt-3 text-2xl font-semibold">{selected.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{selected.description}</p>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-300"><ShieldCheck className="size-4 text-cyan-200" /> Tenant-scoped · evidence-aware</div>
              </article>
              <div className="grid gap-3 sm:grid-cols-2">
                {selected.items.map((item) => <Link key={item.href + item.title} href={item.href} className="group rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-cyan-200/35 hover:bg-cyan-200/[.04]"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold">{item.title}</h3><ArrowRight className="size-4 shrink-0 text-cyan-200 transition group-hover:translate-x-1" /></div><p className="mt-2 text-xs leading-5 text-slate-400">{item.summary}</p><div className="mt-4 flex flex-wrap gap-1.5">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md border border-white/10 px-2 py-1 text-[8px] uppercase tracking-wide text-slate-500">{tag}</span>)}</div></Link>)}
              </div>
            </div>
          </>
        )}

        <div className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6 lg:grid-cols-[.55fr_1.45fr] lg:items-center">
          <div><div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200">Interactive walkthrough</div><h3 className="mt-2 text-xl font-semibold">Discover → map → decide → validate → prove</h3><p className="mt-2 text-xs leading-5 text-slate-500">Illustrative flow only; it does not query or change production data.</p></div>
          <div>
            <div className="flex flex-wrap gap-2">{walkthrough.map((item, index) => <button key={item.label} type="button" onClick={() => setStep(index)} aria-pressed={step === index} className={"rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] " + (step === index ? "border-cyan-200/40 bg-cyan-200/10 text-cyan-100" : "border-white/10 text-slate-500 hover:text-white")}>{String(index + 1).padStart(2, "0")} {item.label}</button>)}</div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-200/[.07] text-cyan-100"><StageIcon className="size-5" /></span><div><h4 className="text-sm font-semibold">{stage.title}</h4><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{stage.description}</p></div></div>
              <div className="flex shrink-0 gap-2"><Link href={stage.href} className="inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-3.5 py-2.5 text-xs font-bold text-slate-950">{stage.cta}<ArrowRight className="size-3.5" /></Link><button type="button" onClick={() => setStep((current) => (current + 1) % walkthrough.length)} className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-cyan-200/30">Next step</button></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
