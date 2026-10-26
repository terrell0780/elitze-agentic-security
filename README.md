# ELITZE Agentic Security

**A cybersecurity platform for AI agents, connected tools, applications, infrastructure, and security operations.**

ELITZE helps security teams understand what can access their environment, evaluate what those identities are allowed to do, investigate security signals, govern sensitive actions, and retain evidence of what actually happened. It brings agentic-AI controls together with threat detection, vulnerability and exposure analysis, controlled security testing, security-tool integrations, and auditable response workflows.

**Website:** https://www.elitze.info  
**Repository:** https://github.com/terrell0780/elitze-agentic-security

## What the platform covers

### 1. AI agent identity and MCP runtime security

ELITZE treats AI agents, models, MCP clients and servers, tools, service accounts, credentials, and human owners as security-relevant identities and resources. Its control plane is designed to connect identity to reachability, policy, execution, runtime observation, and evidence.

The MCP gateway evaluates tool requests before they are forwarded. The control path supports workload-token verification, tool and server identity, capability checks, tenant and session binding, request replay protection, rate limiting, upstream destination validation, policy decisions, and recording of request and outcome evidence. Depending on policy, a request can be allowed, denied, constrained, or held for approval. A model response never grants itself permission to execute an action.

### 2. Policy enforcement and approvals

The deterministic policy engine evaluates requests against explicit conditions, including agent identity, human owner, tool, action, resource, environment, data classification, purpose, impact level, time window, and approver role. Conflicting rules resolve toward the more restrictive decision: deny, require approval, allow with constraints, then allow.

The platform includes approval workflows and persistent agent workflows with manual, scheduled, and event-based trigger definitions. Workflows have tenant and agent identity checks, bounded delegation, allowed skills and channels, autonomy modes, and approval gates for sensitive actions. A plan or approval is not represented as an executed outcome; execution results have to come from the authorized execution path.

### 3. Threat detection and SOC investigation

ELITZE includes evidence-based threat detection and an Agentic SOC analysis path. The detection rules surface high-impact source alerts, repeated authentication failures clustered within 30 minutes, explicit credential-exposure or data-exfiltration signals, and denials at sensitive MCP, tool, policy, or execution boundaries. Detection records retain source references, event IDs, observed times, severity, and relevant technique identifiers.

The autonomous analyst correlates eligible observed security events by subject, host, indicator, or vulnerability where those keys are available. It keeps the source evidence and evidence gaps visible, provides findings for analyst review, and distinguishes source-authored alerts from independently verified conclusions. The platform does not treat a denied action as a successful attack, infer exploitability from a generic signal, or initiate containment merely because an alert exists.

The security source model covers threat intelligence, endpoint and network telemetry, investigation/case systems, detection-rule knowledge, and vulnerability feeds. Documented sources include OpenCTI, MISP, TheHive, Wazuh, Velociraptor, Suricata, Zeek, OSQuery, FleetDM, OpenVAS/Greenbone, Nuclei, CISA KEV, EPSS, NVD, GitHub Advisories, MITRE ATT&CK, Sigma, and YARA. These represent connector and source support boundaries; each provider must be configured and verified before its data is described as live.

### 4. Vulnerability and exposure management

ELITZE has vulnerability, exposure-prioritization, and reachability-related code paths designed to bring vulnerability findings into context with asset importance, internet exposure, known exploitation, exploit-verification evidence, CVSS, and EPSS. Its documentation and console organize CVE findings, KEV and EPSS context, assets, attack paths, and supporting evidence to help teams prioritize what warrants attention.

Nuclei is pinned in the separate security runner used for authorized scanning. The runner accepts signed job requests, enforces allowed-host scope and target-safety rules, runs a fixed scanner rather than arbitrary shell commands, and returns signed observations to the control plane. A scan only counts as an actual result when the authorized execution took place and evidence was returned. Scanner installation, a planned job, or a finding imported from a source is not by itself proof that a target is exploitable or that remediation succeeded.

### 5. Security-tool integrations: four named tools

ELITZE includes authenticated, tenant-scoped import or observation paths for four commonly used security tools:

- **Nmap:** imports bounded XML scan evidence, recording valid live hosts and ports reported as open. The importer rejects DTD/entity declarations and does not store raw XML or NSE script output. Nmap itself runs on an authorized workstation or security runner; the web application does not execute arbitrary Nmap commands.
- **John the Ripper:** accepts authorized audit-summary output and records counts and hashed account references. It does not persist plaintext passwords or raw output.
- **Aircrack-ng:** imports Wi-Fi access-point survey CSV, including BSSID, SSID, channel, advertised privacy/cipher/authentication, and limited signal/beacon metadata. It ignores station/client records and recovered keys. This is a survey-evidence connector, not a wireless attack launcher.
- **Metasploit Framework:** observes health and session metadata through a separately managed HTTPS bridge. The integration is read-only; ELITZE does not launch exploit modules, run payloads, or execute commands through this connector.

These routes require internal authorization and tenant scope. Use them only with written permission for the assets, networks, and credentials being assessed.

### 6. Security graph, data ingestion, and evidence

The Security Graph relates identities, agents, models, MCP servers, tools, credentials, cloud roles, data stores, vulnerabilities, policies, incidents, actions, and evidence. Its purpose is to support questions about reachability, delegation, authorization, blast radius, decisions, and what evidence supports an asserted state.

The Data Bridge receives external security events through authenticated sources, validates and normalizes them, binds them to a tenant, handles duplicate delivery, and persists source evidence. Audit records preserve source and event references plus content hashes. Operational surfaces distinguish **OBSERVED**, **INFERRED**, **UNKNOWN**, and **UNMEASURABLE** states instead of filling missing data with invented telemetry or risk metrics.

The PostgreSQL-backed audit ledger uses per-tenant sequencing and SHA-256 hash links. The broader evidence workflow includes signed decision receipts, integrity checks, evidence export, and progressive proof stages that require an observed record, integrity verification, an authorized retest, and a recorded upstream result before a condition can be marked proven. Hash chaining provides tamper evidence; it is not a claim that the database alone is independently immutable.

### 7. Orchestration, execution, and verification

The ELITZE orchestration layer routes security objectives to supported capability areas such as threat hunting, vulnerability analysis, incident response, investigation, and report review. The Defense Fabric separates planning, policy authorization, the adapter that performs the action, and the evidence that establishes the result. High-impact actions remain approval-gated, and an unavailable adapter is not treated as a successful response.

The separate runner is subordinate to the control plane. Its documented controls include signed requests, nonce/replay checks, explicit scope and host allowlists, bounded scanner execution, timeouts, and signed callbacks. External actions require a real authorized adapter or executor; the existence of a route or workflow alone does not prove that a provider action was performed.

### 8. Organization and application security

The application includes an authenticated workspace and security console, tenant-scoped records, owner/admin/analyst/approver/viewer roles, team invitations, and access-management workflows. Account security code covers password-based authentication, verification and recovery, session handling, MFA, passkeys/WebAuthn, and OIDC/SAML integration paths. Server-side authorization and tenant isolation are part of the security boundary; a tenant ID supplied by a client is not authorization.

Sara is ELITZE's security assistant. It supports investigation, summarization, evidence organization, and security workflows within the platform's identity, policy, approval, and execution boundaries. Model-generated analysis does not override deterministic authorization.

## The ELITZE control loop

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize → Execute → Observe → Retest → Prove`

This links an identity and its reachable resources to the policy decision, the authorized action, the observed result, and the evidence needed to verify the outcome.

## Application and service entry points

| Route | Purpose |
| --- | --- |
| `/login`, `/register` | Account access |
| `/workspace`, `/console` | Authenticated workspace and security operations |
| `/console/analyst` | Analyst and security-source investigation surface |
| `/console/vulnerabilities` | Vulnerability review surface |
| `/console/agentic-soc` | Agentic SOC analysis surface |
| `POST /api/security/decision` | Policy decision and audit workflow |
| `POST /api/mcp-gateway` | Governed MCP gateway |
| `POST /api/data-bridge/ingest` | Authenticated source-event ingestion |
| `GET /api/data-bridge/observe` | Normalized security observations |
| `GET /api/security-graph` | Tenant-scoped security graph queries |
| `POST /api/elitze` | Governed orchestration planning |
| `GET /api/health` | Service health |

Tool-import endpoints are documented in [Security Tool Integrations](docs/SECURITY-TOOL-INTEGRATIONS.md). API availability does not prove that a third-party provider is connected.

## Technology

- Next.js, React, TypeScript, Node.js 24+
- PostgreSQL with Drizzle ORM and versioned migrations
- LangGraph-based SOC analysis workflow
- Signed runner/control-plane communication
- Dedicated security, authentication, tenant, policy, integration-parser, evidence, and runner self-tests

## Run locally

Requirements: Node.js 24+ and npm 10+.

```bash
git clone https://github.com/terrell0780/elitze-agentic-security.git
cd elitze-agentic-security
npm ci
npm run dev
```

Configure only the environment variables required for your selected workflows using [`.env.example`](.env.example). Never commit credentials, production database URLs, or provider tokens.

## Engineering checks

```bash
npm run typecheck
npm run lint
npm run test
npm run security-tool-integrations:self-test
npm run accessibility:contract-self-test
npm run production-config:self-test
npm run db:runtime-role:self-test
npm run runner:self-test
npm run runner:handshake-self-test
npm run runner:control-plane-handshake-self-test
npm run build
```

## Documentation

- [Architecture and deployment manifest](docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md)
- [Production integrations](docs/ELITZE-PRODUCTION-INTEGRATIONS.md)
- [Security-tool integrations](docs/SECURITY-TOOL-INTEGRATIONS.md)
- [Agent identity and MCP runtime contract](docs/ELITZE-AGENT-IDENTITY-MCP-RUNTIME-CONTRACT.md)
- [Autonomous analyst and security source fabric](docs/ELITZE-AUTONOMOUS-ANALYST.md)
- [Defense Fabric](docs/ELITZE-DEFENSE-FABRIC.md)
- [Tamper-evident evidence architecture](docs/ELITZE-TAMPER-EVIDENT-EVIDENCE.md)
- [Enterprise security control status](docs/ENTERPRISE-SECURITY-CONTROL-STATUS.md)
- [Security reporting](SECURITY.md)
- [Contribution guide](CONTRIBUTING.md)

## Scope and evidence rule

ELITZE is a cybersecurity platform, not just an AI-agent access product. It combines AI security controls with SOC investigation, threat detection, vulnerability and exposure analysis, authorized scanning workflows, external security-tool evidence, orchestration, and auditability.

Implementation, configuration, live connectivity, and independently verified outcomes are different states. The product must not claim that a provider is connected, a scan completed, a threat was confirmed, a control is effective, or a vulnerability was remediated unless the relevant environment produced attributable evidence. Security testing must remain within explicit authorization and agreed scope.

---

**ELITZE Agentic Security** — govern the action, investigate the signal, and preserve the evidence.
