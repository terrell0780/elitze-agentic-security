import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import SecurityCapabilityAtlas from "@/components/security-capability-atlas";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/about";
export const metadata: Metadata = {
  title: "About ELITZE Agentic Security",
  description: "ELITZE Agentic Security governs agent identities, MCP tool reachability, policy authorization, security validation and tamper-evident evidence.",
  alternates: { canonical: url },
  openGraph: { type:"website", url, title:"About ELITZE Agentic Security", description:"The security boundary for enterprise agents is identity, policy and verifiable evidence." },
};

export default function Page(){
  return <>
  <SeoFeaturePage
    eyebrow="About ELITZE"
    title="The security boundary is identity, policy, and proof."
    description="ELITZE Agentic Security is an enterprise cybersecurity control plane for agent identity and MCP runtime security. Discover each agent and server, map the reachable tools and data, enforce policy before sensitive execution, observe actual activity, retest changes, and preserve evidence."
    panels={[
      {title:"Discover and identify",body:"Build a tenant-scoped inventory of agent/workload identities and MCP servers from authorized integrations. Unverified assets remain unverified until discovery evidence exists."},
      {title:"Map reach",body:"Show source-backed relationships among agents, servers, tools, APIs, secrets and data. An inferred path is not an observed path; insufficient graph coverage remains INSUFFICIENT_REACH."},
      {title:"Evaluate and authorize",body:"Evaluate policy before sensitive tool execution. A language model never grants itself permissions or bypasses deterministic authorization and approval requirements."},
      {title:"Observe and detect",body:"Correlate authenticated provider events and source-bound detections. Preserve original timestamps, connector identities, event references and evidence state."},
      {title:"Test and retest",body:"Run the supported validation scanner only when authorization, scope, profile, signed runner configuration and unexpired Rules of Engagement are valid."},
      {title:"Prove outcomes",body:"Record source findings and retest results separately. A configured integration, queued job, passed build or missing alert is not proof of security effectiveness."}
    ]}
    links={[
      {title:"FAQ",href:"/faq",description:"Architecture, evidence states, integrations and product limits."},
      {title:"Contributing",href:"/contributing",description:"Development, safe test practices and how to help."},
      {title:"Threat detection",href:"/threat-detection",description:"Deterministic source-bound alert correlation."},
      {title:"Acquisition",href:"/sales",description:"Outright asset acquisition and technical diligence."}
    ]}
  />
  <SecurityCapabilityAtlas />
  </>;
}
