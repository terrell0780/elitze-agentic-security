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

## Additional platform modules

### 9. Production identity and cloud integration paths

Beyond the MCP control plane, ELITZE defines provider paths for:

- **GitHub and GitHub Actions:** repository and workflow metadata, authorized GitHub App installation context, protected-branch and workflow observations, secret metadata without reading secret values, and organization audit events when granted.
- **AWS IAM and CloudTrail:** caller identity, IAM role and customer-managed policy metadata, and signed CloudTrail observations.
- **Microsoft Entra ID and Azure:** directory users, applications, service principals, sign-in/audit activity, and identity context for access review.
- **Kubernetes:** API discovery, workload and service-account identity, RBAC relationships, and authorized cluster observations.

The first implemented integration phase is centered on MCP, GitHub, and AWS. Entra/Azure and Kubernetes are defined integration paths, not a statement that every tenant already has a working production connection. Each requires customer-side credentials, least-privilege review, successful discovery, and captured evidence before it can be called integrated.

### 10. Executive security dashboard and exposure views

The analyst and security operations surfaces bring together the signals available to a tenant, including:

- executive overview and asset inventory;
- threat-intelligence context;
- CVEs and vulnerability findings;
- agents and their observed relationships;
- active threats and high-criticality assets;
- KEV, EPSS, VPR, and evidence-qualified risk context;
- attack-graph context;
- campaigns and investigation timelines;
- analyst findings and source-fed detection fabric;
- geospatial views only when actual coordinates are present;
- connector status and missing-data indicators.

Counts and risk views must be sourced from tenant records and real observations. The UI does not invent assets, locations, vulnerability findings, threat feeds, or risk scores to fill an empty dashboard.

### 11. Retrieval, knowledge, and model-provider governance

ELITZE also contains paths for tenant-scoped document ingestion, retrieval-augmented generation (RAG), vector search backed by PostgreSQL/pgvector, AI provider connection management, and governed use of model-generated analysis. Retrieved material and generated summaries support investigation and workflow context; they do not override policy, establish facts without sources, or grant authorization.

### 12. Additional governance and business modules

The wider application also includes modules beyond the core security control plane:

- **REO/content governance:** trust and ownership decisions, content-integrity review, and supporting intelligence workflows.
- **Google Ads governance:** pre-publication policy decisions to allow, block, or require review, with supporting evidence and checks against misleading claims.
- **Market intelligence:** Semrush and Similarweb connection paths.
- **CRM:** customer and business relationship API surfaces.
- **Compliance mapping:** control/framework catalogs and mapping workflows.
- **RIO/ROI:** result, impact, and outcome measurement based on observed security signals and customer-approved financial assumptions.
- **Team collaboration:** messaging and related team/session API surfaces.
- **Accessibility and release quality:** accessibility contract tests, Axe/WCAG and Lighthouse audit, dependency/security checks, configuration self-tests, and build gates.

These modules belong to the wider ELITZE product and repository. Their presence does not mean a third-party account is connected or a business outcome has been achieved; those require their own operational evidence.

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

## Complete ELITZE product and feature inventory

This section consolidates the product capabilities that must remain visible across the documentation. It describes repository-backed modules and documented integration paths; it does not imply every external provider is configured or live.

### A. AI agent security, identity, and runtime
- AI agent and workload identity; identity relationships to human owners and tenants.
- MCP client, server, and tool discovery and identity; workload-token verification and session binding.
- Agent passports and agent-risk context where supported by the relevant code path.
- Resource reachability mapping, least-privilege boundaries, and sensitive data/credential access controls.
- MCP gateway request evaluation, tool/server identity, capability checks, request validation, replay/nonce protection, rate limiting, safe upstream destination validation, bounded responses, and timeouts.
- Deterministic pre-execution policy outcomes: allow, deny, require approval, or allow with constraints.
- Runtime enforcement and outcome observation; model output cannot grant its own execution permissions.
- Purpose-bound and tenant-scoped access; fail-closed handling of critical authorization failures.

### B. Policy, approval, workflow, and orchestration
- Deterministic policy evaluation and policy versioning; constrained JSON/YAML policy definitions where supported.
- Conditions for agent, owner, tool, action, resource, environment, data classification, purpose, impact, time window, and approver role.
- Restrictive conflict resolution; approval expiration and governed high-impact actions.
- Persistent agent workflow definitions and runs; manual, scheduled, and event-based trigger definitions.
- Allowed skills/channels, autonomy modes, bounded delegation, and tenant/agent validation.
- Security-task orchestration for threat hunting, vulnerability analysis, incident response, investigation, OSINT/research, fraud analysis, and report review where the relevant route/skill exists.
- Defense Fabric adapter contracts separating planning, authorization, execution, and returned evidence.
- Kill-switch request handling and explicit blocked, pending, approval-required, unavailable, failed, and completed states where implemented.
- Plans, approvals, queued jobs, and actual execution results remain distinct.

### C. Threat detection, threat intelligence, and SOC
- Source-backed threat detection and high/critical source-alert surfacing.
- Authentication-failure clustering across a 30-minute window.
- Explicit credential-exposure and data-exfiltration indicators.
- Sensitive MCP/tool/policy/authorization/execution-boundary denial signals.
- Event IDs, source references, timestamps, severity, and ATT&CK technique context.
- Agentic SOC graph/workflow, autonomous analyst, supported event correlation, investigation timelines, findings, analyst review, and evidence gaps.
- Threat-intelligence and case-management source paths for OpenCTI, MISP, and TheHive.
- Endpoint and network telemetry source paths for Wazuh, Velociraptor, Suricata, Zeek, OSQuery, and FleetDM.
- Detection and knowledge sources including MITRE ATT&CK, Sigma, and YARA.
- Threat consoles, analyst consoles, SOC feedback/metrics paths, and connector health surfaces where implemented.
- Source-authored alert, correlated observation, analyst inference, proposed response, and verified outcome remain distinct.

### D. Vulnerability, exposure, assets, and authorized testing
- CVE/vulnerability triage and vulnerability-console surfaces.
- CVSS, EPSS, CISA KEV, NVD, and GitHub Advisory enrichment paths.
- Asset criticality, internet exposure, known exploitation, and exploit-verification evidence where available.
- Exposure prioritization, reachability context, attack-path relationships, and evidence-qualified risk.
- Nuclei and OpenVAS/Greenbone source/connector paths; bounded Nuclei runner execution.
- Signed scan jobs and callbacks, HMAC challenge/response, nonce/replay protection, target allowlists, scope checks, target-safety restrictions, and timeouts.
- Authorized scan-result ingestion, vulnerability remediation tracking, and retesting.
- AST-diff analysis paths where present.
- Red-team/adversary-emulation and pentesting-related console/workflow surfaces where present.
- A scanner install, scheduled scan, imported finding, or risk score alone is not proof of a successful scan, exploitability, or remediation.

### E. Four security-tool integrations
- **Nmap:** bounded XML import; live-host/open-port observations; DTD/entity rejection; no raw XML/NSE output retention; import does not run arbitrary Nmap commands.
- **John the Ripper:** authorized audit-summary import; counts and hashed account references; no plaintext passwords or raw-output retention.
- **Aircrack-ng:** wireless access-point survey CSV; BSSID/SSID/channel and advertised security/signal metadata; station/client records and recovered keys excluded; survey connector, not attack launcher.
- **Metasploit Framework:** separately managed authenticated HTTPS bridge; health/version and session metadata only; no web-exposed exploit-module, payload, or command execution.

### F. Security graph, Data Bridge, and evidence
- Security graph entities and relationships across people, agents, service accounts, models, MCP servers, tools, credentials, cloud roles, data stores, assets, vulnerabilities, policies, incidents, actions, and evidence.
- Authorization, delegation, invocation, reachability, reads/writes, execution, governance, decision, result, support, and verification relationships.
- Tenant-scoped graph queries, blast-radius/reachability context, and observed-versus-inferred relationships.
- Authenticated data-source registration, source-token hashing/revocation, tenant binding, schema validation, normalization, duplicate/replay handling, bounded ingestion, persistence, source-health, and observed-signal APIs.
- Per-tenant sequence numbers and SHA-256 hash-linked audit records; decision/MCP evidence, signed receipts where configured, and evidence export.
- Offline verification and evidence snapshot/inspection tooling where implemented.
- Progressive proof stages: OBSERVED, INTEGRITY_VERIFIED, RETESTED, and PROVEN, with UNKNOWN/UNMEASURABLE states retained when evidence is absent.
- Hash chaining is tamper evidence, not a claim of independent WORM immutability.

### G. Identity, cloud, and application integrations
- **MCP:** discovery, tool inventory, governed requests, policy and runtime observations.
- **GitHub/GitHub Actions:** repository/workflow metadata, authorized installation context, protected-branch/workflow observations, secret metadata without secret values, and organization audit events when permitted.
- **AWS IAM/CloudTrail:** caller identity, role and managed-policy metadata, and CloudTrail observations.
- **Microsoft Entra ID/Azure and Kubernetes:** documented integration contracts for directory/service-principal/sign-in context, workload/service-account identity, RBAC, and authorized cluster observations; treat as configurable paths until verified.
- Provider/collector source paths for vulnerability and endpoint/network tools described above.
- Connection management, capability manifests, integration health, and credential revocation paths where present.
- Provider names in a catalog or adapter do not establish that an authenticated live connection exists.

### H. AI assistant, skills, RAG, and model governance
- Sara/ELITZE security-assistant workflows for investigation, summarization, and evidence organization within policy boundaries.
- Security skill registry, skill prerequisites, authorization levels, and evidence/verification requirements where implemented.
- AI-provider connection management and NVIDIA NIM connection/review paths where present.
- Tenant-scoped document ingestion, retrieval-augmented generation (RAG), and PostgreSQL/pgvector-backed vector search.
- Model-assisted analysis and retrieved content remain subordinate to source evidence, deterministic policy, and required human approval.

### I. Authentication, organizations, and collaboration
- Registration, login, email verification, password reset/recovery, sessions, logout, MFA, passkeys/WebAuthn, and OIDC/SAML paths.
- API-key issuance and revocation where implemented.
- Organization/tenant creation and administration; owner, admin, analyst/member, approver, and viewer roles.
- Owner-managed business profile, member review, invitations, role selection, pending-invitation revocation, token hashing, single-use invitations, rate limits, and expiry as documented.
- Tenant-scoped security records and server-side role enforcement; client-provided tenant IDs do not confer authority.
- Team messaging, voice, and session-related API surfaces where present.
- Invitation email delivery and multi-organization membership depend on configuration and documented support boundaries.

### J. Consoles, dashboards, reporting, and diagnostics
- Security workspace, executive overview, asset inventory, agent views, active threats, critical assets, CVEs/vulnerabilities, threat intelligence, attack graph, campaigns, investigation timeline, and analyst findings.
- Agentic SOC, autonomous analyst, vulnerability, integration, organization, security skills, adversary-emulation/pentesting, readiness/diagnostics, ROI, evidence-debugging/snapshot, and progressive-proofing surfaces where present.
- KEV/EPSS/VPR and risk context only when supported by source data; geospatial views only with actual coordinates.
- JSON/PDF evidence export on applicable routes, audit records, security reports, and source-linked findings.
- Missing telemetry, provider outages, unavailable adapters, and evidence gaps must remain visible rather than being replaced by fabricated data.

### K. Wider ELITZE business and governance modules
- **REO/content governance:** trust/ownership decisions, content-integrity review, and supporting intelligence paths.
- **Google Ads governance:** pre-publication allow/review/block decisions and policy evidence.
- **Market intelligence:** Semrush and Similarweb connection paths.
- **CRM:** customer/business relationship API surfaces.
- **Compliance:** framework/control catalogs and mapping workflows.
- **RIO/ROI:** results, impact, outcome, and financial-assumption calculations; claims require real source data and disclosed assumptions.
- **Collaboration:** team messaging and related session surfaces.
- **Accessibility:** accessibility contract tests and Axe/WCAG/Lighthouse audit paths.
- **Release and supply-chain quality:** dependency/security checks, configuration and production self-tests, build gates, migration checks, and SBOM workflow components where present.

### L. Security, privacy, and operational boundaries
- Tenant isolation and server-side authorization; secrets held in deployment secret storage rather than source control/browser code.
- Signed runner/control-plane communication, bounded authorized execution, explicit target scope, and auditable outcomes.
- Security tests for authentication, role access, integration parsers, runner handshakes, configuration, accessibility, and production builds where configured.
- Explicit distinction between IMPLEMENTED, CONFIGURED, CONNECTED, OBSERVED, INFERRED, UNKNOWN, UNMEASURABLE, and VERIFIED/PROVEN.
- No invented telemetry, fake assets, fabricated findings, guessed risk scores, or unsupported claims of certification, compliance, remediation, or customer outcomes.

## Documentation

- [Architecture and deployment manifest](docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md)
- [Full project manifest (routes, scripts, dependencies, deployment and readiness)](docs/ELITZE-AGENTIC-SECURITY-FULL-MANIFEST.md)
- [ELITZE chat and context export (available excerpts and project context)](docs/ELITZE-AGENTIC-SECURITY-CHAT-AND-CONTEXT-EXPORT.md)
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
