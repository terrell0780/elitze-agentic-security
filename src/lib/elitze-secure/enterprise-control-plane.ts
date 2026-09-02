export type SecurityDomain =
  | "AI" | "ENDPOINT" | "IDENTITY" | "CLOUD" | "SAAS" | "NETWORK"
  | "DATA" | "EMAIL" | "APPLICATION" | "EXPOSURE" | "THREAT_INTEL" | "SECOPS" | "GRC";

export type EnforcementMode = "OBSERVE" | "ADVISE" | "REQUIRE_APPROVAL" | "BLOCK";

export type SecurityControl = {
  id: string;
  domain: SecurityDomain;
  name: string;
  description: string;
  enforcement: EnforcementMode[];
  evidenceRequired: boolean;
};

export const ELITZE_ENTERPRISE_CONTROLS: SecurityControl[] = [
  { id:"ai.gateway", domain:"AI", name:"Unified AI Gateway", description:"Inline LLM, MCP, A2A, API, browser-agent and SaaS-agent control.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"ai.runtime", domain:"AI", name:"AI Runtime Security", description:"Inspect prompts, responses, tool calls and agent actions at runtime.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"ai.shadow", domain:"AI", name:"Shadow AI Discovery", description:"Inventory unmanaged AI applications, agents, models and workloads.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"ai.posture", domain:"AI", name:"AI Security Posture", description:"Assess configuration, access, model, agent and integration exposure.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL"], evidenceRequired:true },
  { id:"ai.supply-chain", domain:"AI", name:"AI Supply Chain", description:"Track model, package, dataset, skill and artifact provenance and risk.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"identity.nhi", domain:"IDENTITY", name:"Non-Human Identity Security", description:"Govern service, workload, OAuth and AI-agent identities.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"identity.jit", domain:"IDENTITY", name:"Just-in-Time Privilege", description:"Replace standing privilege with time- and risk-bound authorization.", enforcement:["REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"endpoint.edr", domain:"ENDPOINT", name:"Endpoint Detection and Response", description:"Endpoint telemetry, prevention, investigation and response integration point.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"secops.xdr", domain:"SECOPS", name:"Cross-Domain XDR", description:"Correlate endpoint, identity, cloud, SaaS, network and AI signals.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL"], evidenceRequired:true },
  { id:"secops.siem", domain:"SECOPS", name:"Next-Gen SIEM", description:"Normalize, correlate, retain and search security telemetry.", enforcement:["OBSERVE","ADVISE"], evidenceRequired:true },
  { id:"secops.siem-data", domain:"SECOPS", name:"Security Data Pipeline", description:"Filter, enrich and route security data before downstream analytics.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"secops.soa", domain:"SECOPS", name:"SOAR and Governed Response", description:"Execute approved playbooks with evidence, approval and rollback boundaries.", enforcement:["REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"secops.hunt", domain:"SECOPS", name:"Threat Hunting", description:"Run hypothesis-driven searches across normalized security data.", enforcement:["OBSERVE","ADVISE"], evidenceRequired:true },
  { id:"exposure.attack-path", domain:"EXPOSURE", name:"Attack Path Analysis", description:"Connect exploitable assets, identities, agents, data and business impact.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL"], evidenceRequired:true },
  { id:"cloud.cnapp", domain:"CLOUD", name:"Cloud Application Protection", description:"CSPM, workload/runtime, entitlement and application-security control contracts.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"saas.posture", domain:"SAAS", name:"SaaS Security Posture", description:"Inventory SaaS services, risky permissions and configuration drift.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"data.dspm", domain:"DATA", name:"Data Security Posture", description:"Discover, classify and map sensitive data exposure and access paths.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"data.dlp", domain:"DATA", name:"Data Loss Prevention", description:"Apply data handling policies to AI and enterprise interactions.", enforcement:["OBSERVE","REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"network.sase", domain:"NETWORK", name:"Network/SASE Control", description:"Network policy, secure access and web-control integration point.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"network.api", domain:"NETWORK", name:"API Security", description:"Discover APIs, validate specifications and detect runtime abuse.", enforcement:["OBSERVE","ADVISE","REQUIRE_APPROVAL","BLOCK"], evidenceRequired:true },
  { id:"email.security", domain:"EMAIL", name:"Email and Collaboration Security", description:"Phishing, malicious content and AI-instruction ingress controls.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"app.supply-chain", domain:"APPLICATION", name:"Application Supply Chain", description:"Track SBOM components, provenance and vulnerability relationships.", enforcement:["OBSERVE","ADVISE","BLOCK"], evidenceRequired:true },
  { id:"grc.evidence", domain:"GRC", name:"Compliance Evidence", description:"Map verified security evidence to control requirements and audit history.", enforcement:["OBSERVE","ADVISE"], evidenceRequired:true },
];

export function controlsForDomain(domain: SecurityDomain) {
  return ELITZE_ENTERPRISE_CONTROLS.filter((control) => control.domain === domain);
}
