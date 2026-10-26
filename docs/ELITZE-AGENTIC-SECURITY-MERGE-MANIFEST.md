# ELITZE Agentic Security — Architecture and Deployment Manifest

**Repository:** [terrell0780/elitze-agentic-security](https://github.com/terrell0780/elitze-agentic-security)  
**Product:** ELITZE Agentic Security  
**Production web domain:** [https://www.elitze.info](https://www.elitze.info)  
**Apex domain:** [https://elitze.info](https://elitze.info)

This manifest describes the cybersecurity platform's architecture, implemented code boundaries, external integration contracts, and evidence requirements. A route, module, configuration, or connector implementation is not itself proof that a provider is connected or a production operation succeeded.

## 1. Product scope

ELITZE is a cybersecurity platform that combines:

1. AI-agent identity and MCP runtime security.
2. Deterministic policy enforcement and human approval.
3. Threat detection, security-event correlation, and SOC investigation.
4. Vulnerability and exposure prioritization.
5. Authorized security scanning and security-tool evidence ingestion.
6. Security graph and attack/reachability context.
7. Security orchestration, controlled execution, retesting, and verification.
8. Tenant-scoped audit, evidence integrity, and security operations workspaces.
9. Organization access management and application security controls.

The control loop connects these capabilities:

`Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize → Execute → Observe → Retest → Prove`

The product is not limited to agent access control. Agentic-AI security is a central control surface within a broader platform covering security operations, vulnerabilities, threat evidence, assessment tooling, response workflows, and auditability.

## 2. Architecture and ownership boundaries

### ELITZE control plane and orchestration

- `src/lib/elitze-secure/elitze-agent.ts` — product orchestration, capability routing, policy/gateway/fabric boundary, and audit-backed planning.
- `src/app/api/elitze/route.ts` — governed orchestration API. A plan or accepted task is not proof of external execution.
- `src/lib/elitze-secure/agent-workflow.ts` — tenant-scoped workflow definitions and runs, identity checks, allowed skills/channels, bounded delegation, autonomy mode, and approval handling.
- `src/lib/elitze-secure/approval-workflow.ts` — approval workflow support for sensitive actions.
- `src/lib/elitze-secure/defense-fabric.ts` — security adapter contracts, integration/health states, observation, and authorized-action boundaries.
- `src/lib/elitze-secure/production-adapters.ts` and `production-integrations.ts` — configurable adapter and integration paths.

ELITZE orchestration decides which task or action is being proposed. Policy decides whether it is permitted. A configured, authorized adapter or executor performs any external action. The evidence layer records what the source or executor actually reported. No one layer can substitute its own plan or model output for proof of execution.

### SARA supervisory layer and security assistant

SARA is the supervisory/assistant layer within ELITZE, not an independent authority or separate product control plane. Assistant output can help organize an investigation, summarize source material, or recommend next steps; it cannot grant its own permissions, override policy, or perform high-impact actions without the required authorization and execution path.

### Sentinel security layer

Sentinel refers to the integrated protection layer inside ELITZE. Its source mapping includes the gateway, policy engine, enforcement point, Defense Fabric, audit ledger, configured security adapters, and controlled runner. The name does not imply that an external security provider or an independently hosted runner is currently connected.

### Persistence and tenant boundary

The Next.js application uses PostgreSQL-backed application state and Drizzle ORM migrations. Security evidence, workflow records, and organization data are intended to remain tenant-scoped. Server-side session identity and authorization—not a caller-supplied tenant identifier—must govern access to tenant data and privileged operations.

## 3. Agent identity and MCP runtime controls

Relevant code includes:

- `src/lib/elitze-secure/agent-mcp-control-plane.ts`
- `src/lib/elitze-secure/workload-identity.ts`
- `src/lib/elitze-secure/deterministic-policy.ts`
- `src/lib/elitze-secure/policy-engine.ts`
- `src/lib/elitze-secure/mcp-gateway.ts`
- `src/lib/elitze-secure/runtime-enforcement.ts`
- `src/app/api/control-plane/route.ts`
- `src/app/api/mcp-gateway/route.ts`

The agent/MCP control flow is:

1. Register or discover the relevant agent, workload, MCP server, or tool.
2. Bind identity and requests to a tenant and authorized session.
3. Record observed tool/resource reachability with provenance.
4. Evaluate the action against deterministic policy before protected execution.
5. Produce a decision: allow, deny, require approval, or allow with constraints.
6. Record decision context and evidence.
7. Forward only through an independently authorized gateway/executor boundary.
8. Record the real upstream result or an explicit failed/unavailable outcome.
9. Retest the affected path and preserve the result.

Gateway protections include signed workload-token verification, server/tool identity, capability restrictions, request nonce/replay handling, rate limiting, upstream URL/destination validation, and bounded upstream responses. Missing identity, unauthorized scope, an unavailable required dependency, or an unknown policy result must not silently become permission to execute.

## 4. Deterministic policy and approvals

Policy definitions can express conditions for:

- agent identity and human owner;
- tool and action;
- resource and environment;
- data classification;
- purpose and impact level;
- UTC time window;
- decision and approver role;
- approval expiration.

Conflicting matching policy decisions are resolved by restriction: `DENY > REQUIRE_APPROVAL > ALLOW_WITH_CONSTRAINTS > ALLOW`. The model is not the final authorization engine. Approval, planned work, queued work, and completed execution remain distinct states.

Persistent workflows support manual, scheduled, and event-based trigger definitions. Workflow execution is subject to tenant/agent validation, configured channels and skills, bounded delegation, autonomy mode, and approval gates. A stored schedule does not prove a deployed scheduler is running.

## 5. Threat detection and Agentic SOC

Relevant implementation includes:

- `src/lib/elitze-secure/threat-detection.ts`
- `src/lib/elitze-secure/agentic-soc-graph.ts`
- `src/lib/elitze-secure/autonomous-analyst.ts`
- `src/lib/elitze-secure/security-source-fabric.ts`
- `src/app/api/console/agentic-soc/route.ts`
- `src/app/console/analyst` and `src/app/console/agentic-soc`

The detection layer evaluates authenticated-tenant events that are actually marked `OBSERVED`. Its rule set covers:

- source-authored high/critical alerts for analyst review;
- clusters of at least three observed authentication failures for one source-bound subject within 30 minutes;
- explicit source signals for credential exposure or data exfiltration;
- denials at MCP, tool, policy, authorization, or execution boundaries.

Findings retain event IDs, source references, observation times, severity, and relevant technique identifiers. A denial is not treated as proof that an attack succeeded; source-authored severity is not treated as independent confirmation; generic network traffic is not called exfiltration without an explicit supporting signal.

The Agentic SOC workflow analyzes eligible observed events, groups events where a shared subject, host, indicator, or CVE supports correlation, and preserves evidence gaps and source context. Model review can provide analysis but must not invent findings, silently rewrite source severity, or cause containment without approval. Proposed actions remain approval-required or not-executed until a real authorized execution path returns a result.

## 6. Threat intelligence and source-fabric coverage

The source/catalog architecture documents and models source paths for:

- threat intelligence and investigations: OpenCTI, MISP, TheHive;
- endpoint and network observation: Wazuh, Velociraptor, Suricata, Zeek, OSQuery, FleetDM;
- vulnerability scanning: OpenVAS/Greenbone and Nuclei;
- vulnerability enrichment: CISA Known Exploited Vulnerabilities (KEV), EPSS, NVD, and GitHub Advisories;
- adversary-technique and detection knowledge: MITRE ATT&CK, Sigma, and YARA.

The architecture distinguishes provider API connections from collector-based ingestion, isolated scanner execution, and reference/knowledge sources. The presence of a connector or source catalog entry is not proof of a live authenticated connection. A provider can only be reported as connected when its supported path has returned real evidence for the intended scope.

## 7. Vulnerability and exposure management

Relevant implementation surfaces include `src/lib/elitze-secure/exposure.ts`, vulnerability routes under `src/app/api/vulnerabilities/`, the vulnerability triage/analysis paths, the vulnerability console, and the security graph.

Exposure prioritization is designed to use available CVSS and EPSS values, known-exploitation status, internet exposure, asset criticality, and exploit-verification evidence. The resulting priority is a triage aid, not by itself a proof that a vulnerability is exploitable. Missing values must not be silently substituted with observed facts.

The repository contains paths for CVE/KEV/EPSS context, vulnerability reachability, security-tool findings, and retesting. Findings should retain their source and the scope in which they were observed. A vulnerability is not described as remediated solely because a ticket or UI status changed: the original path/control needs a supported retest result.

## 8. Authorized scanning and the execution runner

The separate `runner/` execution tier is subordinate to the ELITZE control plane. The documented scanner image pins Nuclei v3.11.1 and does not accept arbitrary shell commands. It is designed to accept signed job payloads, check approved target scope and host allowlists, apply target-safety restrictions, run the fixed scanner, and submit signed observations to the control plane.

Runner operations require consistent control-plane/runner HMAC configuration, a real HTTPS origin, signed challenge-response with nonce verification, and approved targets. Local runner self-tests establish the tested code contract; they do not prove a public production runner is deployed or reachable. A real scan result requires an authorized target, actual runner execution, returned observation, and attributable evidence.

## 9. The four integrated security-tool paths

The application contains four security-tool import/observation paths. They are intentionally bounded and do not expose arbitrary tool execution from the web application.

### Nmap — XML scan evidence

- Route: `POST /api/integrations/security-tools/nmap/import`
- Accepts bounded XML, rejects DTD/entity declarations, and limits host/port volume.
- Records valid live-host observations and ports reported as open.
- Does not run Nmap, store the raw XML, or persist NSE script output.
- An open port is an observation, not proof of exploitability.

### John the Ripper — password-audit summary

- Route: `POST /api/integrations/security-tools/john-the-ripper/import`
- Accepts authorized `john --show` summary output through a bounded, authenticated route.
- Stores summary counts and one-way account references.
- Does not retain raw output, usernames, or plaintext passwords.
- Raw output should only be transmitted over TLS on a trusted internal path with request-body logging disabled.

### Aircrack-ng — wireless survey evidence

- Route: `POST /api/integrations/security-tools/aircrack-ng/import`
- Parses access-point survey CSV into BSSID, ESSID, channel, advertised privacy/cipher/authentication, and limited signal/beacon metadata.
- Ignores station/client records and recovered keys; raw CSV is not retained.
- This is a survey evidence connector, not a packet-injection, deauthentication, handshake-cracking, or wireless attack launcher.

### Metasploit Framework — read-only bridge

- Route: `POST /api/integrations/security-tools/metasploit/observe`
- Uses a separately managed HTTPS bridge with server-side bearer credentials.
- Observes bridge health/version and session metadata only.
- Does not expose native Metasploit RPC publicly, launch exploit modules, run payloads, or execute commands.

All four paths require internal authorization and tenant scope. Run assessments only against assets, networks, and credential material covered by explicit written authorization. Evidence imported from a tool is a record of what the supplied source reported, not a blanket security conclusion.

## 10. Security Graph

Relevant code includes `src/lib/elitze-secure/security-graph.ts`, the versioned graph implementation, and `src/app/api/security-graph/`.

The graph relates people, agent identities, service accounts, models, MCP clients/servers, tools, credentials, cloud roles, data stores, vulnerabilities, policies, incidents, execution actions, and evidence. Supported relationship types express authorization, delegation, usage, invocation, reachability, reads/writes, execution, policy governance, decision, result, support, and verification.

Graph questions include who or what can reach a resource, which identity/tool/credential forms the path, what authority governs it, what decision was made, and which evidence supports the outcome. Production queries must use tenant-scoped records. Inferred paths must remain distinguishable from directly observed relationships; missing edges do not justify invented access paths or a guessed remediation.

## 11. Data Bridge and evidence pipeline

Relevant implementation includes `src/lib/elitze-secure/data-bridge.ts` and the API tree under `src/app/api/data-bridge/`.

The Data Bridge provides source authentication, tenant binding, schema validation, event normalization, duplicate/replay handling, persistence, event observation, and source-health inspection. Source bearer credentials are stored as digests; accepted events retain a source reference and content hash and are appended to the tenant-scoped audit path.

The audit ledger in `src/lib/elitze-secure/audit-ledger.ts` assigns per-tenant sequence numbers and SHA-256 hash links. Decision evidence and MCP evidence workflows add context such as policy reference/version, identity, action, evidence state, timestamp, previous hash, record hash, and signatures where configured. The database protections provide tamper evidence and append-oriented behavior; hash chaining alone is not a claim of independent WORM immutability.

Progressive proofing distinguishes:

`UNMEASURABLE → OBSERVED → INTEGRITY_VERIFIED → RETESTED → PROVEN`

A record cannot advance to a later stage without its required source reference, observation timestamp, hash, verified receipt, authorized retest, and observed upstream-result evidence.

## 12. Organization and application controls

The application includes authenticated workspace and console routes, tenant-scoped organization data, owner/admin/analyst/approver/viewer roles, invitations, integration management, and policy/approval flows. Authentication-related code covers password login and registration, email verification and recovery, sessions, MFA, passkeys/WebAuthn, and OIDC/SAML integration paths.

Access controls and database queries must derive authority from authenticated server-side context. Client-provided tenant identifiers are not authorization. Provider credentials belong in deployment secret storage rather than source control or browser code.

## 13. Truth states and reporting rules

Keep these states distinct:

| State | Meaning |
| --- | --- |
| `IMPLEMENTED` | The code path exists and can be tested in the repository/runtime. |
| `CONFIGURED` | Required settings/credentials have been supplied for a particular environment. |
| `CONNECTED` / `INTEGRATED` | A real authenticated provider/runtime path has responded or returned real source evidence. |
| `OBSERVED` | The specific event/result is supported by an actual source or runtime record. |
| `INFERRED` | A documented analysis derives a conclusion from observed information. |
| `UNKNOWN` | Evidence does not establish the requested fact. |
| `UNMEASURABLE` | Required data or a valid measurement is unavailable. |
| `INSUFFICIENT_REACH` | Available identity/source access is not enough to establish the requested path or conclusion. |
| `VERIFIED` / `PROVEN` | The specific verification criteria have been met and attributable evidence is recorded. |

A repository reference, adapter, installed scanner, demo screen, unit test, successful build, plan, or approval does not independently establish provider connectivity, successful execution, exploitability, remediation, security effectiveness, compliance, certification, or customer outcome.

No synthetic telemetry, fake assets, invented threat findings, fabricated scan results, fake customer metrics, or guessed risk scores may be presented as production evidence. Preserve provenance, observation time, scope, uncertainty, and failure results.

## 14. Release and operational verification

Before claiming an integration or operation is live, verify the relevant deployed environment and record the evidence. The verification sequence is:

1. Run dependency installation, typecheck, lint, security/auth/tenant tests, tool-integration parser tests, migration checks, runner checks, and production build.
2. Confirm the target database is the approved environment, migrations are applied, and tenant-isolation/authorization behavior is checked.
3. Verify login, recovery, session, admin/role, and tenant-boundary paths.
4. Verify the actual runner origin, health, signed handshake, nonce validation, and callback signature.
5. Verify each external provider using authorized credentials and real records; do not infer connectivity from configuration alone.
6. Run security scans only within written scope and retain the actual results.
7. For a remediation claim, retest the original risk/path and retain the observed outcome.
8. Record the commit, deployment version, scope, source references, timestamps, test outcome, and unresolved gaps.

The repository's consolidated CI workflow is `.github/workflows/production-gates.yml`; it contains the production gates and the scheduled accessibility audit. CI statuses must reflect executed checks rather than being treated as passed when a runner did not execute the job steps.

## 15. Deployment boundaries and secret handling

- Use this repository and `runner/Dockerfile` for the documented runner implementation.
- Keep production database URLs, API keys, HMAC keys, provider tokens, and bridge credentials out of source control.
- Keep native Metasploit RPC private; expose only the authenticated HTTPS bridge contract.
- Keep MCP gateway and execution features explicitly disabled until upstream allowlists, server credentials where required, and authorized staging verification are in place.
- Restrict scanner targets to explicitly authorized hosts/networks.
- Review destructive database migrations and production data changes before execution.
- Do not claim independent penetration testing, SOC 2/ISO certification, compliance, customer outcomes, performance, or production-scale reliability without the applicable evidence.

## 16. Additional product modules and integration boundaries

This section records capabilities that sit alongside the core agent/MCP path and must remain visible in the product inventory.

### 16.1 Production identity and cloud integrations

The documented initial integration scope includes:

- **MCP:** server discovery, tool inventory, controlled gateway requests, deterministic policy, request/response metadata, and tool-description change observations.
- **GitHub/GitHub Actions:** repository and workflow metadata, authorized installation context, protected-branch state, Actions secret metadata (never secret values), and organization audit events when the token has permission.
- **AWS IAM/CloudTrail:** signed API requests, STS caller identity, IAM role and managed-policy metadata, and CloudTrail events.

Additional contracts cover:

- **Microsoft Entra ID/Azure:** user/application/service-principal context and audit/sign-in activity.
- **Kubernetes:** API discovery, service-account and workload identity, RBAC relationship mapping, and authorized observations.

The phase-6 integration notes explicitly keep Entra and Kubernetes outside the initial end-to-end implementation boundary until the initial MCP/GitHub/AWS paths have been verified. They must therefore be described as integration contracts or configurable paths unless a real environment proves otherwise.

All integration adapters require tenant authorization, least-privilege provider permissions, authenticated discovery, persisted source evidence, an observable result, and a retest where the control path is being evaluated. No code module by itself proves a provider is live.

### 16.2 SOC analyst dashboard and security posture views

The analyst console includes product surfaces for executive overview, threat intelligence, assets, CVEs, agents, active threats, critical assets, KEV/EPSS/VPR and evidence-qualified risk states, attack graph context, active campaigns, investigation timeline, autonomous analyst findings, source-fed threat detection, and connector probes. A world map is meaningful only where the source provides real coordinates.

The dashboard and analyst should preserve the difference between a source alert, a correlated observation, an analyst inference, a proposed response, and an independently verified outcome. An unconfigured source must not produce fake counts or imply active monitoring.

### 16.3 Knowledge retrieval and AI provider paths

The wider repository contains AI provider-connection management, tenant-scoped document ingestion, retrieval-augmented generation, and vector search backed by PostgreSQL/pgvector. Retrieved text and model-generated summaries can support research, investigation, and evidence organization; they do not replace source evidence, deterministic authorization, or human approval where required.

### 16.4 Wider business and governance modules

The repo also contains application paths and documentation for:

- REO/content trust, ownership and integrity governance;
- Google Ads pre-publication allow/review/block decisions and policy evidence;
- Semrush and Similarweb market-intelligence paths;
- CRM/business relationship API surfaces;
- compliance catalogs and framework/control mapping;
- RIO/ROI results, impact, outcome, and financial-assumption calculations;
- team messaging and related collaboration endpoints;
- accessibility contracts and Axe/WCAG/Lighthouse checks;
- dependency, security, configuration, build, and software-supply-chain validation.

These modules are part of the broader product repository, but should be described as connected or operational only when the relevant account, credentials, service, and observed result are verified.

### 16.5 Authentication and team-access surface

The application includes registration and login, verification/recovery, sessions, MFA, passkeys/WebAuthn, OIDC/SAML integration paths, API-key issuance/revocation, organization/tenant administration, invitations, and role-separated owner/admin/analyst/approver/viewer access. Every privileged route must enforce server-side identity and authorization; tenant IDs supplied by callers are not authority by themselves.

### 16.6 Runner and security-tool scope

The separate authorized runner and the four security-tool paths are distinct:

- Nmap imports bounded XML scan evidence; it does not execute arbitrary Nmap commands from the web application.
- John the Ripper imports bounded password-audit summary data and does not retain plaintext passwords or raw output.
- Aircrack-ng imports Wi-Fi access-point survey records; it is not a wireless attack launcher.
- Metasploit uses a read-only HTTPS bridge for health and session metadata; the connector does not launch exploit modules or payloads.
- Nuclei runs through the bounded scanner runner with signed jobs, authorized target scope, timeouts, and signed observations.

Execution capability must remain confined to the authorized runner or a separately authorized adapter. An import endpoint is not an execution endpoint; scanner installation is not a completed scan; a finding is not proof of exploitability.

## 17. Documentation map

- [README / product overview](../README.md)
- [Agent identity and MCP runtime contract](ELITZE-AGENT-IDENTITY-MCP-RUNTIME-CONTRACT.md)
- [Production integrations](ELITZE-PRODUCTION-INTEGRATIONS.md)
- [Autonomous analyst and security source fabric](ELITZE-AUTONOMOUS-ANALYST.md)
- [Defense Fabric](ELITZE-DEFENSE-FABRIC.md)
- [Security graph](ELITZE-SECURITY-GRAPH.md)
- [Security tool integrations](SECURITY-TOOL-INTEGRATIONS.md)
- [Progressive proofing](ELITZE-PROGRESSIVE-PROOFING.md)
- [Tamper-evident evidence](ELITZE-TAMPER-EVIDENT-EVIDENCE.md)
- [Enterprise security control status](ENTERPRISE-SECURITY-CONTROL-STATUS.md)
- [Production/customer readiness](PRODUCTION-CUSTOMER-READINESS.md)

## Repository integrity

Keep the repository as the single implementation reference for ELITZE Agentic Security. Changes to product claims must be backed by the corresponding code path and verification evidence. Do not imply a submodule, third-party source, branded layer, or external provider is live merely because it appears in an architecture diagram or documentation.
