/**
 * ELITZE-owned security skill registry.
 *
 * Every skill is a capability the platform (and Sara) can perform or reason about.
 * External standards (MITRE ATT&CK, OWASP, NIST, CIS, FIRST) are reference
 * mappings only — they are not branding, ownership claims, or execution authority.
 *
 * Domain coverage required by the product:
 * Offensive (authorized), Defensive / SOC, Forensics & IR, Cloud / Identity /
 * Supply chain, AI & agentic security, Compliance & assurance.
 */

export type SkillAuthorization = "read" | "assess" | "execute";
export type SkillStatus = "cataloged" | "dependent";

export type SecuritySkill = {
  id: string;
  name: string;
  domain: SkillDomain;
  description: string;
  prerequisites: string[];
  authorization: SkillAuthorization;
  verification: string[];
  evidence: string[];
  frameworkMappings: string[];
  status: SkillStatus;
};

export type SkillDomain =
  | "Offensive / Authorized Testing"
  | "Defensive Operations"
  | "Forensics & Incident Response"
  | "Cloud, Identity & Supply Chain"
  | "AI & Agentic Security"
  | "Compliance & Assurance"
  | "Vulnerability Operations"
  | "Exposure Management"
  | "Application Security"
  | "Security Validation"
  | "REO";

export const SKILL_DOMAINS: SkillDomain[] = [
  "Offensive / Authorized Testing",
  "Defensive Operations",
  "Forensics & Incident Response",
  "Cloud, Identity & Supply Chain",
  "AI & Agentic Security",
  "Compliance & Assurance",
  "Vulnerability Operations",
  "Exposure Management",
  "Application Security",
  "Security Validation",
  "REO",
];

/** Skills the platform may execute on a target without additional operator approval. */
const EXECUTE_SKILLS = new Set<SkillAuthorization>(["execute"]);

export const securitySkills: SecuritySkill[] = [
  // ── Offensive / Authorized Testing ────────────────────────────────────────
  {
    id: "authorized-pentest-scope-review",
    name: "Authorized Pentest Scope Review",
    domain: "Offensive / Authorized Testing",
    description:
      "Read a written authorization, rules of engagement and target list, then state what is in scope, what is out of scope, and what must stop.",
    prerequisites: ["written authorization", "target inventory", "ROE expiry"],
    authorization: "read",
    verification: ["scope matrix", "ROE expiry check", "out-of-scope list"],
    evidence: ["authorization record", "ROE", "target list hash", "scope decision"],
    frameworkMappings: [
      "OWASP WSTG v4.2",
      "PTES",
      "NIST SP 800-115",
      "CIS Controls v8.1 (18.2)",
    ],
    status: "cataloged",
  },
  {
    id: "web-app-assessment",
    name: "Web Application Assessment",
    domain: "Offensive / Authorized Testing",
    description:
      "Methodology-level assessment of an authorized web target against OWASP Top 10 (2021) and WSTG: reconnaissance, authentication, session, authorization, injection classes, business logic.",
    prerequisites: ["authorized target", "ROE", "web app inventory"],
    authorization: "execute",
    verification: ["finding retest", "request/replay evidence", "closure"],
    evidence: ["finding", "HTTP exchange metadata", "retest record"],
    frameworkMappings: [
      "OWASP Top 10 2021",
      "OWASP WSTG v4.2",
      "OWASP ASVS 4.0.3",
      "CWE Top 25",
      "MITRE ATT&CK Enterprise (TA0001, TA0006)",
    ],
    status: "dependent",
  },
  {
    id: "api-security-assessment",
    name: "API Security Assessment",
    domain: "Offensive / Authorized Testing",
    description:
      "Assess API exposure, object-level authorization, authentication, excessive data exposure and unrestricted resource consumption on in-scope APIs.",
    prerequisites: ["authorized API scope", "OpenAPI inventory"],
    authorization: "execute",
    verification: ["finding retest", "closure evidence"],
    evidence: ["request metadata", "finding", "retest result"],
    frameworkMappings: [
      "OWASP API Security Top 10 2023",
      "OWASP WSTG v4.2 (API Testing)",
      "MITRE ATT&CK Enterprise (TA0006, TA0008)",
    ],
    status: "dependent",
  },
  {
    id: "mobile-app-assessment",
    name: "Mobile Application Assessment",
    domain: "Offensive / Authorized Testing",
    description:
      "Static and runtime review of an authorized mobile build: data storage, IPC, certificate handling, platform controls, hardcoded secrets.",
    prerequisites: ["authorized build", "ROE"],
    authorization: "execute",
    verification: ["finding retest", "build hash match"],
    evidence: ["build hash", "finding", "retest record"],
    frameworkMappings: [
      "OWASP MASVS 2.0",
      "OWASP MASTG",
      "OWASP Top 10 2021",
      "MITRE ATT&CK Mobile",
    ],
    status: "dependent",
  },
  {
    id: "adversary-emulation-campaign",
    name: "Adversary Emulation Campaign",
    domain: "Offensive / Authorized Testing",
    description:
      "Emulate a documented adversary technique set against an authorized target and preserve telemetry so blue-team detections can be validated.",
    prerequisites: ["written authorization", "emulation profile", "detection baseline"],
    authorization: "execute",
    verification: ["technique coverage", "telemetry captured", "detection verdict"],
    evidence: ["campaign record", "technique log", "telemetry", "detection result"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15",
      "MITRE ATT&CK Evaluations",
      "CTID Adversary Emulation Library",
      "D3FEND",
    ],
    status: "dependent",
  },
  {
    id: "red-team-release-test",
    name: "Release Red-Team Test",
    domain: "Offensive / Authorized Testing",
    description:
      "Authorized adversarial test against a release, scoped to pre-production or a nominated environment, with evidence retained for remediation verification.",
    prerequisites: ["release identifier", "authorized target", "ROE"],
    authorization: "execute",
    verification: ["test completion", "finding retest"],
    evidence: ["campaign metadata", "findings", "completion state"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15",
      "OWASP WSTG v4.2",
      "ATLAS",
    ],
    status: "dependent",
  },

  // ── Defensive Operations ──────────────────────────────────────────────────
  {
    id: "detection-engineering",
    name: "Detection Engineering",
    domain: "Defensive Operations",
    description:
      "Design, document and tune detections from telemetry to Sigma-class logic, with an explicit false-positive budget and a purple-team validation loop.",
    prerequisites: ["telemetry inventory", "ATT&CK coverage map"],
    authorization: "execute",
    verification: ["detection unit test", "tuning record", "replay verdict"],
    evidence: ["detection record", "test replay", "tuning history"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15",
      "MITRE D3FEND",
      "SigmaHQ",
      "NIST CSF 2.0 (DE)",
    ],
    status: "dependent",
  },
  {
    id: "alert-triage",
    name: "Alert Triage",
    domain: "Defensive Operations",
    description:
      "Triage a queued alert into a case: identity, source, blast radius, first action, and whether the next step is contain, watch or close.",
    prerequisites: ["alert feed", "asset inventory", "identity context"],
    authorization: "execute",
    verification: ["triage decision", "case linkage"],
    evidence: ["alert record", "triage decision", "case"],
    frameworkMappings: [
      "NIST SP 800-61r3",
      "NIST CSF 2.0 (RS)",
      "MITRE ATT&CK Enterprise v15",
    ],
    status: "dependent",
  },
  {
    id: "threat-hunt",
    name: "Threat Hunt",
    domain: "Defensive Operations",
    description:
      "Hypothesis-driven hunt over tenant telemetry, with a documented hunt question, query window, result and whether the hunt matured into a detection.",
    prerequisites: ["telemetry query path", "ATT&CK hypothesis", "time window"],
    authorization: "execute",
    verification: ["hunt record", "detection promotion", "negative result"],
    evidence: ["hunt record", "query", "result set hash"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15",
      "NIST CSF 2.0 (DE)",
      "PEAK / TaHiTI hunting frameworks",
    ],
    status: "dependent",
  },
  {
    id: "identity-threat-response",
    name: "Identity Threat Response",
    domain: "Defensive Operations",
    description:
      "Investigate impossible travel, MFA fatigue, token replay and non-human identity anomalies; decide contain, revoke or monitor.",
    prerequisites: ["identity provider logs", "session inventory"],
    authorization: "execute",
    verification: ["containment state", "revocation record"],
    evidence: ["sign-in evidence", "decision", "revocation record"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15 (TA0006)",
      "NIST SP 800-63B",
      "NIST CSF 2.0 (RS)",
    ],
    status: "dependent",
  },
  {
    id: "detection-coverage-review",
    name: "Detection Coverage Review",
    domain: "Defensive Operations",
    description:
      "Score ATT&CK technique coverage against deployed telemetry and detections, then produce a prioritised backlog of gaps.",
    prerequisites: ["detection inventory", "telemetry inventory"],
    authorization: "assess",
    verification: ["coverage matrix", "gap backlog"],
    evidence: ["coverage matrix", "backlog"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15",
      "DeTT&CT",
      "MITRE D3FEND",
      "NIST CSF 2.0 (DE)",
    ],
    status: "cataloged",
  },

  // ── Forensics & Incident Response ─────────────────────────────────────────
  {
    id: "incident-handling",
    name: "Incident Handling",
    domain: "Forensics & Incident Response",
    description:
      "Run the NIST SP 800-61r3 lifecycle on a declared incident: preparation, detection, analysis, containment, eradication, recovery, post-incident.",
    prerequisites: ["declared incident", "on-call authority", "evidence path"],
    authorization: "execute",
    verification: ["phase record", "containment decision", "post-incident review"],
    evidence: ["incident record", "timeline", "decision log"],
    frameworkMappings: [
      "NIST SP 800-61r3",
      "NIST CSF 2.0 (RS, RC)",
      "MITRE ATT&CK Enterprise v15",
    ],
    status: "dependent",
  },
  {
    id: "disk-forensics",
    name: "Disk Forensics",
    domain: "Forensics & Incident Response",
    description:
      "Acquire and analyse disk artefacts (MFT, USN journal, registry, prefetch, shimcache, SRUM) and build a defensible timeline.",
    prerequisites: ["acquired image", "chain of custody", "analysis workstation"],
    authorization: "execute",
    verification: ["hash match", "timeline", "artefact cross-check"],
    evidence: ["image hash", "timeline", "artefact export"],
    frameworkMappings: [
      "NIST SP 800-86",
      "NIST CSF 2.0 (RS.AN)",
      "RFC 3227",
    ],
    status: "dependent",
  },
  {
    id: "memory-forensics",
    name: "Memory Forensics",
    domain: "Forensics & Incident Response",
    description:
      "Analyse a memory image for process injection indicators, handle tables, network artefacts and rogue processes; state confidence and what memory cannot prove.",
    prerequisites: ["memory image", "host profile", "chain of custody"],
    authorization: "execute",
    verification: ["plugin output", "cross-host corroboration"],
    evidence: ["image hash", "plugin output", "finding"],
    frameworkMappings: [
      "NIST SP 800-86",
      "Volatility 3",
      "MITRE ATT&CK Enterprise v15 (TA0005)",
    ],
    status: "dependent",
  },
  {
    id: "network-forensics",
    name: "Network Forensics",
    domain: "Forensics & Incident Response",
    description:
      "Reconstruct a session from Zeek/Suricata/pcap: who talked to what, when, with what TLS fingerprint, and what the logs cannot prove.",
    prerequisites: ["pcap or Zeek logs", "sensor map", "time sync"],
    authorization: "execute",
    verification: ["session reconstruction", "sensor corroboration"],
    evidence: ["pcap/Zeek extract", "session record"],
    frameworkMappings: [
      "NIST SP 800-86",
      "Zeek",
      "MITRE ATT&CK Enterprise v15 (TA0011)",
    ],
    status: "dependent",
  },
  {
    id: "cloud-forensics",
    name: "Cloud Forensics",
    domain: "Forensics & Incident Response",
    description:
      "Timeline a cloud incident from audit logs (CloudTrail, Entra, GCP Audit) with identity, source IP, user-agent and resource changes.",
    prerequisites: ["audit log export", "identity map", "retention window"],
    authorization: "execute",
    verification: ["event timeline", "identity attribution"],
    evidence: ["log export hash", "timeline", "identity map"],
    frameworkMappings: [
      "NIST SP 800-86",
      "NIST SP 800-190",
      "MITRE ATT&CK Cloud",
    ],
    status: "dependent",
  },
  {
    id: "malware-triage",
    name: "Malware Triage",
    domain: "Forensics & Incident Response",
    description:
      "Safely triage a suspected malicious sample in an isolated environment: family classification, capabilities, IOCs, and recommended containment. No malware authoring.",
    prerequisites: ["isolated analysis host", "sample in evidence container"],
    authorization: "execute",
    verification: ["isolation check", "IOC list", "containment recommendation"],
    evidence: ["sample hash", "triage report", "IOC set"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15",
      "NIST SP 800-83",
      "VirusTotal / MISP sharing practices",
    ],
    status: "dependent",
  },
  {
    id: "evidence-integrity-review",
    name: "Evidence Integrity Review",
    domain: "Forensics & Incident Response",
    description:
      "Validate evidence provenance, integrity and linkage from security decision to observed outcome.",
    prerequisites: ["evidence records"],
    authorization: "assess",
    verification: ["content hash", "audit linkage"],
    evidence: ["evidence record", "hash", "audit event"],
    frameworkMappings: [
      "NIST CSF 2.0",
      "NIST SP 800-86",
      "AI RMF",
    ],
    status: "cataloged",
  },

  // ── Cloud, Identity & Supply Chain ────────────────────────────────────────
  {
    id: "cloud-posture-review",
    name: "Cloud Posture Review",
    domain: "Cloud, Identity & Supply Chain",
    description:
      "Review an authorized cloud account against CIS Foundations Benchmarks and organisation guardrails: public exposure, encryption, logging, network paths, privilege drift.",
    prerequisites: ["read-only cloud credentials", "account inventory"],
    authorization: "assess",
    verification: ["benchmark mapping", "remediation plan"],
    evidence: ["config snapshot", "benchmark result", "remediation ticket"],
    frameworkMappings: [
      "CIS AWS/Azure/GCP Foundations Benchmark",
      "NIST SP 800-53 Rev.5",
      "NIST CSF 2.0 (PR)",
      "MITRE ATT&CK Cloud",
    ],
    status: "cataloged",
  },
  {
    id: "kubernetes-hardening-review",
    name: "Kubernetes Hardening Review",
    domain: "Cloud, Identity & Supply Chain",
    description:
      "Review an authorized cluster against the NSA/CISA Kubernetes Hardening Guide and CIS Kubernetes Benchmark: RBAC, admission, PSP/PSS, network policy, secrets.",
    prerequisites: ["cluster kubeconfig (read)", "workload inventory"],
    authorization: "assess",
    verification: ["benchmark mapping", "remediation plan"],
    evidence: ["manifest snapshot", "benchmark result", "remediation ticket"],
    frameworkMappings: [
      "NSA/CISA Kubernetes Hardening Guide 1.0",
      "CIS Kubernetes Benchmark",
      "NIST SP 800-190",
      "Kubernetes Pod Security Standards",
    ],
    status: "cataloged",
  },
  {
    id: "identity-program-review",
    name: "Identity Program Review",
    domain: "Cloud, Identity & Supply Chain",
    description:
      "Review human and non-human identity: SSO, MFA coverage, privileged access, workload federation, standing privileges, joiner-mover-leaver.",
    prerequisites: ["IdP admin or read export", "app inventory"],
    authorization: "assess",
    verification: ["MFA coverage", "standing privilege list", "federation map"],
    evidence: ["IdP export", "gap list", "remediation ticket"],
    frameworkMappings: [
      "NIST SP 800-63B",
      "CIS Controls v8.1 (5, 6)",
      "NIST SP 800-53 Rev.5 (AC, IA)",
    ],
    status: "cataloged",
  },
  {
    id: "supply-chain-assurance",
    name: "Supply-Chain Assurance",
    domain: "Cloud, Identity & Supply Chain",
    description:
      "Review SBOM coverage, dependency policy, SLSA provenance level, artifact signing and CI gates; state what is evidenced versus declared.",
    prerequisites: ["CI access or SBOM export", "artifact registry"],
    authorization: "assess",
    verification: ["SBOM completeness", "provenance verification"],
    evidence: ["SBOM", "provenance record", "verification output"],
    frameworkMappings: [
      "SLSA v1.0",
      "NIST SP 800-218 SSDF",
      "SPDX 2.3 / CycloneDX 1.5",
      "in-toto",
    ],
    status: "cataloged",
  },
  {
    id: "container-image-review",
    name: "Container Image Review",
    domain: "Cloud, Identity & Supply Chain",
    description:
      "Review base image hygiene, digest pinning, vulnerability posture and runtime profile of an authorized image set.",
    prerequisites: ["image registry access", "Dockerfile inventory"],
    authorization: "assess",
    verification: ["image scan", "digest pin check"],
    evidence: ["scan report", "Dockerfile", "digest list"],
    frameworkMappings: [
      "NIST SP 800-190",
      "CIS Docker Benchmark",
      "NIST SP 800-218 SSDF",
    ],
    status: "cataloged",
  },

  // ── AI & Agentic Security ─────────────────────────────────────────────────
  {
    id: "agent-boundary-review",
    name: "Agent Boundary Review",
    domain: "AI & Agentic Security",
    description:
      "Assess agent identity, purpose, tool scope, autonomy and boundary violations. The model is not the security boundary.",
    prerequisites: ["agent inventory", "authorized tenant scope"],
    authorization: "assess",
    verification: ["policy decision", "evidence linkage"],
    evidence: ["agent metadata", "decision record", "audit event"],
    frameworkMappings: [
      "MITRE ATLAS",
      "NIST AI RMF 1.0",
      "NIST AI 600-1",
      "OWASP LLM Top 10 2025",
    ],
    status: "cataloged",
  },
  {
    id: "mcp-tool-governance",
    name: "MCP Tool Governance",
    domain: "AI & Agentic Security",
    description:
      "Evaluate MCP tools and actions against approved capability and policy boundaries before execution.",
    prerequisites: ["MCP inventory", "policy set"],
    authorization: "execute",
    verification: ["allow/deny decision", "action evidence"],
    evidence: ["tool metadata", "decision record", "execution record"],
    frameworkMappings: [
      "MITRE ATLAS",
      "OWASP Agentic Top 10",
      "NIST AI RMF 1.0",
      "Model Context Protocol spec",
    ],
    status: "dependent",
  },
  {
    id: "llm-application-assessment",
    name: "LLM Application Assessment",
    domain: "AI & Agentic Security",
    description:
      "Assess an authorized LLM application against the OWASP LLM Top 10: injection classes, data leakage, excessive agency, supply chain, unbounded consumption.",
    prerequisites: ["authorized app scope", "model/tool inventory"],
    authorization: "execute",
    verification: ["finding retest", "guardrail test record"],
    evidence: ["test record", "finding", "guardrail config"],
    frameworkMappings: [
      "OWASP Top 10 for LLM Applications 2025",
      "MITRE ATLAS",
      "NIST AI 600-1",
    ],
    status: "dependent",
  },
  {
    id: "ai-governance-review",
    name: "AI Governance Review",
    domain: "AI & Agentic Security",
    description:
      "Map an AI system to NIST AI RMF govern/map/measure/manage and produce the evidence an auditor will ask for.",
    prerequisites: ["system description", "owner, purpose, data map"],
    authorization: "assess",
    verification: ["RMF mapping", "evidence pack"],
    evidence: ["system card", "RMF worksheet", "evidence pack"],
    frameworkMappings: [
      "NIST AI RMF 1.0 (AI 100-1)",
      "NIST AI 600-1",
      "ISO/IEC 42001:2023",
    ],
    status: "cataloged",
  },

  // ── Compliance & Assurance ────────────────────────────────────────────────
  {
    id: "csf-profile-mapping",
    name: "CSF Profile Mapping",
    domain: "Compliance & Assurance",
    description:
      "Map tenant controls to NIST CSF 2.0 functions (Govern, Identify, Protect, Detect, Respond, Recover) and produce a current-state profile.",
    prerequisites: ["control inventory", "asset inventory"],
    authorization: "assess",
    verification: ["profile worksheet", "gap list"],
    evidence: ["CSF profile", "gap list"],
    frameworkMappings: [
      "NIST CSF 2.0",
      "NIST SP 800-53 Rev.5",
      "CIS Controls v8.1",
    ],
    status: "cataloged",
  },
  {
    id: "cis-controls-assessment",
    name: "CIS Controls Assessment",
    domain: "Compliance & Assurance",
    description:
      "Score an environment against CIS Controls v8.1 implementation groups and produce a prioritised remediation path for a small team.",
    prerequisites: ["asset inventory", "control evidence"],
    authorization: "assess",
    verification: ["control score", "prioritised plan"],
    evidence: ["scorecard", "evidence index"],
    frameworkMappings: [
      "CIS Controls v8.1",
      "CIS Benchmarks",
      "NIST CSF 2.0",
    ],
    status: "cataloged",
  },
  {
    id: "soc2-readiness",
    name: "SOC 2 Readiness",
    domain: "Compliance & Assurance",
    description:
      "Map Trust Services Criteria to current evidence, identify Type I gaps, and state clearly what is not held.",
    prerequisites: ["control inventory", "evidence store"],
    authorization: "assess",
    verification: ["TSC mapping", "gap register"],
    evidence: ["TSC mapping", "evidence index", "gap register"],
    frameworkMappings: [
      "AICPA TSC 2017 (SOC 2)",
      "NIST CSF 2.0",
      "ISO/IEC 27001:2022",
    ],
    status: "cataloged",
  },
  {
    id: "iso27001-annex-review",
    name: "ISO 27001 Annex A Review",
    domain: "Compliance & Assurance",
    description:
      "Review Annex A themes (organisational, people, physical, technological) and the ISMS documentation set for completeness.",
    prerequisites: ["ISMS docs", "scope statement"],
    authorization: "assess",
    verification: ["Annex A checklist", "doc completeness"],
    evidence: ["checklist", "ISMS index"],
    frameworkMappings: [
      "ISO/IEC 27001:2022",
      "ISO/IEC 27002:2022",
      "NIST CSF 2.0",
    ],
    status: "cataloged",
  },
  {
    id: "questionnaire-response",
    name: "Security Questionnaire Response",
    domain: "Compliance & Assurance",
    description:
      "Answer a buyer questionnaire (SIG / CAIQ / custom) with sourced evidence, and answer UNKNOWN where evidence is missing.",
    prerequisites: ["questionnaire", "evidence store"],
    authorization: "assess",
    verification: ["answer traceability", "UNKNOWN register"],
    evidence: ["answered questionnaire", "evidence links"],
    frameworkMappings: [
      "Cloud Security Alliance CAIQ v4",
      "Shared Assessments SIG",
      "NIST CSF 2.0",
    ],
    status: "cataloged",
  },
  {
    id: "dpa-subprocessor-review",
    name: "DPA & Subprocessor Review",
    domain: "Compliance & Assurance",
    description:
      "Review a DPA and subprocessor register for transfer, retention, security exhibit and breach-notification commitments that match operational reality.",
    prerequisites: ["DPA draft", "subprocessor register"],
    authorization: "assess",
    verification: ["commitment-to-operation check"],
    evidence: ["DPA redline", "subprocessor register"],
    frameworkMappings: [
      "GDPR Art. 28",
      "PIPEDA",
      "NIST CSF 2.0 (GV)",
    ],
    status: "cataloged",
  },

  // ── Vulnerability Operations / Exposure (existing domains, kept) ──────────
  {
    id: "vulnerability-triage",
    name: "Vulnerability Triage",
    domain: "Vulnerability Operations",
    description:
      "Prioritize vulnerabilities using severity, exploitability, exposure, reachability and business criticality.",
    prerequisites: ["vulnerability inventory"],
    authorization: "execute",
    verification: ["priority rationale", "remediation state"],
    evidence: ["finding", "score inputs", "decision"],
    frameworkMappings: [
      "NIST CSF 2.0 (ID.RA)",
      "CISA KEV",
      "FIRST EPSS",
      "CVSS v3.1 / v4.0",
    ],
    status: "dependent",
  },
  {
    id: "attack-path-validation",
    name: "Attack Path Validation",
    domain: "Exposure Management",
    description:
      "Validate whether a modeled attack path is reachable and materially exploitable, inside authorized scope.",
    prerequisites: ["attack graph", "authorized scope"],
    authorization: "execute",
    verification: ["reachable state", "retest evidence"],
    evidence: ["path nodes", "reachability evidence", "retest"],
    frameworkMappings: [
      "MITRE ATT&CK Enterprise v15",
      "MITRE D3FEND",
      "NIST SP 800-115",
    ],
    status: "dependent",
  },
  {
    id: "application-security-assessment",
    name: "Application Security Assessment",
    domain: "Application Security",
    description:
      "Assess application security posture against OWASP ASVS verification requirements and produce findings with retest criteria.",
    prerequisites: ["authorized app scope", "ASVS level target"],
    authorization: "execute",
    verification: ["finding retest", "ASVS mapping"],
    evidence: ["finding", "ASVS mapping", "retest record"],
    frameworkMappings: [
      "OWASP ASVS 4.0.3",
      "OWASP Top 10 2021",
      "OWASP WSTG v4.2",
    ],
    status: "dependent",
  },
];

export function getSecuritySkill(id: string): SecuritySkill | null {
  return securitySkills.find((skill) => skill.id === id) ?? null;
}

export function getSkillsByDomain(domain: SkillDomain): SecuritySkill[] {
  return securitySkills.filter((skill) => skill.domain === domain);
}

export function getSkillsByAuthorization(auth: SkillAuthorization): SecuritySkill[] {
  return securitySkills.filter((skill) => skill.authorization === auth);
}

export function skillsForFramework(framework: string): SecuritySkill[] {
  const needle = framework.trim().toLowerCase();
  if (!needle) return [];
  return securitySkills.filter((skill) =>
    skill.frameworkMappings.some((name) => name.toLowerCase().includes(needle)),
  );
}

/** Skills the runtime may execute; everything else is assess/read or requires HITL. */
export function executableSkills(): SecuritySkill[] {
  return securitySkills.filter((skill) => EXECUTE_SKILLS.has(skill.authorization));
}

/** Unique framework names across the registry, for UI chips and routing. */
export function skillDomains(): SkillDomain[] {
  return SKILL_DOMAINS.filter((domain) => securitySkills.some((skill) => skill.domain === domain));
}
