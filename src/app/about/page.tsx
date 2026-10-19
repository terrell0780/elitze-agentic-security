import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Fingerprint, Network, ShieldCheck, Crosshair, FileCheck2 } from "lucide-react";
import SeoFeaturePage from "@/components/seo-feature-page";
import SecurityCapabilityAtlas from "@/components/security-capability-atlas";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/about";
export const metadata: Metadata = {
  title: "About ELITZE Agentic Security",
  description: "ELITZE Agentic Security governs agent identities, MCP tool reachability, policy authorization, security validation and verifiable evidence.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "About ELITZE Agentic Security", description: "One focused security platform for agent identity, MCP runtime controls, and evidence." },
};

const capabilityGroups = [
  {
    icon: Fingerprint,
    title: "Agent identity and access",
    detail: "Agent and workload identities, tenant boundaries, authorization, session controls, and delegated access.",
  },
  {
    icon: Network,
    title: "MCP and runtime reachability",
    detail: "MCP servers, tools, APIs, cloud workloads, sensitive data paths, and pre-execution policy enforcement.",
  },
  {
    icon: Crosshair,
    title: "Security validation",
    detail: "Authorized automated and manual testing, vulnerability review, scoped execution, remediation checks, and retesting.",
  },
  {
    icon: ShieldCheck,
    title: "Security operations",
    detail: "Source-backed detections, exposure context, integrations, compliance workflows, and operator-reviewed response.",
  },
  {
    icon: FileCheck2,
    title: "Evidence and assurance",
    detail: "Traceable decisions, source references, observation timestamps, explicit evidence states, and verifiable outcomes.",
  },
];

export default function Page() {
  return (
    <>
      <SeoFeaturePage
        eyebrow="About ELITZE"
        title="One platform. Clear control over AI agents."
        description="ELITZE Agentic Security helps teams identify agents and MCP servers, understand what they can reach, enforce policy before sensitive actions, validate security within authorized scope, and preserve evidence for review."
        sectionTitle="The security control model"
        panels={[
          { title: "Discover and identify", body: "Build a tenant-scoped inventory from explicitly authorized integrations. Unverified assets are not presented as confirmed discoveries." },
          { title: "Map reach", body: "Connect identities to servers, tools, APIs, and data using source-backed relationships. Insufficient coverage remains clearly identified." },
          { title: "Evaluate and authorize", body: "Evaluate policy before sensitive tool execution. Sara cannot grant its own permissions or bypass required approvals." },
          { title: "Observe and verify", body: "Keep provider events, validation results, and retest evidence tied to their sources. Configuration alone is not proof of effective operation." },
        ]}
        links={[
          { title: "Security model", href: "/security", description: "Identity, policy boundaries, evidence states, and runtime controls." },
          { title: "Integrations", href: "/integrations", description: "Review supported connections and their operational boundaries." },
          { title: "Documentation", href: "/docs", description: "Technical guides and operator workflows." },
        ]}
      />

      <section className="border-t border-[var(--border)] bg-[var(--section)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Platform capabilities</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">The detail lives here—not on the homepage.</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Five capability groups keep the product easy to scan while preserving the full scope for technical and enterprise review.</p>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {capabilityGroups.map((group) => {
              const Icon = group.icon;
              return (
                <article key={group.title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{group.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{group.detail}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div>
                <h3 className="font-semibold">Sara + ELITZE</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Sara is the ELITZE security assistant. ELITZE is the platform. Both operate within explicit authorization boundaries; runtime activity is reported only when supported by evidence.</p>
              </div>
            </div>
            <Link href="/console" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--accent)]">
              Open control plane <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-xs leading-5 text-[var(--muted)]">Evidence remains clearly labeled as observed, declared, inferred, not verified, or not measurable. ELITZE never presents missing telemetry as proof of a secure state.</p>
        </div>
      </section>

      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-7 sm:pt-16">
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Detailed capability map</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Explore the full ELITZE product surface</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">Use the interactive catalog below when you need capability-level detail. The homepage stays focused on the core value proposition.</p>
        </div>
      </section>
      <SecurityCapabilityAtlas />
    </>
  );
}
