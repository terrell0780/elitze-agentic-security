export type CapabilityStatus = "IMPLEMENTED" | "PARTIAL" | "PLANNED" | "BLOCKED";

export type Capability = {
  id: string;
  domain: "AI_SECURITY" | "SECOPS" | "IDENTITY" | "CLOUD" | "DATA" | "NETWORK" | "REO" | "ORCHESTRATION";
  name: string;
  status: CapabilityStatus;
  requirement: string;
};

export const ELITZE_CAPABILITY_REGISTRY: Capability[] = [
  { id:"ai-gateway", domain:"AI_SECURITY", name:"ELITZE AI Gateway", status:"PARTIAL", requirement:"Inline LLM, MCP, A2A, API, browser and SaaS control point." },
  { id:"ai-runtime", domain:"AI_SECURITY", name:"ELITZE Runtime Guard", status:"PARTIAL", requirement:"Inline prompt, response, tool and action inspection." },
  { id:"ai-discovery", domain:"AI_SECURITY", name:"ELITZE AI Discovery", status:"PARTIAL", requirement:"Discover managed and unmanaged AI apps, agents, models and services." },
  { id:"agent-identity", domain:"IDENTITY", name:"ELITZE Agent Identity", status:"PARTIAL", requirement:"Risk-aware authorization for every agent action." },
  { id:"ai-posture", domain:"AI_SECURITY", name:"ELITZE AI Posture", status:"PLANNED", requirement:"Configuration, access and exposure posture across AI services and models." },
  { id:"model-security", domain:"AI_SECURITY", name:"ELITZE Model Guard", status:"PLANNED", requirement:"Model integrity, backdoor, deserialization and artifact scanning." },
  { id:"ai-supply-chain", domain:"AI_SECURITY", name:"ELITZE AI Supply Chain", status:"PLANNED", requirement:"Packages, dependencies, skills, datasets, models and provenance." },
  { id:"adversarial-lab", domain:"AI_SECURITY", name:"ELITZE Adversarial Lab", status:"PARTIAL", requirement:"Authorized red-team campaigns for agent, prompt, MCP, application, supply-chain and containment paths with evidence-backed retesting." },
  { id:"continuous-validation", domain:"REO", name:"ELITZE Continuous Validation", status:"PARTIAL", requirement:"Connect release testing, runtime observations, remediation and independent retest evidence." },
  { id:"daily-snapshot", domain:"REO", name:"ELITZE Daily Snapshot", status:"IMPLEMENTED", requirement:"Create a tenant-scoped append-only daily security-state checkpoint with hash continuity." },
  { id:"security-timeline", domain:"REO", name:"ELITZE Security Timeline", status:"PLANNED", requirement:"Compare daily snapshots, releases, incidents, pentests, remediations and policy changes over time." },
  { id:"evidence-ledger", domain:"REO", name:"ELITZE Evidence Ledger", status:"PARTIAL", requirement:"Preserve provenance, integrity, freshness, chain linkage, signatures and independent verification." },
  { id:"evidence-verifier", domain:"REO", name:"ELITZE Evidence Verifier", status:"PLANNED", requirement:"Independently verify exported evidence bundles without an ELITZE service connection." },
  { id:"secure-sandbox", domain:"AI_SECURITY", name:"ELITZE Secure Sandbox", status:"PLANNED", requirement:"Isolate autonomous execution with constrained network, filesystem, identity and containment controls." },
  { id:"orchestration-core", domain:"ORCHESTRATION", name:"ELITZE Governed Orchestration", status:"IMPLEMENTED", requirement:"Route security and intelligence objectives through one policy-gated orchestration boundary with audit evidence." },
  { id:"orchestration-secops", domain:"SECOPS", name:"ELITZE SecOps Routing", status:"PARTIAL", requirement:"Coordinate threat hunting, vulnerability analysis and incident-response plans through ELITZE controls; external execution remains adapter-bound." },
  { id:"orchestration-intelligence", domain:"ORCHESTRATION", name:"ELITZE Intelligence Routing", status:"PLANNED", requirement:"Production investigative connectors with provenance, source trust and tenant authorization." },
  { id:"orchestration-memory", domain:"ORCHESTRATION", name:"ELITZE Evidence Memory", status:"PLANNED", requirement:"Persistent tenant-scoped knowledge and evidence storage with retention and access controls." },
  { id:"orchestration-review", domain:"ORCHESTRATION", name:"ELITZE Review Boundary", status:"PARTIAL", requirement:"Evidence-required review boundary for consequential security and intelligence conclusions." },
  { id:"endpoint", domain:"SECOPS", name:"ELITZE Endpoint Connect", status:"PLANNED", requirement:"Endpoint prevention, telemetry, detection and response integration." },
  { id:"xdr", domain:"SECOPS", name:"ELITZE Security Fabric", status:"PLANNED", requirement:"Correlate endpoint, identity, cloud, SaaS, network and AI signals." },
  { id:"siem", domain:"SECOPS", name:"ELITZE Security Data Plane", status:"PLANNED", requirement:"Open ingestion, normalization, detection, hunting and federated search." },
  { id:"soar", domain:"SECOPS", name:"ELITZE Response Orchestrator", status:"PLANNED", requirement:"Governed response playbooks with approval, rollback and verified outcomes." },
  { id:"threat-hunting", domain:"SECOPS", name:"ELITZE Threat Hunt", status:"PLANNED", requirement:"Hypothesis-driven hunting across normalized telemetry." },
  { id:"exposure", domain:"SECOPS", name:"ELITZE Exposure", status:"PARTIAL", requirement:"Prioritize exploitable attack paths and business impact." },
  { id:"cloud-security", domain:"CLOUD", name:"ELITZE Cloud Guard", status:"PLANNED", requirement:"Cloud posture, workload, entitlement, IaC, container and serverless protection." },
  { id:"saas-security", domain:"CLOUD", name:"ELITZE SaaS Guard", status:"PLANNED", requirement:"Discover SaaS, configuration drift and risky access." },
  { id:"identity-protection", domain:"IDENTITY", name:"ELITZE Identity Guard", status:"PLANNED", requirement:"Conditional access, risk, privilege and compromised identity response." },
  { id:"data-security", domain:"DATA", name:"ELITZE Data Guard", status:"PLANNED", requirement:"Discover, classify, govern and prevent sensitive data exposure." },
  { id:"insider-risk", domain:"DATA", name:"ELITZE Insider Risk", status:"PLANNED", requirement:"Behavioral investigation with privacy-aware governance." },
  { id:"email-security", domain:"SECOPS", name:"ELITZE Email Guard", status:"PLANNED", requirement:"Phishing, business-email compromise and malicious AI-instruction ingress protection." },
  { id:"network-security", domain:"NETWORK", name:"ELITZE Network Guard", status:"PLANNED", requirement:"Network policy, secure access and web-control integration." },
  { id:"api-security", domain:"NETWORK", name:"ELITZE API Guard", status:"PARTIAL", requirement:"OpenAPI, runtime discovery, inventory, authorization and logic-abuse protection." },
  { id:"reo", domain:"REO", name:"ELITZE REO", status:"PARTIAL", requirement:"Provenance, evidence, uniqueness, risk and publishing governance." },
  { id:"reo-search-connectors", domain:"REO", name:"ELITZE Search Connect", status:"PLANNED", requirement:"Tenant-authorized search and analytics sources with explicit data-availability states." },
];

export function capabilitySummary() {
  return ELITZE_CAPABILITY_REGISTRY.reduce<Record<CapabilityStatus, number>>((acc, item) => {
    acc[item.status] += 1;
    return acc;
  }, { IMPLEMENTED: 0, PARTIAL: 0, PLANNED: 0, BLOCKED: 0 });
}
