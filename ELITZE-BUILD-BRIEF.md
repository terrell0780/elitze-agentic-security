# ELITZE — Frontier Security Operating Platform Build Brief

## Mission

Build ELITZE into a polished, enterprise-grade cybersecurity operating platform that consolidates fragmented security tooling into one cohesive operating surface.

The finished product must be beautiful, mobile-friendly, fast, accessible, secure, useful, and deployable on the selected production runtime.

## Brand

- Product brand: **ELITZE**
- Spatial security product: **ELITZE Global Security**
- Use ELITZE terminology consistently across UI, pages, routes, metadata, assets, APIs, and documentation.
- Do not use legacy product names.
- Do not use unrelated third-party branding.
- Preserve the existing useful security capabilities.

## User experience

### Landing page

The landing page is a concise product and sales surface—not a book.

It should contain:

- Strong ELITZE value proposition
- Premium cybersecurity visual system
- Animated ELITZE Global Security globe
- Short capability overview
- Security graph preview
- Clear evidence/policy/identity story
- Customer-oriented calls to action
- Trust, privacy, and authorization messaging
- Excellent mobile layout

Long-form readable material belongs in organized tabs and pages:

```text
Platform
Security
Global Security
Agents
Identity
Cloud
Data
Integrations
About
Resources
Contact
```

Interactions belong on the relevant product pages, not buried in long copy.

## Visual system

Use ELITZE-native cybersecurity visuals:

- Animated 3D-style globe
- Security graph relationships
- Identity and agent nodes
- Cloud and API paths
- Data-flow visualizations
- Threat paths
- Policy decisions
- Evidence receipts
- Scan progress and source health
- Authorized connector states
- Dark and light theme support
- Touch-friendly mobile interactions
- Responsive charts, tables, and controls

Visuals must communicate:

```text
visibility · identity · control · evidence · protection · authorized action
```

Do not use generic stock images or decorative visuals that do not communicate security value.

## Platform architecture

### Shared data fabric

Ingest and normalize authorized telemetry from:

- Endpoints
- Networks
- Clouds
- Identity providers
- Email systems
- Agents
- APIs
- MCP tools
- Data stores
- Vulnerability sources
- Threat-intelligence feeds
- Approved camera/sensor connectors

Every event needs:

- Tenant
- Source
- Event ID
- Identity context
- Asset context
- Zone/domain
- Timestamp
- Provenance
- Freshness
- Normalized type
- Severity
- Evidence reference

### Unified command surface

Provide one operational experience for:

- Assets
- Users
- Agents
- Workloads
- Tools
- APIs
- Cloud resources
- Findings
- Incidents
- Policies
- Evidence
- Connectors
- Audit events

### Shared policy engine

Policies must be reusable across:

- Identity
- Agents
- Tools
- APIs
- Cloud
- Data
- Endpoints
- Network paths
- Camera/sensor connectors
- Automated responses

Support:

- Versioning
- Simulation
- Approval workflows
- Rollback
- Tenant boundaries
- Role-based access
- Evidence for decisions

### Cross-domain response

Correlate multi-stage activity such as:

```text
phishing signal
→ malicious download
→ identity anomaly
→ agent/tool misuse
→ lateral movement attempt
→ governed response
```

High-impact responses require policy authorization and, when configured, human approval.

## IONOS-compatible operating core

The IONOS-native build should support PHP 8+, MySQL/MariaDB, webspace, and cron.

Required components:

### File isolation engine

Implement:

```text
acquire_platform_lock()
release_platform_lock()
```

Use `flock()` and bounded waits. Prevent overlapping cron jobs and concurrent state corruption.

### Persistent shared fabric manager

Implement:

```text
load_state()
save_state()
```

Use atomic temporary-file replacement if flat-file state is used. Production state should use durable database records where appropriate.

### Normalized telemetry pipeline

Implement:

```text
ingest_signal()
```

Validate, authenticate, normalize, deduplicate, enrich, audit, and persist incoming signals.

### Multi-vector evaluator

Implement:

```text
evaluate_and_orchestrate()
```

Correlate identity, asset, zone, source, and event history. Apply an explainable risk score and identify multi-vector attack chains.

### Governed containment

Implement:

```text
_execute_automated_containment_playbook()
```

Only execute authorized, policy-approved actions. Support reversible playbooks, approval gates, audit evidence, and connector health checks.

### Cleanup and retention

Implement a cron-safe cleanup worker that:

- Uses the platform lock
- Applies retention rules
- Preserves open-incident evidence
- Audits removals
- Handles corrupted state safely
- Runs on an IONOS cron schedule

### HTTP POST ingress

Implement a secure alert-feed endpoint with:

- HTTPS requirement
- API key or signed-request authentication
- Timestamp and replay protection
- Request-size limits
- JSON schema validation
- Rate limiting
- Idempotency keys
- Tenant/source authorization
- Audit trail
- Safe `202` response behavior
- No direct containment from an untrusted request

## Security requirements

Scan and validate all of:

- Dependencies and lockfiles
- Source code
- APIs
- Request bodies
- Authentication
- Sessions
- Authorization
- Database schema and migrations
- Secrets and configuration
- CSP and security headers
- XSS/CSRF/injection
- SSRF and unsafe outbound requests
- File uploads and path traversal
- Rate limits
- Cron workers
- Integrations
- CI/CD configuration
- Public assets and metadata
- Deployment configuration

Every scan must report one of:

```text
CLEAN
FINDINGS
BLOCKED
UNSCANNED
INCONCLUSIVE
```

Never convert an unavailable scan into a clean result.

## Authorized continuous operations

Provide scheduled, evidence-backed monitoring for:

- CVEs and advisories
- Dependency changes
- Threat intelligence
- Attack-surface changes
- Connector health
- Capability drift
- Policy drift
- New asset exposure
- Security regression tests

“24/7” means authorized scheduled or continuously running monitoring. Do not scan or access systems without permission. Do not discover or access arbitrary public cameras.

## Honest capability model

Use explicit implementation states:

```text
IMPLEMENTED_VERIFIED
IMPLEMENTED
PARTIAL
BLOCKED
PLANNED
UNSCANNED
INCONCLUSIVE
```

The capability endpoint and function inventory must use one shared evidence model.

## Google-ready web standards

- Mobile-first performance
- HTTPS
- Correct titles and descriptions
- Canonical URLs
- Sitemap
- Robots policy
- Structured data where appropriate
- Accessibility
- Core Web Vitals
- Clear navigation
- No keyword stuffing
- No hidden deceptive content
- Accurate product claims
- Privacy, security, terms, and contact pages

## Acceptance criteria

The build is complete only when:

1. The public site loads successfully on the production domain.
2. The product surface is concise, premium, and mobile-friendly.
3. ELITZE Global Security is animated, interactive, and useful.
4. The PHP/database application passes runtime health checks on IONOS.
5. Authentication and authorization are tested.
6. Ingress, normalization, evaluation, audit, cleanup, and policy flows work.
7. Database persistence works.
8. Cron jobs run safely.
9. Security scans complete with explicit statuses.
10. No unsupported claims are presented as implemented.
11. Brand audit passes.
12. Type, lint, build, security, and integration tests pass.
13. Deployment is documented and repeatable.
14. No user data, credentials, or secrets are committed.

## Repository references

- Main repository: `terrell0780/elitze-agentic-security`
- Working branch: `arena/01a0baa3-elitze-agentic-security`
- Existing globe: `src/components/elitze-global-security.tsx`
- Existing function model: `src/lib/elitze-secure/function-inventory.ts`
- Existing server resolver: `src/lib/elitze-secure/function-inventory-server.ts`
- Existing IONOS staging area: `ionos-elitze-platform/`
- Existing self-contained IONOS stage: `ionos-elitze-public/`

## Guiding rule

Build a real, useful, secure product. Preserve useful work. Verify every claim. Make the user's next action clear. Never ship a mockup as the finished platform.
