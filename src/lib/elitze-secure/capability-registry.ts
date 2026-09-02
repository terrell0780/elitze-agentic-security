export type CapabilityStatus = "IMPLEMENTED" | "PARTIAL" | "PLANNED" | "BLOCKED";

export type Capability = {
  id: string;
  domain: "AI_SECURITY" | "SECOPS" | "IDENTITY" | "CLOUD" | "DATA" | "NETWORK" | "REO";
  name: string;
  status: CapabilityStatus;
  requirement: string;
};

export const ELITZE_CAPABILITY_REGISTRY: Capability[] = [
  { id:"ai-gateway", domain:"AI_SECURITY", name:"Unified AI Gateway", status:"PARTIAL", requirement:"Inline LLM, MCP, A2A, API, browser and SaaS control point." },
  { id:"ai-runtime", domain:"AI_SECURITY", name:"AI Runtime Security", status:"PARTIAL", requirement:"Inline prompt, response, tool and action inspection." },
  { id:"ai-discovery", domain:"AI_SECURITY", name:"AI Discovery and Shadow AI", status:"PARTIAL", requirement:"Discover managed and unmanaged AI apps, agents, models and services." },
  { id:"agent-identity", domain:"IDENTITY", name:"Continuous Agent Identity", status:"PARTIAL", requirement:"Risk-aware authorization for every agent action." },
  { id:"ai-posture", domain:"AI_SECURITY", name:"AI Security Posture Management", status:"PLANNED", requirement:"Configuration, access and exposure posture across AI services and models." },
  { id:"model-security", domain:"AI_SECURITY", name:"AI Model and Artifact Security", status:"PLANNED", requirement:"Model integrity, backdoor, deserialization and artifact scanning." },
  { id:"ai-supply-chain", domain:"AI_SECURITY", name:"AI Supply Chain Security", status:"PLANNED", requirement:"Packages, dependencies, skills, datasets and provenance." },
  { id:"endpoint", domain:"SECOPS", name:"Endpoint Security and EDR", status:"PLANNED", requirement:"Endpoint prevention, telemetry, detection and response." },
  { id:"xdr", domain:"SECOPS", name:"Cross-Domain XDR", status:"PLANNED", requirement:"Correlate endpoint, identity, cloud, SaaS, network and AI signals." },
  { id:"siem", domain:"SECOPS", name:"Next-Gen SIEM and Security Data Lake", status:"PLANNED", requirement:"Open ingestion, normalization, detection, hunting and federated search." },
  { id:"soar", domain:"SECOPS", name:"SOAR and Agentic Response", status:"PLANNED", requirement:"Governed orchestration with approval and rollback." },
  { id:"threat-hunting", domain:"SECOPS", name:"Threat Hunting", status:"PLANNED", requirement:"Hypothesis-driven hunting across unified telemetry." },
  { id:"exposure", domain:"SECOPS", name:"Exposure Management", status:"PARTIAL", requirement:"Prioritize exploitable attack paths and business impact." },
  { id:"cloud-security", domain:"CLOUD", name:"CNAPP", status:"PLANNED", requirement:"CSPM, CWPP, CIEM, IaC, container and serverless protection." },
  { id:"saas-security", domain:"CLOUD", name:"SaaS Security Posture", status:"PLANNED", requirement:"Discover SaaS, configuration drift and risky access." },
  { id:"identity-protection", domain:"IDENTITY", name:"Identity Threat Detection and Response", status:"PLANNED", requirement:"Conditional access, risk, privilege and compromised identity response." },
  { id:"data-security", domain:"DATA", name:"DSPM and DLP", status:"PLANNED", requirement:"Discover, classify, govern and prevent sensitive data exposure." },
  { id:"insider-risk", domain:"DATA", name:"Insider Risk", status:"PLANNED", requirement:"Behavioral investigation with privacy-aware governance." },
  { id:"email-security", domain:"SECOPS", name:"Email and Collaboration Security", status:"PLANNED", requirement:"Phishing, BEC and malicious AI instruction protection." },
  { id:"network-security", domain:"NETWORK", name:"Network and SASE Security", status:"PLANNED", requirement:"NGFW, ZTNA, SWG and cloud-delivered enforcement." },
  { id:"api-security", domain:"NETWORK", name:"API Security", status:"PARTIAL", requirement:"OpenAPI, runtime discovery, inventory and logic-abuse protection." },
  { id:"reo", domain:"REO", name:"Content Integrity Engine", status:"PARTIAL", requirement:"Provenance, evidence, uniqueness, risk and publishing governance." },
];

export function capabilitySummary() {
  return ELITZE_CAPABILITY_REGISTRY.reduce<Record<CapabilityStatus, number>>((acc, item) => {
    acc[item.status] += 1;
    return acc;
  }, { IMPLEMENTED: 0, PARTIAL: 0, PLANNED: 0, BLOCKED: 0 });
}
