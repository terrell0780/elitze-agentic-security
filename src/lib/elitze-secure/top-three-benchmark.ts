export type BenchmarkStatus = "PRESENT" | "FOUNDATION" | "INTEGRATION_REQUIRED";

export type BenchmarkCapability = {
  id: string;
  capability: string;
  domain: string;
  status: BenchmarkStatus;
  ELITZEControl: string;
};

/**
 * Benchmark of capability classes publicly documented by leading enterprise
 * security platforms. This is a capability checklist, not a claim of parity
 * with any vendor's implementation, telemetry volume, efficacy or certifications.
 */
export const TOP_THREE_ENTERPRISE_SECURITY_BENCHMARK: BenchmarkCapability[] = [
  { id:"unified-siem", capability:"Unified SIEM / security data lake", domain:"SECOPS", status:"FOUNDATION", ELITZEControl:"Normalized security telemetry and common evidence model" },
  { id:"xdr", capability:"XDR correlation", domain:"SECOPS", status:"FOUNDATION", ELITZEControl:"Cross-domain event normalization and correlation" },
  { id:"edr", capability:"Endpoint detection and response", domain:"ENDPOINT", status:"INTEGRATION_REQUIRED", ELITZEControl:"Endpoint telemetry contract and response action model" },
  { id:"ndr", capability:"Network detection and response", domain:"NETWORK", status:"FOUNDATION", ELITZEControl:"Network event schema and policy boundary" },
  { id:"soar", capability:"SOAR / automated response", domain:"SECOPS", status:"FOUNDATION", ELITZEControl:"Approval-gated playbooks, actions and rollback" },
  { id:"tip", capability:"Threat intelligence platform", domain:"SECOPS", status:"FOUNDATION", ELITZEControl:"Threat indicators, enrichment and evidence linkage" },
  { id:"asm", capability:"Attack surface management", domain:"EXPOSURE", status:"FOUNDATION", ELITZEControl:"Asset inventory, exposure and attack-path model" },
  { id:"itdr", capability:"Identity threat detection and response", domain:"IDENTITY", status:"FOUNDATION", ELITZEControl:"Identity risk and continuous authorization" },
  { id:"ueba", capability:"UEBA / behavioral analytics", domain:"SECOPS", status:"FOUNDATION", ELITZEControl:"Behavioral event inputs and risk scoring contract" },
  { id:"cloud", capability:"CNAPP / cloud posture and runtime", domain:"CLOUD", status:"FOUNDATION", ELITZEControl:"Cloud resource, posture and runtime schema" },
  { id:"data", capability:"DSPM / DLP / data detection and response", domain:"DATA", status:"FOUNDATION", ELITZEControl:"Data asset classification and exposure model" },
  { id:"email", capability:"Email and collaboration security", domain:"EMAIL", status:"FOUNDATION", ELITZEControl:"Email threat event and AI-instruction risk model" },
  { id:"appsec", capability:"Application / API / software supply-chain security", domain:"APPLICATION", status:"FOUNDATION", ELITZEControl:"API, component, provenance and vulnerability model" },
  { id:"ai-agent", capability:"AI agent discovery, governance and runtime security", domain:"AI_SECURITY", status:"FOUNDATION", ELITZEControl:"ELITZE AI Security Gateway + agent identity" },
  { id:"continuous-identity", capability:"Continuous risk-aware agent authorization", domain:"IDENTITY", status:"FOUNDATION", ELITZEControl:"Per-action authorization with owner/device/risk context" },
  { id:"agentic-response", capability:"Agentic SOC assistance", domain:"AI_SECURITY", status:"FOUNDATION", ELITZEControl:"Governed AI actions constrained by ELITZE policy" },
  { id:"automatic-disruption", capability:"Automated attack disruption / containment", domain:"SECOPS", status:"FOUNDATION", ELITZEControl:"Isolate, revoke, block, disable, quarantine, rollback" },
  { id:"multitenant", capability:"Multitenant governance and RBAC", domain:"GOVERNANCE", status:"FOUNDATION", ELITZEControl:"Tenant-scoped identities, policies, evidence and actions" },
];
