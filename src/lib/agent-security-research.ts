export type ResearchTrackStatus = "planned" | "active" | "published" | "retired";

export type ResearchTrack = {
  id: string;
  title: string;
  threatClass: string;
  objective: string;
  requiredEvidence: string[];
  outputs: Array<"reproducible-test" | "advisory" | "detection" | "policy" | "scanner" | "cve" | "vendor-coordination">;
  status: ResearchTrackStatus;
};

/** ELITZE-owned research program registry. A registry entry is not evidence that research has been completed. */
export const agentSecurityResearch: ResearchTrack[] = [
  { id: "mcp-tool-poisoning", title: "MCP Tool Poisoning", threatClass: "MCP", objective: "Measure whether manipulated tool metadata can alter agent behavior, authorization, or side effects.", requiredEvidence: ["controlled MCP server", "immutable fixture", "request/decision/execution evidence"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner", "cve", "vendor-coordination"], status: "planned" },
  { id: "prompt-to-tool-privilege-escalation", title: "Prompt-to-Tool Privilege Escalation", threatClass: "Agent Identity", objective: "Detect escalation from prompt content into tool capabilities not granted to the executing identity.", requiredEvidence: ["agent identity", "prompt provenance", "tool authorization", "runtime decision"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner"], status: "planned" },
  { id: "confused-deputy", title: "Confused-Deputy Agent Execution", threatClass: "Authorization", objective: "Detect delegated authority used outside the intended principal or purpose.", requiredEvidence: ["delegation chain", "principal identity", "action intent", "decision evidence"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner", "vendor-coordination"], status: "planned" },
  { id: "cross-agent-delegation", title: "Cross-Agent Delegation Abuse", threatClass: "Delegation", objective: "Measure unsafe lateral delegation between agents, MCP clients, services, and identities.", requiredEvidence: ["delegation edge", "source/target identities", "scope constraints", "runtime action"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner"], status: "planned" },
  { id: "credential-context-exposure", title: "Credential Exposure Through Tool Context", threatClass: "Secrets", objective: "Detect credential exposure across prompts, tool arguments, outputs, traces, and evidence.", requiredEvidence: ["credential classification", "tool-context record", "redaction decision", "evidence hash"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner"], status: "planned" },
  { id: "excessive-agent-permissions", title: "Excessive Agent Permissions", threatClass: "Least Privilege", objective: "Identify agent capabilities that exceed approved scope or observed task requirements.", requiredEvidence: ["identity inventory", "capability set", "observed usage", "policy scope"], outputs: ["reproducible-test", "advisory", "detection", "policy"], status: "planned" },
  { id: "tool-description-manipulation", title: "Malicious Tool-Description Manipulation", threatClass: "MCP", objective: "Detect security-relevant behavior changes caused by manipulated tool descriptions.", requiredEvidence: ["tool metadata versions", "content hashes", "policy evaluation", "runtime outcome"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner", "vendor-coordination"], status: "planned" },
  { id: "approval-bypass", title: "Approval Bypass", threatClass: "Governance", objective: "Detect execution when human approval was required but valid approval evidence is absent.", requiredEvidence: ["approval authority", "required approval", "decision record", "execution record"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner"], status: "planned" },
  { id: "indirect-prompt-injection-side-effect", title: "Indirect Prompt Injection to Side Effect", threatClass: "Prompt Injection", objective: "Detect untrusted content causing privileged actions outside the authorized task boundary.", requiredEvidence: ["untrusted source", "prompt provenance", "tool action", "authorization decision", "result"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner", "cve", "vendor-coordination"], status: "planned" },
  { id: "evidence-tampering", title: "Evidence Tampering", threatClass: "Evidence Integrity", objective: "Detect modification, replay, truncation, or provenance breaks in evidence and decision records.", requiredEvidence: ["content hash", "append-only linkage", "source provenance", "verification result"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner"], status: "planned" },
  { id: "unsafe-agent-memory", title: "Unsafe Agent Memory", threatClass: "Memory", objective: "Detect persistence of untrusted instructions, secrets, or authorization context into later agent actions.", requiredEvidence: ["memory record", "source provenance", "retention scope", "subsequent action"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner"], status: "planned" },
  { id: "cross-tenant-tool-access", title: "Cross-Tenant Tool Access", threatClass: "Tenant Boundary", objective: "Detect attempted or observed tool/resource access across tenant authorization boundaries.", requiredEvidence: ["tenant IDs", "identity", "resource mapping", "authorization decision", "execution outcome"], outputs: ["reproducible-test", "advisory", "detection", "policy", "scanner", "cve", "vendor-coordination"], status: "planned" },
];

export const researchProgramTargets = {
  yearOneAdvisories: 20,
  detectionAndPolicyRules: { minimum: 50, target: 100 },
  coordinatedVendorDisclosures: 5,
  annualAgentSecurityReport: 1,
} as const;

export function getResearchTrack(id: string) {
  return agentSecurityResearch.find((track) => track.id === id) ?? null;
}
