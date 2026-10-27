# ELITZE workspace and product readiness

## Workspace entry and navigation
- [x] Replace the promotional homepage with a functional security workspace entry.
- [x] Load authenticated tenant overview metrics from the workspace API; show unavailable states instead of fabricated data.
- [x] Provide searchable, filterable links to all specialist dashboards, investigations, scanners, integrations, evidence, chat and agent workflows.
- [x] Expose About, interactive How-to, searchable FAQ, Help and Documentation routes.
- [x] Register the How-to route in the route manifest and sitemap.
- [x] Keep all tenant metrics behind the existing authenticated APIs.

## Interactive product surfaces
- [x] Governed Chat, team collaboration and file/voice affordances remain on their dedicated authenticated route.
- [x] Search and category filter the workspace launcher without inventing data.
- [x] How-to guides support search, category filtering, interactive guide selection and local completion marks.
- [x] FAQ supports search, category filtering, collapsible answers and direct links into the relevant product route.
- [x] Specialist pages remain separate routes for Agentic SOC, analyst, threat detection, CVE/KEV/EPSS, adversary emulation, pentesting, readiness, integrations, organization, skills and ROI.

## Security and release gates
- [x] Add a tenant database isolation readiness assessment based on runtime role and PostgreSQL RLS catalog evidence.
- [x] Reject missing/mismatched runtime roles and superuser/BYPASSRLS roles in the readiness assessment.
- [x] Add regression tests to CI and production prebuild.
- [ ] Provision and verify policy semantics for every tenant-keyed table.
- [ ] Add passing cross-tenant negative tests using real separate tenant identities.
- [ ] Verify authentication/session flows and live authorized security-runner handshake.
- [ ] Verify connected email and other provider workflows with authorized credentials.
- [ ] Confirm backup/restore and real customer-pilot evidence where required.
- [ ] Merge and promote only after mandatory build, integration and tenant-isolation gates pass.

A passing build verifies compilation and wired self-tests; it does not by itself prove production readiness or tenant isolation.
