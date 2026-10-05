"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Boxes,
  BrainCircuit,
  Cloud,
  Code2,
  Crosshair,
  Database,
  Fingerprint,
  GitBranch,
  Globe2,
  KeyRound,
  Network,
  Radar,
  Search,
  ServerCog,
  ShieldCheck,
  ShieldEllipsis,
  Sparkles,
  TerminalSquare,
  Workflow,
  Wrench,
} from "lucide-react";

export type Capability = {
  id: string;
  category: string;
  title: string;
  detail: string;
  href: string;
  icon: typeof Activity;
  state: "LIVE SURFACE" | "CONTROL" | "VALIDATION" | "INTELLIGENCE";
};

export const capabilities: Capability[] = [
  { id: "global-view", category: "Command", title: "Global Security View", detail: "Spatial security context across identity, agents, MCP, APIs, cloud and data.", href: "/console", icon: Globe2, state: "LIVE SURFACE" },
  { id: "global-search", category: "Command", title: "Global Search", detail: "Search external security intelligence through an untrusted-data broker.", href: "/search", icon: Search, state: "INTELLIGENCE" },
  { id: "agent-security", category: "AI Security", title: "Agent Security", detail: "Agent identity, delegation, reachability and execution boundaries.", href: "/security", icon: Bot, state: "CONTROL" },
  { id: "mcp-security", category: "AI Security", title: "MCP & Tool Governance", detail: "MCP server, tool authorization and controlled gateway execution.", href: "/console", icon: Wrench, state: "CONTROL" },
  { id: "ai-security", category: "AI Security", title: "AI / LLM Security", detail: "Govern model-to-action boundaries and preserve source-bound evidence.", href: "/security", icon: BrainCircuit, state: "CONTROL" },
  { id: "identity", category: "Identity", title: "Identity & Workload Security", detail: "Human, workload and non-human identity controls with session boundaries.", href: "/console", icon: Fingerprint, state: "CONTROL" },
  { id: "access", category: "Identity", title: "Authorization & Access", detail: "Policy decisions, approvals, reauthentication and privileged boundaries.", href: "/console", icon: KeyRound, state: "CONTROL" },
  { id: "apis", category: "Application", title: "API Security", detail: "API and OpenAPI security controls around exposed application paths.", href: "/platform", icon: Network, state: "CONTROL" },
  { id: "code", category: "Application", title: "Code & Supply Chain", detail: "Release-aware security validation and code security workflow.", href: "/platform", icon: Code2, state: "VALIDATION" },
  { id: "cloud", category: "Cloud", title: "Cloud & Runtime", detail: "Cloud identity, workload context and runtime reachability.", href: "/platform", icon: Cloud, state: "CONTROL" },
  { id: "data", category: "Data", title: "Sensitive Data Reachability", detail: "Track governed paths toward protected data and credentials.", href: "/security", icon: Database, state: "CONTROL" },
  { id: "secops", category: "SecOps", title: "Exposure & Vulnerability", detail: "Exposure, vulnerability priority and security operations context.", href: "/console/vulnerabilities", icon: Radar, state: "INTELLIGENCE" },
  { id: "graph", category: "SecOps", title: "Security Graph", detail: "Observed nodes, relationships, reachability and evidence state.", href: "/console", icon: GitBranch, state: "LIVE SURFACE" },
  { id: "analyst", category: "SecOps", title: "Autonomous Analyst", detail: "Evidence-driven analysis surface for authenticated operators.", href: "/console/analyst", icon: Activity, state: "INTELLIGENCE" },
  { id: "pentest", category: "Validation", title: "Automated Security Testing", detail: "Authorized security-test requests, release validation and retesting.", href: "/console/pentesting", icon: Crosshair, state: "VALIDATION" },
  { id: "manual", category: "Validation", title: "Manual Pentesting", detail: "Authorized manual assessment workflow with explicit scope and evidence.", href: "/control-room", icon: ShieldEllipsis, state: "VALIDATION" },
  { id: "reo", category: "Validation", title: "REO", detail: "Evidence-backed retesting of reachable security conditions.", href: "/reo", icon: ShieldCheck, state: "VALIDATION" },
  { id: "orchestration", category: "Runtime", title: "Orchestration Defense", detail: "Governed workflows for high-impact autonomous actions.", href: "/orchestration", icon: Workflow, state: "CONTROL" },
  { id: "mcp", category: "Runtime", title: "Runtime Gateway", detail: "Policy and identity boundary before sensitive tool execution.", href: "/console", icon: TerminalSquare, state: "CONTROL" },
  { id: "integrations", category: "Integrations", title: "Security Integrations", detail: "Provider adapter paths for reviewed enterprise security ecosystems.", href: "/platform", icon: ServerCog, state: "LIVE SURFACE" },
  { id: "compliance", category: "Governance", title: "Global Compliance", detail: "Governance, legal controls and evidence-backed publishing discipline.", href: "/compliance", icon: Boxes, state: "CONTROL" },
  { id: "google", category: "Governance", title: "Google Ads Governance", detail: "Truthful publishing and advertising control checks.", href: "/console/google-ads", icon: Sparkles, state: "CONTROL" },
];

const categories = ["ALL", ...Array.from(new Set(capabilities.map((item) => item.category)))];

export default function SecurityCapabilityAtlas() {
  const [category, setCategory] = useState("ALL");
  const [active, setActive] = useState("global-view");
  const filtered = useMemo(
    () => category === "ALL" ? capabilities : capabilities.filter((item) => item.category === category),
    [category],
  );
  const selected = capabilities.find((item) => item.id === active) ?? capabilities[0];

  return (
    <section className="relative overflow-hidden border-y border-[var(--border)] bg-[var(--section)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,.10),transparent_24%),radial-gradient(circle_at_88%_75%,rgba(167,139,250,.10),transparent_22%)]" />
      <div className="relative mx-auto max-w-[1400px] px-4 py-16 sm:px-7 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div className="max-w-3xl">
            <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE SECURITY ATLAS</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">Every security control, one visible surface.</h2>
            <p className="mt-5 text-sm leading-7 text-[var(--muted-strong)]">Explore the product by security domain. Each tile is a live application surface or documented control path—not a decorative claim of unverified telemetry.</p>
          </div>
          <Link href="/search" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] px-4 py-3 text-xs font-bold text-[var(--accent)]"><Search className="h-4 w-4" /> Open Global Search</Link>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3 py-2 text-[9px] font-bold uppercase tracking-[.16em] transition ${category === item ? "border-cyan-300/45 bg-cyan-300/10 text-cyan-100" : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)]"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_330px]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => setActive(item.id)} className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition hover:-translate-y-1 ${active === item.id ? "border-cyan-300/45 bg-cyan-300/[.06] shadow-[0_18px_55px_rgba(34,211,238,.08)]" : "border-[var(--border)] bg-[var(--panel)]"}`}>
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/[.06] blur-2xl transition group-hover:bg-cyan-300/[.12]" />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><Icon className="h-4 w-4" /></span>
                    <span className="text-[8px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">{item.state}</span>
                  </div>
                  <div className="relative mt-4 text-sm font-bold">{item.title}</div>
                  <p className="relative mt-2 text-[11px] leading-5 text-[var(--muted)]">{item.detail}</p>
                  <div className="relative mt-4 font-mono text-[8px] uppercase tracking-[.14em] text-[var(--muted)]">{item.category}</div>
                </button>
              );
            })}
          </div>

          <aside className="relative overflow-hidden rounded-3xl border border-[var(--accent-border)] bg-[#04070b] p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,.28)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(103,232,249,.16),transparent_32%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[9px] font-bold uppercase tracking-[.22em] text-cyan-300/75">SELECTED CONTROL</div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[.06] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.12em] text-cyan-100">{selected.state}</span>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/25 bg-cyan-200/[.06] text-cyan-100 shadow-[0_0_40px_rgba(103,232,249,.12)]"><selected.icon className="h-5 w-5" /></span>
                <div><div className="text-lg font-black tracking-[-.03em]">{selected.title}</div><div className="mt-1 text-[9px] uppercase tracking-[.14em] text-slate-500">{selected.category}</div></div>
              </div>
              <p className="mt-5 text-xs leading-6 text-slate-400">{selected.detail}</p>
              <Link href={selected.href} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-xs font-bold text-slate-950">Open control <span aria-hidden="true">↗</span></Link>

              <div className="mt-7 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="font-mono text-lg">{capabilities.length}</div><div className="mt-1 text-[8px] uppercase tracking-[.14em] text-slate-600">Mapped surfaces</div></div>
                <div className="rounded-xl border border-white/8 bg-white/[.025] p-3"><div className="font-mono text-lg">CUSTOM</div><div className="mt-1 text-[8px] uppercase tracking-[.14em] text-slate-600">Policy surface</div></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
