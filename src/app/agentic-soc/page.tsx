import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/agentic-soc";
export const metadata: Metadata = {
  title: "Agentic SOC and LangGraph Security Analyst",
  description: "Evidence-first agentic SOC orchestration with bounded LangGraph workflows, optional NVIDIA NIM inference, tenant-isolated findings, and approval-gated response.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "ELITZE Agentic SOC", description: "Orchestrate observed security evidence, bounded analyst reasoning, and approval-controlled action." },
};

export default function Page() {
  return <SeoFeaturePage
    eyebrow="SOC / agent orchestration"
    title="A security agent that reasons over evidence—not around it."
    description="ELITZE combines deterministic detections with LangGraph orchestration and an optional NVIDIA NIM model review. The model may prioritize source-backed findings and expose evidence gaps; it cannot invent telemetry, alter source severity, or execute response actions on its own."
    panels={[
      { title: "LangGraph StateGraph", body: "A bounded workflow loads tenant-scoped observed events, computes deterministic detections, performs an optional model review, applies one recursive consistency pass, and persists the traceable result.", state: "Implemented in code" },
      { title: "NVIDIA NIM", body: "Use an NVIDIA NIM /v1 chat-completions endpoint and model ID. Credentials are encrypted in the tenant's AI-connection store. A separate live /v1/models probe is required before the connection is marked connected.", state: "Optional integration" },
      { title: "Recursive review", body: "The review is capped at two model passes. Each pass sees the same source evidence and an allowlist of finding IDs. New claims, invented indicators, and autonomous remediation are prohibited.", state: "Bounded" },
      { title: "IT helpdesk / security agent", body: "The same evidence boundary supports an enterprise helpdesk agent: answer from approved tenant documentation, reference the source, request clarification when needed, and route privileged actions for approval.", state: "Policy-gated" },
      { title: "Evidence lifecycle", body: "Each run records the triggering user, observed-event count, model status, finding IDs, gaps, and a machine-readable summary. Missing observations remain UNMEASURABLE.", state: "Tenant scoped" },
      { title: "Human-controlled response", body: "The analyst suggests next steps. ELITZE identity, policy, authorization, and runner controls decide whether an action can be executed; no action is inferred from a model reply.", state: "Approval required" }
    ]}
    links={[
      { title: "Threat detection", href: "/threat-detection", description: "Read the actual source-bound detections and their evidence references." },
      { title: "NVIDIA NIM / model connectors", href: "/integrations", description: "Review supported connection state and setup requirements." },
      { title: "Autonomous Analyst workspace", href: "/console/analyst", description: "Open the authenticated security-fabric and analyst console." },
      { title: "Obsidian evidence export", href: "/console/agentic-soc", description: "Export observed events as Markdown and an Obsidian note." }
    ]}
  />;
}
