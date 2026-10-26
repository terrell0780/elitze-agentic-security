"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ArrowRight, Bot, BookOpen, CheckCircle2, CircleHelp, Clock3,
  Database, FileCheck2, Fingerprint, Gauge, GitBranch, Network, RefreshCw,
  Search, ShieldAlert, ShieldCheck, Users, Workflow, Wrench, X,
} from "lucide-react";

type Session = { ok: boolean; user: { platformOwner?: boolean } | null };
type Metrics = {
  agentIdentities: number;
  activeMcpServers: number;
  activePolicies: number;
  pendingApprovals: number;
  approvalRequests: number;
  gatewayDecisions: number;
  deniedGatewayDecisions: number;
  approvalRequiredDecisions: number;
  graphNodes: number;
  graphEdges: number;
  graphEvidence: number;
  securityTests: number;
  queuedTests: number;
  runningTests: number;
  completedTests: number;
  failedTests: number;
  evidenceRecords: number;
  latestDecisionAt: string | null;
  latestTestAt: string | null;
  latestEvidenceAt: string | null;
};
type Overview = { ok: boolean; metrics?: Metrics; error?: string };
type Health = { ok: boolean; checks?: Record<string, string>; error?: string };
type ProductLink = { title: string; href: string; summary: string; group: string; tags: string[]; icon: typeof Gauge };

const productLinks: ProductLink[] = [
  { title: "Command center", href: "/console", summary: "Tenant metrics, graph and work queue.", group: "Dashboards", tags: ["dashboard", "overview", "home"], icon: Gauge },
  { title: "Security graph", href: "/console", summary: "Explore observed assets, relationships and paths.", group: "Dashboards", tags: ["graph", "assets", "paths"], icon: Network },
  { title: "Agentic SOC", href: "/console/agentic-soc", summary: "Run bounded analysis over eligible observed events.", group: "Investigate", tags: ["agent", "soc", "events"], icon: Workflow },
  { title: "SOC analyst", href: "/console/analyst", summary: "Investigate tenant evidence and findings.", group: "Investigate", tags: ["analyst", "investigation", "ai"], icon: Bot },
  { title: "Threat detection", href: "/console/threat-detection", summary: "Review source-attributed detections and response evidence.", group: "Investigate", tags: ["detections", "runtime", "alerts"], icon: ShieldAlert },
  { title: "Vulnerability intelligence", href: "/console/vulnerabilities", summary: "Search CVE, CISA KEV and EPSS sources.", group: "Validate", tags: ["scanner", "cve", "kev", "epss"], icon: Search },
  { title: "Adversary emulation", href: "/console/adversary-emulation", summary: "Run authorized scope-bound validation workflows.", group: "Validate", tags: ["red team", "pentest", "attack"], icon: Wrench },
  { title: "Pentesting", href: "/console/pentesting", summary: "Access available security test workflows.", group: "Validate", tags: ["scanner", "nmap", "metasploit"], icon: Activity },
  { title: "Integrations", href: "/console/integrations", summary: "Configure providers and inspect connection evidence.", group: "Operate", tags: ["connectors", "mcp", "sources", "data"], icon: Database },
  { title: "Organization & members", href: "/console/organization", summary: "Manage tenant members and roles.", group: "Operate", tags: ["team", "users", "rbac"], icon: Users },
  { title: "Security skills", href: "/console/skills", summary: "Inspect available capabilities and tool boundaries.", group: "Operate", tags: ["skills", "tools", "capabilities"], icon: Fingerprint },
  { title: "Production readiness", href: "/console/readiness", summary: "Check release gates, dependencies and evidence gaps.", group: "Evidence", tags: ["release", "health", "ready"], icon: CheckCircle2 },
  { title: "Security value", href: "/console/roi", summary: "Review value inputs and their evidence states.", group: "Evidence", tags: ["roi", "value", "cost"], icon: FileCheck2 },
  { title: "Governed chat", href: "/chat", summary: "Use tenant-scoped chat, model connections and team collaboration.", group: "Work", tags: ["chat", "voice", "files", "messages"], icon: Bot },
  { title: "Recursive agents", href: "/recursive-agents", summary: "Inspect bounded multi-step agent workflows.", group: "Work", tags: ["agents", "workflow", "orchestration"], icon: GitBranch },
  { title: "Orchestration", href: "/orchestration", summary: "Review policy-governed orchestration boundaries.", group: "Work", tags: ["automation", "workflow", "control"], icon: Workflow },
  { title: "About", href: "/about", summary: "Product structure and capability boundaries.", group: "Learn", tags: ["about", "product"], icon: BookOpen },
  { title: "How-to guides", href: "/how-to", summary: "Step-by-step setup, investigation, validation and release workflows.", group: "Learn", tags: ["howto", "guides", "tutorial"], icon: BookOpen },
  { title: "FAQ", href: "/faq", summary: "Search operational and product answers.", group: "Learn", tags: ["faq", "questions", "help"], icon: CircleHelp },
  { title: "Documentation", href: "/docs", summary: "Technical guides and operating boundaries.", group: "Learn", tags: ["docs", "reference", "architecture"], icon: BookOpen },
];

const groups = ["All", "Dashboards", "Investigate", "Validate", "Operate", "Evidence", "Work", "Learn"];

function count(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat().format(value) : "—";
}

function time(value: string | null | undefined): string {
  if (!value) return "No verified event";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : date.toLocaleString();
}

export default function ProductWorkspaceHome() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json() as Session;
      setSession(data);
      if (!response.ok || !data.ok || !data.user) {
        setOverview(null);
        setHealth(null);
        return;
      }
      const responses = await Promise.all([
        fetch("/api/console/overview", { cache: "no-store" }),
        data.user.platformOwner ? fetch("/api/console/health", { cache: "no-store" }) : Promise.resolve(null),
      ]);
      const [overviewData, healthData] = await Promise.all([
        responses[0].json() as Promise<Overview>,
        responses[1] ? responses[1].json() as Promise<Health> : Promise.resolve(null),
      ]);
      setOverview(overviewData);
      setHealth(healthData);
    } catch {
      setError("Workspace status could not be loaded. Refresh to retry.");
      setSession((current) => current ?? { ok: false, user: null });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const metrics = overview?.metrics;
  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productLinks.filter((item) =>
      (group === "All" || item.group === group) &&
      (!q || [item.title, item.summary, item.group, ...item.tags].join(" ").toLowerCase().includes(q))
    );
  }, [group, query]);

  const signedIn = session?.ok === true && session.user !== null;
  const statusText = !session ? "Checking session" : signedIn ? (overview?.ok ? "Workspace loaded" : "Workspace evidence unavailable") : "Sign in required";
  const statusGood = signedIn && overview?.ok === true;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#070b10] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/[.08] bg-[#070b10]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="ELITZE workspace home">
            <span className="grid size-9 place-items-center rounded-xl border border-cyan-200/20 bg-cyan-200/[.07] text-cyan-100"><ShieldCheck className="size-5" /></span>
            <span><b className="block text-sm tracking-[.14em]">ELITZE</b><span className="block text-[9px] uppercase tracking-[.19em] text-slate-500">Security workspace</span></span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-xs" aria-label="Workspace navigation">
            <Link href="/console" className="rounded-lg border border-white/10 px-3 py-2.5 hover:border-cyan-200/30">Dashboard</Link>
            <Link href="/chat" className="rounded-lg border border-white/10 px-3 py-2.5 hover:border-cyan-200/30">Chat</Link>
            <Link href="/console/agentic-soc" className="rounded-lg border border-white/10 px-3 py-2.5 hover:border-cyan-200/30">Agentic SOC</Link>
            <Link href="/console/integrations" className="rounded-lg border border-white/10 px-3 py-2.5 hover:border-cyan-200/30">Integrations</Link>
            {!signedIn && <Link href="/login" className="rounded-lg border border-white/10 px-3 py-2.5 hover:border-cyan-200/30">Sign in</Link>}
            {signedIn && <button type="button" onClick={() => router.push("/console")} className="rounded-lg bg-cyan-200 px-3 py-2.5 font-bold text-slate-950">Open workspace</button>}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <section className="flex flex-col justify-between gap-5 border-b border-white/[.08] pb-7 sm:flex-row sm:items-end">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.23em] text-cyan-200">Workspace home</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Security operations</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Open the work area you need. Status and counts below come from the authenticated workspace APIs; unavailable data remains unavailable.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold hover:border-cyan-200/30 disabled:opacity-50"><RefreshCw className={"size-4 " + (busy ? "animate-spin" : "")} />{busy ? "Refreshing" : "Refresh status"}</button>
        </section>

        {error && <div role="alert" className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-amber-200/20 bg-amber-200/[.04] p-4 text-sm text-amber-100"><span>{error}</span><button type="button" onClick={() => void load()} aria-label="Retry status load"><RefreshCw className="size-4" /></button></div>}

        {!signedIn && session && (
          <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-cyan-200/20 bg-cyan-200/[.04] p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-cyan-100"><Fingerprint className="size-4" /> Authenticated workspace</div>
              <h2 className="mt-4 text-2xl font-semibold">Sign in to load tenant data</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">Dashboards, event evidence, team data, chat and security actions are available only through an authenticated session.</p>
              <div className="mt-6 flex flex-wrap gap-3"><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-cyan-200 px-4 py-3 text-sm font-bold text-slate-950">Sign in <ArrowRight className="size-4" /></Link><Link href="/register" className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold">Create account</Link></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-6 sm:p-8">
              <h2 className="text-base font-semibold">Public resources</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[["About", "/about"], ["How-to guides", "/how-to"], ["FAQ", "/faq"], ["Documentation", "/docs"]].map(([label, href]) => <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm hover:border-cyan-200/30">{label}<ArrowRight className="size-4 text-cyan-200" /></Link>)}
              </div>
            </div>
          </section>
        )}

        {signedIn && (
          <>
            <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[.025] px-4 py-3">
              <div className="flex items-center gap-3"><span className={"size-2 rounded-full " + (statusGood ? "bg-emerald-300" : "bg-amber-300")} /><span className="text-sm font-semibold">{statusText}</span><span className="text-xs text-slate-500">{health ? (health.ok ? "Platform health checks passed" : "Platform health has blocking checks") : "Tenant overview status"}</span></div>
              <Link href="/console/readiness" className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-200">Review release gates <ArrowRight className="size-3.5" /></Link>
            </section>
            <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Live workspace metrics">
              {[
                ["Agent identities", metrics?.agentIdentities, Fingerprint],
                ["Active MCP servers", metrics?.activeMcpServers, Network],
                ["Active policies", metrics?.activePolicies, ShieldCheck],
                ["Pending approvals", metrics?.pendingApprovals, Clock3],
                ["Gateway decisions", metrics?.gatewayDecisions, Activity],
                ["Denied decisions", metrics?.deniedGatewayDecisions, ShieldAlert],
                ["Security tests", metrics?.securityTests, Workflow],
                ["Evidence records", metrics?.evidenceRecords, FileCheck2],
              ].map(([label, value, Icon]) => { const Glyph = Icon as typeof Gauge; return <article key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between gap-3"><div className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">{String(label)}</div><Glyph className="size-4 text-cyan-200" /></div><div className="mt-3 font-mono text-2xl font-semibold">{count(value)}</div></article>; })}
            </section>
            <section className="mt-4 grid gap-3 lg:grid-cols-3">
              {[["Latest decision", metrics?.latestDecisionAt, Activity], ["Latest test", metrics?.latestTestAt, Workflow], ["Latest evidence", metrics?.latestEvidenceAt, FileCheck2]].map(([label, value, Icon]) => { const Glyph = Icon as typeof Gauge; return <article key={String(label)} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.02] p-4"><Glyph className="mt-0.5 size-4 text-cyan-200" /><div><div className="text-xs font-semibold">{String(label)}</div><div className="mt-1 text-[11px] text-slate-500">{time(value as string | null | undefined)}</div></div></article>; })}
            </section>
          </>
        )}

        <section className="mt-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-xl font-semibold tracking-tight">Work areas</h2><p className="mt-1 text-xs text-slate-500">Direct links to dashboards, chat, scanners, integrations and evidence workflows.</p></div>
            <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 sm:max-w-sm"><Search className="size-4 shrink-0 text-cyan-200" /><span className="sr-only">Search work areas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dashboards, chat, scanners…" className="w-full bg-transparent py-2.5 text-xs outline-none placeholder:text-slate-600" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X className="size-3.5 text-slate-500" /></button>}</label>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">{groups.map((item) => <button key={item} type="button" onClick={() => setGroup(item)} aria-pressed={group === item} className={"shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition " + (group === item ? "border-cyan-200/40 bg-cyan-200/10 text-cyan-100" : "border-white/10 text-slate-400 hover:text-white")}>{item}</button>)}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredLinks.map((item) => { const Icon = item.icon; return <Link key={item.href + item.title} href={item.href} className="group rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-cyan-200/30 hover:bg-cyan-200/[.035]"><div className="flex items-start justify-between gap-3"><span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-black/15 text-cyan-200"><Icon className="size-4" /></span><ArrowRight className="size-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-200" /></div><div className="mt-4 text-sm font-semibold">{item.title}</div><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{item.summary}</p><div className="mt-4 border-t border-white/[.06] pt-3 text-[9px] font-bold uppercase tracking-[.16em] text-slate-600">{item.group}</div></Link>; })}
          </div>
          {!filteredLinks.length && <div className="mt-3 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No matching work areas.</div>}
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.08] pt-5 text-[10px] text-slate-600"><span>Product status is evidence-gated. Illustrative content is not tenant telemetry.</span><div className="flex flex-wrap gap-4"><Link href="/about" className="hover:text-slate-300">About</Link><Link href="/how-to" className="hover:text-slate-300">How-to</Link><Link href="/faq" className="hover:text-slate-300">FAQ</Link><Link href="/docs" className="hover:text-slate-300">Docs</Link><Link href="/contact" className="hover:text-slate-300">Support</Link></div></footer>
      </div>
    </main>
  );
}
