export type SecuritySkill = {
  id: string;
  name: string;
  domain: string;
  description: string;
  prerequisites: string[];
  authorization: "observe" | "assess" | "execute";
  verification: string[];
  evidence: string[];
  frameworks: string[];
  status: "cataloged" | "dependent";
};

/** ELITZE-owned skill metadata. Third-party skill implementations are not copied here. */
export const securitySkills: SecuritySkill[] = [
  { id: "agent-boundary-review", name: "Agent Boundary Review", domain: "AI Security", description: "Assess agent identity, purpose, tool scope, autonomy and boundary violations.", prerequisites: ["agent inventory", "authorized tenant scope"], authorization: "assess", verification: ["policy decision", "evidence linkage"], evidence: ["agent metadata", "decision record", "audit event"], frameworks: ["MITRE ATLAS", "NIST AI RMF"], status: "dependent" },
  { id: "mcp-tool-governance", name: "MCP Tool Governance", domain: "AI Security", description: "Evaluate MCP tools and actions against approved capability and policy boundaries.", prerequisites: ["MCP inventory", "policy set"], authorization: "execute", verification: ["allow/deny decision", "action evidence"], evidence: ["tool metadata", "decision record", "execution record"], frameworks: ["MITRE ATLAS", "NIST AI RMF"], status: "dependent" },
  { id: "api-security-assessment", name: "API Security Assessment", domain: "Application Security", description: "Assess API exposure, authorization boundaries and high-risk request paths.", prerequisites: ["authorized API scope"], authorization: "assess", verification: ["finding retest", "closure evidence"], evidence: ["request metadata", "finding", "retest result"], frameworks: ["OWASP API Security"], status: "dependent" },
  { id: "vulnerability-triage", name: "Vulnerability Triage", domain: "Vulnerability Operations", description: "Prioritize vulnerabilities using severity, exploitability, exposure, reachability and business criticality.", prerequisites: ["vulnerability inventory"], authorization: "assess", verification: ["priority rationale", "remediation state"], evidence: ["finding", "score inputs", "decision"], frameworks: ["NIST CSF", "CISA KEV"], status: "dependent" },
  { id: "attack-path-validation", name: "Attack Path Validation", domain: "Exposure", description: "Validate whether a modeled attack path is reachable and materially exploitable.", prerequisites: ["attack graph", "authorized scope"], authorization: "assess", verification: ["reachable state", "retest evidence"], evidence: ["path nodes", "reachability evidence", "retest"], frameworks: ["MITRE ATT&CK", "MITRE D3FEND"], status: "dependent" },
  { id: "red-team-release-test", name: "Release Red-Team Test", domain: "Security Validation", description: "Run an authorized adversarial test against a release and preserve evidence for remediation verification.", prerequisites: ["release identifier", "authorized target"], authorization: "execute", verification: ["test completion", "finding retest"], evidence: ["campaign metadata", "findings", "completion state"], frameworks: ["MITRE ATT&CK", "MITRE ATLAS"], status: "dependent" },
  { id: "evidence-integrity-review", name: "Evidence Integrity Review", domain: "REO", description: "Validate evidence provenance, integrity and linkage from security decision to observed outcome.", prerequisites: ["evidence records"], authorization: "observe", verification: ["content hash", "audit linkage"], evidence: ["evidence record", "hash", "audit event"], frameworks: ["NIST CSF", "NIST AI RMF"], status: "dependent" },
];

export function getSecuritySkill(id: string) {
  return securitySkills.find((skill) => skill.id === id) ?? null;
}
