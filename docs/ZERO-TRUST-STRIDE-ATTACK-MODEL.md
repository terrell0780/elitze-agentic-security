# ELITZE Agentic Security — Zero-Trust Architecture, STRIDE Threat Model, and ATT&CK Scenario

- **Document status:** Architecture and threat-model baseline
- **Assessment date:** 2026-10-16
- **System in scope:** ELITZE Agentic Security, an enterprise agent-identity and MCP-runtime-security application
- **Control objective:** Every identity, workload, tool invocation, integration, and data access decision is explicitly authenticated, authorized, attributable, least-privileged, observable, and revocable.

## 1. Executive Summary

ELITZE should operate as a resource-centric zero-trust control plane. Network location, Vercel deployment membership, possession of a previously valid session, or presence inside a customer network must never be treated as sufficient authorization. Authentication and authorization are evaluated at the user, workload, tenant, tool, and data-resource boundary.

The intended control loop is:

**Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove**

The reference implementation uses the existing Next.js application on Vercel, Neon PostgreSQL, GitHub Actions, the ELITZE Runner, Resend for transactional email, and explicitly authorized integrations to customer identity, cloud, Kubernetes, source-control, and MCP services. Customer environments remain separate trust domains. ELITZE does not gain implicit reachability into customer networks simply because an integration has been registered.

### Decision summary

1. Keep the MCP gateway and tool execution disabled by default. Enable only named, reviewed upstreams after staging verification and customer authorization.
2. Require phishing-resistant MFA for privileged users, short-lived workload identity for automation, and just-in-time elevation for sensitive administrative actions.
3. Make tenant boundaries explicit in both application authorization and data access. Do not rely on UI filtering.
4. Treat evidence as security data: authenticate its source, record provenance and freshness, protect integrity, and keep operational logs separate from sensitive payloads.
5. Fail closed for authorization, identity verification, upstream address validation, and high-impact actions. When visibility is missing, report UNKNOWN, UNMEASURABLE, or INSUFFICIENT_REACH rather than success.
6. Do not declare production service readiness from a successful build alone.

### Scope and assumptions

This document uses the current ELITZE deployment context as the baseline. Enterprise customers may supply Microsoft Entra ID or another OIDC/SAML identity provider; AWS accounts; Azure subscriptions; Kubernetes clusters; GitHub organizations; on-premises systems; and approved MCP servers. These are supported integration patterns, not assertions that every customer connector is currently configured or live.

Production evidence observed during this assessment:
- The production Vercel deployment for commit 55741a1706c2459aa633407fefab9016254a1db5 reached READY.
- The public health endpoint returned HTTP 503 during the most recent direct probe. Runtime readiness is therefore not verified by that probe.
- Read-only inspection of the default Neon main branch database named neondb found 33 recorded migrations through 0032_validation_kinds.sql.
- The inspected database reported 133 public base tables, zero tables with row-level security enabled, and zero public row-level security policies. This is a material tenant-isolation verification gap until application-level isolation has been independently demonstrated and database-level controls are assessed.
- MCP gateway and execution flags are configured to default to false. The architecture does not assume a live upstream or authorize tool execution without an explicit, tested configuration.

These observations are time-bound evidence; repeat the relevant checks against the exact production deployment and connection before accepting the service as ready.

## 2. System Context and Trust Boundaries

### 2.1 Core components

| Component | Responsibility | Trust level | Required security boundary |
|---|---|---|---|
| Enterprise user / browser | Access console, view tenant data, administer authorized policies | Untrusted client | No secrets or authorization decisions in browser code; server verifies every request |
| DNS and public ingress | Resolve ELITZE domains and deliver HTTPS requests | External infrastructure | TLS, managed DNS controls, rate limiting/WAF where configured, no trust based on source IP alone |
| Vercel edge and Next.js application | Serve UI and API routes; enforce application policy | Public-facing workload | Separate public, authenticated, privileged, and internal APIs; strict request validation |
| Enterprise identity provider | Authenticate workforce/customer identities through OIDC or SAML | External identity authority | Issuer/audience/nonce/state/signature validation; MFA and Conditional Access owned by IdP |
| ELITZE policy/control plane | Evaluate tenant, subject, resource, tool and contextual policy | High-value security control | Deny by default; policy version, decision, reason code, approver, and correlation ID recorded |
| ELITZE Runner / GitHub Actions | Execute approved checks and deployment/test automation | Privileged workload | Isolated jobs, short-lived tokens, branch/environment protection, egress controls, no ambient credentials |
| Neon PostgreSQL | Store tenant-scoped identity, integration metadata, policy, decisions, and evidence | Critical data plane | TLS, least-privileged runtime role, backups, tenant-aware authorization, migration and schema verification |
| MCP gateway | Validate MCP requests and upstream destination; authorize before tools run | High-risk execution boundary | Default-off; exact allowlist; DNS pinning; public-address validation; bounded requests; approval for sensitive tools |
| Customer integration zone | Customer-controlled AWS, Azure, Entra ID, GitHub, Kubernetes, on-premises and MCP resources | Separate customer trust domain | Explicit customer consent, scoped credentials, outbound-only collection where possible, no assumed network transit |
| Email provider | Send verification, recovery, and security notification email | External processor | Sending-only restricted API key, verified sender domain, limited payload, delivery audit |
| Evidence and audit path | Preserve provenance, policy decision, tool outcome, and retest evidence | Security-critical records | Integrity protection, restricted writes, retention, time synchronization and independent log export |

### 2.2 Network zones

| Zone | Contents | Permitted traffic | Explicitly prohibited |
|---|---|---|---|
| Z0 — Untrusted access | Public internet, browsers, third-party caller systems | HTTPS to public application entry points | Direct database access; direct runner administration; implicit trust from IP location |
| Z1 — Edge / ingress | ELITZE domains, Vercel ingress and platform protections | TLS-terminated requests to intended routes | Direct edge-to-database access outside application runtime; public debug endpoints |
| Z2 — Application / policy | Next.js server routes, authentication/session validation, policy decision point | Validated API calls to data, identity and integration services | Browser-originated arbitrary outbound connections; bypass of server-side policy |
| Z3 — Identity | Customer IdP, ELITZE workforce identity, workload identity issuers | OIDC/SAML redirects and token validation; narrowly scoped token exchanges | Long-lived shared admin credentials; tokens with unvalidated issuer/audience; MFA bypass through alternate APIs |
| Z4 — Data | Neon PostgreSQL and protected object/evidence stores if provisioned | Authenticated TLS from approved application/runner paths; schema migrations from controlled jobs | Direct public end-user database access; broad database owner credentials in app runtime |
| Z5 — Runner / automation | GitHub-hosted or controlled ELITZE runner, build/test jobs | Outbound connections to approved APIs, artifact registry and status callbacks | Unrestricted inbound administration; pull-request code receiving production secrets; shared persistent runner state |
| Z6 — Customer integration | Customer cloud, Kubernetes, source control, directory and MCP endpoints | Explicitly enabled, tenant-scoped API calls using approved credentials | Cross-tenant reuse of credentials; automatic lateral movement; arbitrary internal-network scanning |
| Z7 — Audit / evidence | Application security events, identity logs, cloud audit logs, MCP decisions/results, CI provenance | Append-only or tightly restricted event flow to approved storage/SIEM | Logging secrets, tokens, raw session cookies, unrestricted tool payloads, user-controlled modification of signed evidence |
| Z8 — Administration | Break-glass identities, Vercel/Neon/GitHub/Resend administration | MFA-protected control-plane actions with separate admin identity | Shared administrator accounts; direct routine use of break-glass accounts; unlogged configuration changes |

**Segmentation principle:** these are logical zones and data-flow controls. Do not represent them as dedicated subnets or private links unless the deployed provider configuration proves that such network isolation exists. Vercel-to-Neon traffic may use provider-managed public endpoints protected by TLS and database credentials; verify whether private networking is available and actually configured before claiming private connectivity.

### 2.3 Identity providers and principals

| Principal | Authentication mechanism | Authorization model |
|---|---|---|
| Enterprise human user | Customer IdP via OIDC/SAML; MFA enforced at the IdP; WebAuthn/passkeys preferred for privileged identities | Tenant role plus resource-scoped policy; session age and risk context; reauthentication for destructive/high-impact actions |
| ELITZE owner/admin | Dedicated workforce identity distinct from daily-use identity; phishing-resistant MFA; Conditional Access where supported | Small, separately reviewed admin group; just-in-time elevation; step-up approval; every privileged operation audited |
| Application workload | Provider-issued workload identity/OIDC or short-lived signed identity where supported | One workload identity per app/job and environment; exact audience; short lifetime; explicit resource grants |
| GitHub Actions job | GitHub OIDC plus protected environment/branch claims where provider federation is configured | Per-workflow/per-environment federation; no production secret exposed to untrusted PR jobs; deployment permission separated from test permission |
| ELITZE Runner | Authenticated challenge-response using a scoped runner identity, rotating token, and transport protection | Job-bound authorization; narrow callback scope; anti-replay nonce; expiry; repository/ref/environment binding; deny unknown runner identity |
| MCP server and client | Distinct server identity, client workload identity, and per-tool authorization metadata | Allowlisted server plus named tool/capability and tenant; never infer authorization from a caller-provided server name alone |
| Database application role | Dedicated PostgreSQL role distinct from owner/migration role | Only required schema/table/sequence/function permissions; no routine superuser/owner use; migrations use a separately controlled role |
| Resend transactional-email integration | Sending-only key restricted to verified sender domain | Email sending only; rotation and revocation workflow; no Resend administrative credential in application runtime |

OIDC/SAML providers must be validated against configured issuer, audience, redirect URI, signing keys and protocol state. Map stable identity-provider subject identifiers to a tenant-scoped ELITZE principal; do not use email address alone as an authorization key. Map role and group claims through an explicit allowlist, not an unreviewed claim-to-admin conversion.

## 3. Data-Flow Boundaries

| Flow | From → To | Data allowed | Required checks | Audit evidence |
|---|---|---|---|---|
| F1 — Console access | Browser → edge → Next.js API | Session cookie, request metadata, user input | TLS; CSRF/origin protection for state changes; secure HttpOnly SameSite cookies; schema validation; rate limiting; server-side authorization | Correlation ID, principal, tenant, route, outcome, risk decision; no cookie or bearer token |
| F2 — Login and federation | Browser ↔ ELITZE ↔ enterprise IdP | OIDC/SAML protocol messages and identity claims | State/nonce; issuer and audience; signature; redirect URI; expiry; replay controls; MFA policy | Authentication result, issuer, subject hash/reference, method, MFA context if available, failure reason |
| F3 — Application-to-database | Next.js server → Neon PostgreSQL | Tenant-scoped records, policy, evidence metadata | TLS certificate validation; connection timeout/pool limits; least-privileged DB role; parameterized SQL; tenant predicates or reviewed RLS; migration ledger | Connection/health result, migration version/count, query operation class, latency; never connection strings |
| F4 — Runner handshake/job | GitHub Actions / ELITZE Runner ↔ control-plane API | Short-lived job claims, nonce, decision, status and evidence metadata | OIDC issuer/audience/ref validation; HMAC/signature verification; expiry; nonce replay prevention; repo/environment binding; narrow job permissions | Workflow/run ID, commit SHA, job identity, challenge ID, decision, duration, exit status, artifact hash |
| F5 — MCP discovery and invocation | ELITZE gateway → approved MCP server | Capability metadata, minimal tool input, bounded result | Gateway flag on; exact upstream hostname/port allowlist; resolve once and pin validated public addresses; TLS verification; no redirects; request/response size and absolute timeout; tool/tenant authorization before execution | Server ID, tool name, caller/workload, policy version, decision, approval, input/result hashes or redacted fields, outcome and timestamps |
| F6 — Customer API collection | ELITZE connector → customer AWS/Azure/Entra/GitHub/Kubernetes API | Only data required for the enabled detection/use case | Customer consent; least-privilege read-only scope by default; workload credential; tenant binding; pagination and rate limits; API response provenance and freshness | Provider tenant/account/subscription/cluster reference, scope granted, collection window, counts, pagination marker/coverage and errors |
| F7 — Evidence export | ELITZE evidence service → authorized SIEM/object destination | Signed decision/evidence envelope; minimized event fields | Destination allowlist; scoped write credential; integrity hash/signature; encryption; retry/idempotency; no uncontrolled data egress | Destination identity, delivery ID, signature/hash, acknowledgment, retries and failure state |
| F8 — Email notification | ELITZE server → Resend | Recipient, event category, minimum message content | Verified sender; domain-restricted sending key; rate limits; no password/token in mail body; generic recovery messages to prevent enumeration | Provider message ID, template/event ID, delivery outcome, request correlation; no API key or reset token |

### Mandatory boundary invariants

- A tenant identifier supplied by the client is untrusted. Derive tenant access from the authenticated principal and an authorization decision; verify the requested resource is bound to that tenant.
- A successful login does not grant access to all tenant resources. Authorization is checked on every sensitive route and again immediately before tool execution.
- The policy decision point must return a decision with policy version and reason. Unknown or failed policy evaluation is DENY for sensitive execution.
- Discovery results are observations, not authorization grants. A discovered server/tool must remain blocked until approved.
- Outbound MCP access must be limited to named upstreams. Reject loopback, private, link-local, multicast, reserved and otherwise non-public destination addresses, including IPv4-mapped IPv6; pin the connection to validated DNS results to prevent rebinding.
- Evidence must distinguish attempted, authorized, executed, observed and verified actions. A request being accepted is not proof that a tool ran or that a security control worked.
- Public health responses contain only overall readiness. Detailed configuration, migration and database diagnostics remain authenticated and role-gated.

## 4. Zero-Trust Policy and Control-Plane Design

### 4.1 Request decision sequence

1. **Authenticate:** validate the user or workload identity, issuer, audience, expiry, signature and intended environment.
2. **Bind context:** determine tenant, subject, device/session posture when available, requested resource, tool, operation, data classification, and environmental risk.
3. **Resolve policy:** load versioned tenant and platform policy; validate policy source, version and validity.
4. **Evaluate least privilege:** test role, capability, scope, reachability, data classification, approval and rate limits.
5. **Decide:** ALLOW, DENY, REQUIRE_APPROVAL, or ALLOW_WITH_CONSTRAINTS. Sensitive actions fail closed when policy or evidence is unavailable.
6. **Enforce:** the policy enforcement point at the API/tool boundary applies the decision; UI logic does not enforce security.
7. **Record evidence:** persist request, identity reference, policy version, decision, approver if any, execution outcome, timestamp and evidence digest.
8. **Observe and retest:** detect drift, stale credentials, unapproved reachability, policy bypass attempts and failed/partial collection.

### 4.2 Policy examples

| Action | Default | Conditions for authorization |
|---|---|---|
| Read own tenant inventory | DENY until authenticated | Valid session, active tenant membership, read role, resource tenant matches |
| Read another tenant’s data | DENY | No cross-tenant exception by default; any approved support access must be time-bound, scoped, recorded and reviewed |
| Change policy or connector configuration | REQUIRE_APPROVAL for privileged configuration | Admin role, step-up authentication, change reason, validated diff, audit event |
| Invoke a sensitive MCP tool | DENY / REQUIRE_APPROVAL | Gateway and execution explicitly enabled; approved upstream/tool; valid workload identity; tenant binding; policy ALLOW; approval where required |
| Run runner job against customer target | DENY until approved | Authorized scope, customer consent, job-bound short-lived identity, allowlisted target, rate/time bounds and evidence output |
| Export evidence externally | DENY until configured | Approved destination, minimized data, tenant authorization, scoped credential, successful signature and audit event |
| Rotate/revoke key | REQUIRE_APPROVAL or break-glass workflow | Privileged identity, step-up MFA, change ticket, dependent-service inventory, audit and post-rotation validation |

## 5. STRIDE Threat Model

STRIDE categories are applied to the trust boundaries above. Ratings are initial architecture ratings, not measured incident probabilities. Likelihood and impact use a 1–5 scale; inherent score = likelihood × impact. Residual risk is conditional on controls being deployed and evidence passing acceptance tests.

| STRIDE category | Threat scenario | Primary assets / boundaries | Example impact | Required preventive and detective controls |
|---|---|---|---|---|
| **Spoofing** | Attacker uses stolen cloud identity, session cookie, forged workload claim, or replayed runner challenge to impersonate a user or agent | IdP, console session, runner API, MCP caller identity | Unauthorized console/admin access; forged tool calls; false evidence attribution | Phishing-resistant MFA; session rotation/revocation; strict OIDC/SAML validation; workload token expiry/audience binding; nonce-based anti-replay; mTLS where supported; anomalous sign-in and runner-auth alerts |
| **Tampering** | Attacker alters tool arguments/results, policy documents, evidence records, CI artifacts, or connector configuration | MCP gateway, policy service, DB, CI/CD, evidence pipeline | Policy bypass; poisoned inventory; falsified control evidence; untrusted deployment | Server-side canonicalization; signed artifact provenance; protected branches/environments; DB integrity constraints; append-only/tamper-evident audit; immutable policy versions; content hashes/signatures and validation |
| **Repudiation** | Operator or compromised workload denies a privileged decision, tool invocation, export, or policy change | Administration APIs, MCP calls, runner and evidence records | Inability to investigate, prove authorization, or reconstruct impact | Central time-synchronized logs; immutable actor/workload IDs; correlation IDs; decision and policy version; signed evidence; log retention and restricted log administration |
| **Information Disclosure** | Cross-tenant query, verbose API error, secret-bearing logs, overly broad RAG retrieval, evidence export, or compromised DB credential exposes confidential information | Tenant data zone, API responses, RAG, logs, backups and integrations | Customer data breach, credential exposure, regulatory impact | Tenant authorization and database boundary controls; data minimization; TLS; encryption at rest; redaction; scoped DB role; DLP/content filtering where appropriate; access and export alerts; backup access controls |
| **Denial of Service** | Request flood, expensive query, oversized MCP response, slow upstream, connection exhaustion, or retry storm exhausts compute or DB pool | Edge, Next.js APIs, Neon, gateway, email integration | Unavailable health/API; delayed or lost security events | Per-identity/tenant rate limits; bounded body/response size; absolute deadlines; quotas; bounded concurrency; backpressure; pool limits; circuit breakers; idempotency; availability alarms and tested recovery |
| **Elevation of Privilege** | Low-privilege user changes tenant/role fields, abuses confused-deputy tool access, manipulates claims, or uses an overprivileged runner/DB identity | Authentication, authorization, policy evaluation, DB and automation | Cross-tenant admin access, arbitrary tool execution or broad data modification | Server-derived tenant context; deny by default; per-action authorization; step-up/dual control; least-privileged DB and runner roles; just-in-time roles; authorization regression tests; privileged action alerts |

### 5.1 Architecture-specific abuse cases

- **MCP confused deputy:** a trusted ELITZE service is induced to call an attacker-controlled or unintended upstream on behalf of a caller. Controls: upstream registry, exact host/port allowlist, validated public DNS with pinned addresses, capability allowlist, tenant-bound policy, approval for sensitive tools, no automatic redirect, and clear attribution of caller versus service identity.
- **DNS rebinding / SSRF:** a configured hostname resolves to a prohibited address or changes between validation and connection. Controls: validate every address in the answer, reject special-use IPv4/IPv6, pin outbound HTTPS to the vetted answer, enforce TLS verification and absolute request deadline, and alert on blocked resolutions.
- **Evidence spoofing:** a caller reports success without an observed result. Controls: separate decision from execution result, record source and timestamp, bind evidence to request and policy version, and do not mark a finding resolved without a verified retest.
- **Cross-tenant leakage:** an API accepts a caller-controlled tenant ID or a query omits tenant scope. Controls: principal-to-tenant binding, repository/query-layer enforcement, negative tests across every read/write/export path, and database-level row security where compatible and proven.
- **Pipeline trust abuse:** code from an untrusted pull request reaches deployment credentials or a privileged persistent runner. Controls: separate CI and release identities, protect environments, use short-lived OIDC trust, prohibit production secrets in untrusted PR workflows, isolate runner state, pin third-party actions, and verify artifact provenance.

## 6. Five Critical Risk Paths — Ranked

Ranking is an architecture assessment using likelihood (L) and impact (I) from 1 to 5. It should be recalibrated from incident, telemetry and penetration-test evidence. Control effectiveness is not assumed until a test passes.

| Rank | Risk path | L × I | Critical assets | Why it matters | Primary reduction objective |
|---|---|---:|---|---|---|
| **1** | Compromised human identity or stolen session → privileged console/API → policy/connector change → unauthorized access | 4 × 5 = **20** | Identity provider, sessions, tenant policy, integrations | Cloud identities and sessions can bridge SaaS and hybrid environments; a privileged identity can change multiple controls | Phishing-resistant MFA, short sessions for admin work, step-up auth, JIT admin, strong token validation, complete admin audit |
| **2** | Unapproved or malicious MCP upstream / DNS rebinding → gateway server-side request → sensitive tool invocation → internal-resource exposure or destructive action | 4 × 5 = **20** | MCP gateway, customer environment, secrets and data | A gateway is a high-impact deputy between an authenticated user/agent and reachable tools | Keep execution off by default, explicit upstream allowlist, address pinning, tool-level policy and approval, bounds on size/time, red-team regression suite |
| **3** | API/query authorization gap → cross-tenant read or write → evidence and customer records exposed or modified | 4 × 4 = **16** | Neon data plane, user/tenant data, evidence records | UI filters and authenticated sessions do not guarantee object-level authorization; a missing tenant predicate can expose many records | Principal-derived tenant context, per-query tenant enforcement, RLS assessment/enforcement where feasible, broad negative test coverage, export auditing |
| **4** | Overprivileged or compromised CI/runner identity → code/artifact/job manipulation → trusted deployment or customer-side action | 3 × 5 = **15** | GitHub repo, runner, deployment secrets, customer integrations | CI and runners can be an alternate path into production even when web login is secure | OIDC with strict claims, protected environments, isolated/ephemeral runners, signed provenance, scoped job tokens, separate deploy approvals |
| **5** | Overbroad RAG/API/log/evidence access → sensitive retrieval or export → external exfiltration | 4 × 3 = **12** | RAG documents/chunks, audit data, integration results, exports | Aggregated evidence can contain sensitive topology, identity relationships or customer-specific information | Tenant-aware retrieval, source ACL inheritance, output minimization, secret/PII redaction, export allowlist, access anomaly and volume alerts |

**Availability risk to track alongside the top five:** request floods, long-running upstreams or query storms can make the application and evidence pipeline unavailable. Initial rating is L=3, I=3 (9). Apply rate limits, absolute deadlines, response caps, pool/concurrency limits, retries with jitter and circuit breakers; test these under safe load.

## 7. Technical Control Mapping — Top Five Paths

Controls below map to relevant NIST SP 800-53 Rev. 5 families/control identifiers and CIS Critical Security Controls v8.1 safeguards. Exact implementations and benchmark levels must be selected for each customer’s environment and documented in the control evidence. This table is a design mapping, not a claim of certification or benchmark conformance.

| Risk path | Technical controls and enforcement point | IAM least privilege | Encryption at rest / in transit | Logging and alerting | NIST SP 800-53 Rev. 5 mapping | CIS alignment / validation |
|---|---|---|---|---|---|---|
| **R1 — Identity/session compromise** | Enforce OIDC/SAML issuer, audience, signature, state, nonce and redirect validation. Require phishing-resistant MFA for admins. Rotate and revoke sessions after privilege changes. Secure cookie flags, CSRF protection, session age and reauthentication. Use JIT admin and dual approval for policy/key changes. | Separate owner/admin from daily accounts; no shared admin; group-to-role mapping allowlist; least-privileged support access; dedicated break-glass path; quarterly entitlement review | TLS 1.2+ minimum, TLS 1.3 preferred. Cookies Secure/HttpOnly/SameSite. Store password hashes with a modern password-hashing function. Encrypt sensitive MFA/recovery material using AES-256-GCM or equivalent; KMS/secret-manager-held key with rotation and access audit. Provider-managed database/storage encryption at rest | IdP sign-in and MFA outcomes, token failures, new devices where available, session revocation, role change, privileged action, JIT grant/revoke. Alert on impossible travel/risk signals where IdP provides them, unusual admin grants, repeated failures and changes outside approved windows | AC-2, AC-3, AC-5, AC-6, IA-2, IA-5, IA-8, AU-2, AU-6, AU-12, SC-23, SI-4 | CIS 5 Account Management; CIS 6 Access Control Management; CIS 8 Audit Log Management; selected CIS Entra/Azure/Microsoft 365 identity benchmark recommendations. Validate all admin paths with MFA/session-expiry and privilege-escalation tests |
| **R2 — MCP upstream/tool abuse** | Gateway off by default. Exact approved hostname/port and tool/capability allowlist. Validate all DNS answers against reserved/private/special-use ranges and pin the connection to validated addresses. Verify TLS certificate; reject redirects; accept supported content types only; cap request/response bytes; enforce inactivity timeout and absolute deadline; egress filter; human approval on high-impact tool calls | One identity per server, client and job; narrow capability grants; read-only by default; no generic shell/admin tool grants; short-lived upstream credentials; per-tenant credential isolation; immediate revoke path | TLS 1.2+ minimum/1.3 preferred to upstreams; verify certificates. Envelope/application encryption for persisted sensitive tool material where required using AES-256-GCM. Encrypt database, logs and backups at rest using provider-managed encryption; keys separated from data and runtime logs | Record request ID, tenant, caller/workload identity, server/tool, validated hostname and address class (not credentials), policy version, decision, approval, duration, response status/size, timeout/redirect/blocked-IP outcome, observed-result hash. Alert on blocked private addresses, new upstream, tool scope changes, deny spikes and repeated timeouts | AC-3, AC-6, AC-17, AU-2, AU-3, AU-6, AU-9, AU-12, SC-7, SC-8, SC-13, SC-18, SC-23, SI-4, SI-7 | CIS 4 Secure Configuration; CIS 6 Access Control Management; CIS 8 Audit Log Management; CIS 12 Network Infrastructure Management; CIS 13 Network Monitoring and Defense; applicable Kubernetes/cloud workload benchmark. Test DNS rebinding, IPv4/IPv6 special-use addresses, redirect rejection, response caps, deadline and approval bypass |
| **R3 — Cross-tenant data access** | Bind tenant to authenticated principal server-side. Require tenant authorization in every repository method and API route. Apply PostgreSQL RLS where the application design and connection role support safe policies; use FORCE ROW LEVEL SECURITY when appropriate and test table-owner/bypass behavior. Separate migrations/owner from runtime role. Parameterize SQL; restrict exports and retrieval joins. | App role has only needed SELECT/INSERT/UPDATE/DELETE and sequence/function grants; never owner/superuser for request traffic. Connector credentials are per tenant. Support role is scoped, time-bound, approved and fully audited | TLS with certificate validation for application-to-PostgreSQL. AES-256/provider-managed at-rest encryption for DB, backups and exports. Field-level encryption for highly sensitive values; never put secrets/tokens in audit payloads. Use key versioning and recovery testing | Tenant ID from authorization context, resource tenant, actor, route/operation, deny result, export request/destination, RLS policy changes and role grants. Avoid logging row content. Alert on cross-tenant mismatch, unusual row/export volume, new grants and queries outside normal tenant scope | AC-3, AC-4, AC-6, AC-20, AU-2, AU-6, AU-9, SC-4, SC-8, SC-12, SC-13, SC-28, SI-4 | CIS 3 Data Protection; CIS 6 Access Control Management; CIS 8 Audit Log Management; CIS 16 Application Software Security; applicable CIS PostgreSQL/cloud data-service baseline. Require negative tests for every tenant-sensitive API, job, RAG retrieval and export route |
| **R4 — CI/runner compromise** | Use GitHub OIDC federation to cloud/deployment where supported; bind trust to exact repo, branch/tag, workflow, audience and environment. Protect default/release branches and environments; pin actions to immutable commit SHA; require review for workflow/deployment changes; isolate ephemeral runners; prevent untrusted PR jobs from receiving production secrets; sign and verify build attestations/SBOM | Separate validation, staging and production identities. Test jobs get read-only repository permissions. Release job gets narrowly scoped deploy rights only after checks pass. Customer-target operations require separate per-job scope and consent. No broad long-lived cloud access key | TLS 1.2+/1.3 for API and artifact transfer. Encrypt CI secrets at rest via provider secret store. Sign release artifacts and provenance; verify digests before promotion. Keep database/messaging secrets out of artifacts and logs | Workflow run/commit/ref, job identity, token exchange outcome, permission set, approval, artifact digest, SBOM digest, deployment ID, runner challenge/nonce result and job exit. Alert on workflow permissions changes, new actions, unusual secret access, runner reuse and deployment outside release policy | AC-2, AC-6, IA-5, CM-2, CM-6, CM-8, AU-2, AU-6, AU-9, AU-12, SA-10, SA-11, SA-15, SI-7, SR-3, SR-5 | CIS 4 Secure Configuration; CIS 5/6 identity and access; CIS 8 logging; CIS 16 secure development; CIS 17 incident response; CIS 18 penetration testing. Validate untrusted PR cannot access production secret or deploy |
| **R5 — RAG/log/evidence disclosure** | Enforce tenant and source-document ACLs at retrieval time, not only ingest time. Separate metadata and content access. Minimize PII/secrets in indexing. Redact headers, tokens and high-risk fields at logging boundary. Apply export destinations/allowlists and configurable retention; require approval for bulk export. Treat retrieved content as untrusted data, not instructions. | Read access inherited from source system and tenant; retrieval service gets only the required collections; export identity separate from query identity; no broad shared integration token; temporary approved support access | TLS 1.2+/1.3 for API, SIEM and export destinations. Provider encryption at rest for database, vector/search store, log destination and backups. Use AES-256-GCM or equivalent for sensitive field/payload encryption where needed; segregate encryption keys and access logs | Queries with caller/tenant, source IDs, document ACL decisions, retrieval count, sensitivity label, export destination and volume, redaction rule results, evidence hash and denied read. Alert on large downloads, rare source access, ACL mismatch, repeated denial probing, prompt-injection indicators and outbound destinations not allowlisted | AC-3, AC-4, AC-6, AU-2, AU-3, AU-6, AU-9, AU-11, AU-12, SC-7, SC-8, SC-28, SI-4, SI-7, PT-2/PT-3 where PII is processed | CIS 3 Data Protection; CIS 6 Access Control Management; CIS 8 Audit Log Management; CIS 13 Network Monitoring and Defense; CIS 16 Application Software Security. Validate source ACLs, tenant-aware retrieval, redaction and export-denial tests |

### 7.1 Cross-cutting cryptographic baseline

- **Transport:** TLS 1.2 or higher, with TLS 1.3 preferred where both ends support it. Disable obsolete TLS versions and weak cipher suites. Verify server certificates; do not turn off TLS verification to resolve a connection failure.
- **Database connections:** TLS with hostname/certificate validation. Use provider-managed encryption at rest, encrypted backups, restricted administrative access and rotation of access credentials.
- **Application secrets:** store only in a deployment secret manager or dedicated KMS/secret manager; never in source control, browser variables, tickets or ordinary logs. Separate production and preview values. Scope and rotate credentials after personnel, provider or trust-boundary changes.
- **Sensitive application data:** use authenticated encryption such as AES-256-GCM for fields that require application-layer encryption; include key versioning, authentication-tag verification, rotation and recovery testing. Do not invent encryption for fields without a classified need.
- **Evidence integrity:** hash or sign evidence envelopes; include source, tenant, timestamp, request/decision IDs and schema version. Integrity protection does not by itself prove the source was trustworthy; provenance must also be established.

## 8. Four-Stage MITRE ATT&CK Adversary Scenario

**Purpose:** defensive tabletop and detection-engineering scenario for an authorized test tenant. The scenario identifies attack techniques and defensive gaps; it does not provide exploit payloads, instructions to compromise accounts, or directions to access real customer systems. Run emulation only in a scoped lab with written authorization.

| Stage | ATT&CK technique(s) | Adversary objective and modeled path | Defensive gaps to test | Prevention and detection |
|---|---|---|---|---|
| **1. Initial access / identity compromise** | [T1566.002 — Spearphishing Link](https://attack.mitre.org/techniques/T1566/002/); [T1078.004 — Valid Accounts: Cloud Accounts](https://attack.mitre.org/techniques/T1078/004/) | In the tabletop, a targeted administrator is deceived into authorizing a malicious sign-in or an existing cloud identity/session is assumed compromised. The objective is a valid session, not malware execution. | Are admin identities protected by phishing-resistant MFA? Are OAuth consent grants restricted? Can risk-based login alerts be received and correlated? Are sessions invalidated after role or credential changes? | Enforce Conditional Access/MFA; limit third-party OAuth consent; use session-age and step-up controls; detect unusual sign-ins, consent grants and new privileged sessions; test user/session revocation |
| **2. Discovery and token pivot** | [T1526 — Cloud Service Discovery](https://attack.mitre.org/techniques/T1526/); [T1550.001 — Application Access Token](https://attack.mitre.org/techniques/T1550/001/) | The simulated actor uses only a lab identity to enumerate authorized cloud/application surfaces and attempts to reuse a short-lived application token outside its intended audience or job. | Are service/API enumerations logged? Does each token have strict issuer, audience, expiry and scope? Can a token intended for one API be replayed at another? Are overbroad tenant and cloud roles visible? | Grant narrow audience-bound tokens; short TTL and revocation; separate per-service identities; detect unusual directory/cloud enumeration, consent/role changes and token use from unexpected client/workflow |
| **3. Abuse of an integration or tool boundary** | [T1190 — Exploit Public-Facing Application](https://attack.mitre.org/techniques/T1190/) where a real vulnerability is validated; [T1078.004 — Valid Accounts: Cloud Accounts](https://attack.mitre.org/techniques/T1078/004/) for authorized-account abuse | In the lab, test whether a low-privilege caller can make an API or configured MCP connector perform an unauthorized action, cross a tenant boundary, reach a prohibited destination, or bypass approval. MCP-specific behavior may not map cleanly to one ATT&CK technique; record it as a test-specific sub-technique and link the closest ATT&CK behavior instead of mislabeling it. | Can client-supplied tenant/resource IDs override server authorization? Can an unapproved hostname be reached? Does DNS validation remain pinned? Are redirects and slow/oversized responses rejected? Can a tool call run when gateway/execution flags are false? | Default-off execution; explicit host/tool allowlists; private/special-address rejection; DNS pinning; request and response limits; absolute deadline; policy check immediately before execution; approval for high-impact actions; deny and alert on all prohibited probes |
| **4. Collection, exfiltration attempt and response** | [T1213 — Data from Information Repositories](https://attack.mitre.org/techniques/T1213/); [T1567.002 — Exfiltration to Cloud Storage](https://attack.mitre.org/techniques/T1567/002/) | The lab actor attempts to retrieve a small, seeded, non-sensitive canary record across a forbidden boundary, then attempts a blocked export to an unapproved destination. No real customer information is used. | Does retrieval enforce source ACL and tenant scope? Are bulk/rare queries detected? Are outbound destinations limited? Can analysts reconstruct the attempted sequence and prove the deny decision? | Per-tenant retrieval enforcement; source ACL inheritance; export allowlist; payload minimization/redaction; volume anomaly detections; immutable event chain; alert triage, token revocation, connector disablement and retest |

### Emulation guardrails

- Use a dedicated test tenant, seeded canary record, synthetic identity, and a controlled mock or staging MCP server.
- Scope the target and time window in writing. Do not phish real staff, test credential reuse against real tenants, scan customer networks, or invoke destructive tools.
- Demonstrate a **blocked** attack path and preserve the deny evidence. A control is not considered proven merely because the test payload did not produce visible effects.
- Stop and investigate if a test reaches a real customer endpoint, accesses non-test data, changes production configuration, or causes service degradation.
- ATT&CK mappings describe behavior categories; they do not prove that a specific threat group has targeted ELITZE.

## 9. Logging, Detection and Incident Response

### 9.1 Minimum event envelope

Every security-relevant event should include:
- UTC event time plus ingestion time, with time source/clock health monitored.
- Event ID, correlation ID, tenant ID, actor principal, workload/server identity and authentication context.
- Resource type and stable resource reference; avoid copying sensitive resource content into the event.
- Action, decision, policy version, reason code, approval reference, result state, and elapsed time.
- Source provider/account/cluster reference, integration identifier, collection coverage and freshness where applicable.
- Evidence digest/signature and schema version where the event is intended to prove a control or outcome.

Never log passwords, raw session cookies, bearer tokens, API keys, database connection strings, private keys, recovery codes, or entire sensitive tool arguments/results. Use redaction at the source, not only at the SIEM. Protect log administration separately from application administration and alert on log disablement, retention reduction, signer/key changes, and unexplained telemetry gaps.

### 9.2 High-value detection rules

| Detection | Example trigger | Response |
|---|---|---|
| Privilege escalation | Role/grant change, new admin, MFA downgrade, unusual JIT grant or unapproved approval | Revoke session/token, suspend grant, validate with IdP logs, preserve audit evidence |
| Runner trust anomaly | Workflow/ref/audience mismatch, replayed challenge, unexpected repository, untrusted PR requesting production secret | Deny job; revoke runner credential; pause affected environment; review commit and artifacts |
| MCP destination violation | Private/reserved IP, changed DNS answer, unapproved host/port, redirect, unexpected TLS identity | Block request; preserve address-class and policy decision; disable affected integration pending review |
| Tool authorization violation | High-risk tool denied then retried, approval bypass attempt, tool/capability changed without review | Deny and rate-limit; alert policy owner; compare registry, policy versions and approval records |
| Cross-tenant attempt | Principal/tenant mismatch, repeated object-ID probing, query/export scope mismatch | Deny; alert tenant-security owner; review neighboring reads/writes using the same correlation/identity |
| Data access anomaly | Abrupt increase in retrieval/export volume, uncommon source collection, unapproved destination | Stop export, revoke scoped credential if warranted, preserve hashes and minimal metadata |
| Availability degradation | Elevated 429/5xx, connection-pool saturation, upstream deadlines, repeated retry storm | Rate-limit/backpressure; open circuit; preserve service telemetry; use approved recovery plan |

### 9.3 Response sequence

1. **Contain:** revoke the affected session or workload token; disable the implicated connector/tool or runner; apply rate limits; do not turn off audit controls.
2. **Preserve:** retain immutable logs, signed evidence digests, policy versions, workflow/run IDs, deployment SHA and timeline.
3. **Scope:** identify principal, tenant, resources, tool calls, export destinations, and the period between first anomalous event and containment.
4. **Eradicate:** remove unauthorized grants/integrations, rotate affected credentials, patch configuration/code, and validate artifacts.
5. **Recover:** restore only from verified state; verify database migration ledger and runtime health; use approved rollback/redeployment controls.
6. **Prove:** rerun the exact negative and positive tests, record fresh evidence, and leave unresolved coverage explicitly UNKNOWN/UNMEASURABLE.

## 10. CIS and NIST Baseline

### NIST SP 800-207 — Zero Trust Architecture
Use resource-centric access, policy decision/enforcement points, continuous evaluation and no implicit trust based on network location. See [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final).

### NIST SP 800-53 Rev. 5 — Security and Privacy Controls
Apply the control families/IDs listed in the technical mapping, tailoring control implementation to the deployment and customer risk. The primary catalog is [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final).

### CIS Critical Security Controls v8.1
Use the safeguards related to data protection, account management, access control management, secure configuration, audit log management, network infrastructure, network monitoring and defense, application software security, incident response and penetration testing. Reference: [CIS Controls v8.1](https://www.cisecurity.org/controls/v8-1).

### Platform CIS Benchmarks
Select and record the applicable current benchmarks per actual platform:
- AWS: CIS Amazon Web Services Foundations Benchmark and relevant service benchmark(s).
- Azure/Entra/Microsoft 365: the relevant Azure Foundations, Microsoft Entra ID and Microsoft 365 Foundations benchmarks.
- Kubernetes and node OS: the matching CIS Kubernetes Benchmark and Linux distribution benchmark.
- PostgreSQL: a PostgreSQL benchmark appropriate to the deployed major version and managed service constraints.
- Vercel and other hosted SaaS: use available provider configuration controls, provider audit logs and customer security requirements; do not claim a CIS Benchmark exists or has passed unless an applicable benchmark was actually executed.

For each selected benchmark, record the exact benchmark title/version, assessment date, assessed environment, exclusions, findings, evidence links and remediation owner. Controls mapped in this document are design targets, not a compliance certificate.

## 11. Product-Readiness and Deployment Acceptance Gates

Mark a gate PASS only with reproducible evidence from the exact commit/environment. A green static build is necessary but not sufficient.

| Gate | Acceptance criterion | Evidence required |
|---|---|---|
| Code provenance | Reviewed commit SHA, protected branch and successful required CI checks | GitHub commit/PR URL, check runs, dependency audit, SBOM/artifact digest |
| Application deployment | Production deployment READY for the intended commit and aliases resolve to it | Vercel deployment ID, commit SHA, alias state |
| Runtime readiness | Public health returns HTTP 200 with ready state; authenticated health verifies database/configuration | Timestamped endpoint response; no secrets in output |
| Database connection | Application connects to the intended Neon branch/database using verified TLS and a least-privileged runtime role | Successful live query from deployed runtime; connection/config source; no connection string in evidence |
| Migration parity | Expected repository migrations equal applied migration ledger; no missing or unexplained duplicate/order mismatch | Clean migration job and authenticated database verification |
| Tenant boundary | Cross-tenant read/write/export attempts are denied across API, RAG, runner and integration paths | Automated negative-test suite with request and denial evidence; RLS review where applicable |
| Identity/security | OIDC/SAML validation, MFA/step-up, session expiry/revocation, recovery and role mapping pass | Authentication E2E and authorization matrix results |
| MCP boundary | Gateway and execution default off; approved test upstream passes DNS pinning and policy tests; prohibited addresses/redirects/timeouts are blocked | MCP upstream self-test; approved staging configuration; captured policy and transport results |
| Audit/evidence | Security actions have complete actor, tenant, policy version, result and integrity/provenance fields | Evidence schema test, log access controls and export-destination test |
| Recovery | Restore/rollback procedure has been exercised; token revocation and incident containment paths verified | Recovery exercise record and post-recovery health/test output |
| Benchmark evidence | Required selected CIS benchmarks and NIST control assessment are recorded with version and owner | Benchmark reports, exceptions and mapped evidence register |

### Current readiness disposition

As observed on 2026-10-16, the production deployment for commit 55741a1706c2459aa633407fefab9016254a1db5 is READY at the Vercel deployment layer. The last direct request to the public health endpoint returned HTTP 503 with an unavailable state. The service must therefore remain **runtime readiness UNVERIFIED** until health returns 200 and the application’s authenticated database/configuration check proves the expected connection, migration parity and required configuration in the deployed runtime.

The inspected default Neon main/neondb database had 33 migration-ledger entries through 0032_validation_kinds.sql. The inspection also found 0 of 133 public tables with RLS enabled and 0 public RLS policies. Before calling tenant isolation production-ready, implement or formally justify database-level safeguards, and pass exhaustive tenant boundary tests for all APIs, RAG, integrations, tools and exports. Do not treat the presence of a tenant_id column or UI filtering as sufficient proof.

The MCP gateway and execution flags must remain false until an approved upstream hostname/tool scope is configured and a harmless staging end-to-end test passes. No customer-facing integration should be labelled LIVE or VERIFIED from adapter code alone.

## 12. Implementation Sequence

### Phase A — Contain trust and establish evidence
1. Keep MCP execution off; confirm production and preview environment separation and the exact production aliases/commit.
2. Restore and verify production database/secrets configuration with the secret manager; validate runtime health from the deployed app.
3. Capture a baseline for identity, roles, database grants, routes, logs, network egress and configured integrations.

### Phase B — Close identity and tenant controls
1. Complete role/permission inventory for every human, service, runner, connector and database principal.
2. Implement tenant authorization in the shared data-access/repository layer; design and test RLS policies where appropriate.
3. Test authentication, authorization, session revocation, export controls and tenant-bound retrieval.

### Phase C — Harden integrations and tool execution
1. Keep connector discovery separate from activation. Require consent, exact endpoint allowlists, credential scope and collection freshness.
2. Run DNS/address, timeout, redirect, body-size, replay, capability and approval-bypass regression cases.
3. Exercise the four-stage lab scenario against a seeded test tenant and capture detections and deny evidence.

### Phase D — Operate, verify and attest
1. Ship central security event export with integrity protection, retention and protected log administration.
2. Implement runbooks and test revocation, containment, rollback and recovery.
3. Record applicable CIS Benchmark versions, NIST control mappings, exceptions and owners.
4. Re-run the full release gates and prove runtime health. Promote a feature or connector only after evidence passes.

## 13. References

- NIST SP 800-207, Zero Trust Architecture: https://csrc.nist.gov/pubs/sp/800/207/final
- NIST SP 800-53 Rev. 5, Security and Privacy Controls: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final
- CIS Critical Security Controls v8.1: https://www.cisecurity.org/controls/v8-1
- MITRE ATT&CK Enterprise techniques: https://attack.mitre.org/techniques/enterprise/
- ATT&CK T1566.002, Spearphishing Link: https://attack.mitre.org/techniques/T1566/002/
- ATT&CK T1078.004, Valid Accounts: Cloud Accounts: https://attack.mitre.org/techniques/T1078/004/
- ATT&CK T1526, Cloud Service Discovery: https://attack.mitre.org/techniques/T1526/
- ATT&CK T1550.001, Application Access Token: https://attack.mitre.org/techniques/T1550/001/
- ATT&CK T1190, Exploit Public-Facing Application: https://attack.mitre.org/techniques/T1190/
- ATT&CK T1213, Data from Information Repositories: https://attack.mitre.org/techniques/T1213/
- ATT&CK T1567.002, Exfiltration to Cloud Storage: https://attack.mitre.org/techniques/T1567/002/

**Use limitation:** this architecture is a deployment baseline and threat-model artifact. It does not itself prove the live system meets every control. Runtime evidence, customer-specific scope, configuration state, threat assumptions, and benchmark outcomes must be recorded separately and refreshed after material changes.
