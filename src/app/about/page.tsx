import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Bug,
  Globe2,
  Network,
  Radar,
  Search,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

export const metadata = {
  title: "ELITZE Global Security System",
  description:
    "ELITZE global security view, threat intelligence, CVE intelligence, agent reach, red-team validation and policy-controlled response.",
  alternates: { canonical: "/about" },
};

const systems = [
  {
    title: "God’s Eye · Global Security View",
    detail: "One command surface for connected security domains, relationships and exposure paths.",
    href: "/#global-security",
    label: "GLOBAL VIEW",
    icon: Globe2,
  },
  {
    title: "Global Search",
    detail: "Search external intelligence. Results remain source-linked and untrusted until verified.",
    href: "/search",
    label: "SEARCH",
    icon: Search,
  },
  {
    title: "CVE & Threat Intelligence",
    detail: "NVD, CISA KEV, EPSS, GitHub advisories, affected products and remediation context.",
    href: "/console/vulnerabilities",
    label: "CVE · KEV · EPSS",
    icon: Bug,
  },
  {
    title: "Security Graph & Agent Reach",
    detail: "Relate identities, agents, MCP tools, resources, permissions and observed reachability.",
    href: "/console",
    label: "GRAPH · REACH",
    icon: Network,
  },
  {
    title: "Autonomous Security Analyst",
    detail: "Correlate source-backed findings, preserve evidence gaps and propose next actions.",
    href: "/console/analyst",
    label: "INVESTIGATE",
    icon: Bot,
  },
  {
    title: "Red Team & Penetration Testing",
    detail: "Manage authorized test runs, defined scope, Rules of Engagement and retesting.",
    href: "/console/pentesting",
    label: "RED TEAM",
    icon: Radar,
  },
  {
    title: "Policy, REO & Response",
    detail: "Govern consequential actions with explicit policy, approval boundaries and audit evidence.",
    href: "/reo",
    label: "CONTROL",
    icon: ShieldCheck,
  },
  {
    title: "SecOps Control Room",
    detail: "Bring investigation, response and validation workflows into the operating path.",
    href: "/control-room",
    label: "SECOPS",
    icon: Waypoints,
  },
];

const loop = ["Detect", "Investigate", "Authorize", "Act", "Retest", "Preserve evidence"];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold tracking-wide">ELITZE</span>
          </Link>
          <Link href="/console" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">
            Open Command Center <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-4xl">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">ELITZE · Agentic Security</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">One global view. One governed security loop.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">
              See the threat surface, search intelligence, connect findings to assets and agent reach, control response, and retest the original condition. No fabricated telemetry or assumed protection.
            </p>
          </div>
          <Link href="/#global-security" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--accent)]">
            Open God’s Eye View <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {loop.map((step, index) => (
            <div key={step} className="flex min-h-12 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3">
              <span className="font-mono text-[10px] text-[var(--accent)]">0{index + 1}</span>
              <span className="text-xs font-semibold">{step}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">System modules</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Go straight to the capability.</h2>
          </div>
          <span className="hidden text-xs text-[var(--muted)] sm:inline">Connected data determines operational status.</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {systems.map(({ title, detail, href, label, icon: Icon }) => (
            <Link key={title} href={href} className="group flex min-h-48 flex-col rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:border-[var(--accent-border)] hover:bg-[var(--panel-strong)]">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-bold tracking-[.16em] text-[var(--muted)]">{label}</span>
              </div>
              <h3 className="mt-5 text-base font-bold">{title}</h3>
              <p className="mt-2 flex-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                Open module <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold">Evidence before confidence.</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Public threat intelligence is not proof that a customer asset is affected. Missing integrations, reachability and runtime evidence remain explicit.</p>
          </div>
          <Link href="/console/readiness" className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-[var(--accent)]">
            Review readiness <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
