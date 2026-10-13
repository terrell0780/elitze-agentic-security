import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/recursive-agents";
export const metadata: Metadata = {
  title: "Recursive Security Agents and Evidence-Bounded Reasoning",
  description: "Bounded recursive security agent workflows that preserve evidence lineage, limit autonomy, and route sensitive actions to ELITZE policy and human approval.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "ELITZE Recursive Agents", description: "Recursive analyst review without recursive privilege escalation." },
};

export default function Page() {
  return <SeoFeaturePage
    eyebrow="Recursive agents / control flow"
    title="Recursive reasoning. Finite execution. Verifiable output."
    description="ELITZE uses an explicit LangGraph state machine for evidence loading, deterministic analysis, optional model triage, recursive consistency checking, and persistence. The loop has a hard two-review maximum; model output can never enlarge its own authority."
    panels={[
      { title: "Bounded recursion", body: "At most two NIM review passes are allowed in a run. Empty source windows stop with UNMEASURABLE; retries never synthesize observations.", state: "Maximum two passes" },
      { title: "Evidence allowlist", body: "The model can reference only the finding IDs supplied for that run. Original severity and source references stay controlled by deterministic code.", state: "Immutable boundary" },
      { title: "Tool governance", body: "A recursive answer is never an execution grant. Sensitive tools and response steps still require ELITZE authorization, scoped identity, and applicable approvals.", state: "Least privilege" },
      { title: "Enterprise helpdesk pattern", body: "A secure IT-helpdesk agent should answer from approved knowledge, link its sources, request clarification for ambiguous requests, and require approval before changing accounts, access or infrastructure.", state: "Human-controlled" },
      { title: "Recursive vendor boundary", body: "A named Recursive context-layer product is not assumed connected. No endpoint or API behavior is fabricated; direct connector support remains NOT_CONFIGURED pending documented API and customer credentials.", state: "Explicit unknown" },
      { title: "Audit-ready outcome", body: "Each LangGraph run records the tenant, requesting actor, evidence counts, model configuration state, review notes, evidence gaps and associated findings.", state: "Traceable" }
    ]}
    links={[
      { title: "Agentic SOC", href: "/agentic-soc", description: "Run the LangGraph analyst against observed events." },
      { title: "Threat detection", href: "/threat-detection", description: "Use deterministic source-bound security rules." },
      { title: "MCP runtime security", href: "/security", description: "Enforce policy at sensitive action boundaries." },
      { title: "Integration status", href: "/integrations", description: "See which providers require live credentials and probes." }
    ]}
  />;
}
