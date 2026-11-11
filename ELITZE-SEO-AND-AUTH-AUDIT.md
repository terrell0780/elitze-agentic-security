# ELITZE live access, SEO, and Search Console plan

## Live login and dashboard routing review

The live login experience at `https://www.elitze.info/login` is visually clear and understandable. It explains the product in security terms, presents email and password fields, supports “Keep me signed in,” exposes password recovery, and gives new users a direct workspace-registration path. The page is server-delivered with meaningful HTML rather than an empty client shell.

The normal unauthenticated handoff works as follows:

1. A visitor requests `/console`.
2. The server redirects to `/login?next=%2Fconsole`.
3. Login submits to `/api/auth/login` with same-origin credentials.
4. If MFA is required, the form changes to the MFA challenge without losing the user’s flow.
5. After success, the client validates that `next` is a same-origin path and replaces the URL with the requested destination.

A routing friction point was found for deep links such as `/console/analyst` and `/console/threat-detection`: the shared console layout could collapse an unauthenticated deep link to `/login?next=%2Fconsole`, losing the page the visitor originally requested. A request-level proxy was added to preserve the complete pathname and query string for unauthenticated `/console/*` and `/workspace/*` requests. For example, a direct request to `/console/analyst?query=openssl` now targets `/login?next=%2Fconsole%2Fanalyst%3Fquery%3Dopenssl` before the dashboard layout runs.

The proxy only redirects requests that do not carry the ELITZE session cookie. It does not authorize the request by cookie presence; the existing database-backed session validation in the dashboard layout remains the security boundary. This prevents the proxy from weakening authentication while removing the most visible deep-link friction.

The routing fix is in `src/proxy.ts`. TypeScript, ESLint, the production build, authentication security tests, authentication E2E safety tests, accessibility contract tests, and security self-tests all pass. The fix has been validated locally and should be deployed from the next push.

Two limitations remain important for a truthful production-readiness statement:

- A real successful login could not be completed without a real user account and MFA state. The public login page, unauthenticated redirect, source-level login contract, and protected-route behavior were tested, but credential acceptance and post-login dashboard rendering still require a real account test.
- The live domain was previously serving the new landing page, but production deployment status should be checked after the new proxy commit finishes deploying. Do not treat a successful local build as proof that production has updated.

## Recommended zero-friction acceptance path

Use a dedicated test account with a deliverable email address and a known MFA state. Test these cases in a clean browser profile:

- Open `/console` while signed out. Confirm the browser lands on `/login?next=%2Fconsole`, then lands on `/console` after login.
- Open `/console/analyst` while signed out. Confirm the exact analyst path is preserved after login.
- Open a deep URL with a query string and confirm the query string survives the login handoff.
- Submit an invalid password and confirm the form shows a useful error without clearing the email field.
- Use an unverified account and confirm the page explains that email verification is required.
- Use an MFA-enabled account and confirm the second step appears without asking for the password again.
- Refresh after login and confirm the session remains valid when “Keep me signed in” is selected.
- Sign out, revisit a protected deep link, and confirm the request returns to login rather than exposing dashboard content.
- Test mobile navigation because the dashboard sidebar becomes a horizontal navigation strip on small screens.

## SEO position and market language

The strongest category language is not just “cybersecurity platform.” Searchers and competitors increasingly describe the problem through the concrete control points: **AI agent security**, **agentic AI security**, **MCP security**, **AI agent identity**, **AI agent governance**, **least privilege for AI agents**, **AI runtime security**, **prompt injection defense**, **tool poisoning**, **agent observability**, and **secure AI agent access**.

This framing is supported by current market language. Microsoft positions agent security around agent identities, authentication, access provisioning, fine-grained authorization, governance, data security, and runtime threat protection.[1] Palo Alto Networks describes AI agents as privileged identities and emphasizes MCP inventory, identity brokering, least privilege, access governance, auditing, shadow MCP discovery, and just-in-time permissions.[2] SentinelOne emphasizes discovering every agent and MCP server, mapping connectors and tools, and identifying who is running them.[3] CoSAI’s MCP guidance groups the problem into identity and access, prompt injection and data/control-boundary failures, supply chain, network isolation, trust boundaries, rate limits, and observability.[4]

ELITZE should therefore lead with a specific category promise rather than a vague “AI-powered cybersecurity” claim:

> **Identity-aware security control for AI agents and MCP execution paths.**

That positioning is specific enough to earn relevant searches and broad enough to support pages about agent identity, MCP gateways, runtime decisions, evidence, governance, and vulnerability intelligence.

## Keyword strategy

Do not fabricate monthly search volumes. The current plan should use intent and business value as the initial prioritization, then replace assumptions with Google Search Console query data and a keyword-tool export after the property has accumulated impressions. Google itself recommends using Search Console to see the queries, impressions, clicks, and average positions that actually bring users to the site.[5]

### Tier 1: category and commercial-intent pages

These are the terms most closely connected to ELITZE’s product category and should receive the clearest product pages:

- AI agent security
- AI agent security platform
- agentic AI security
- agentic security platform
- enterprise AI agent security
- secure AI agents
- AI runtime security
- AI agent governance platform
- AI agent access control
- AI agent identity security
- AI agent observability
- AI agent threat detection
- AI agent security monitoring
- AI agent security gateway
- AI agent policy enforcement

Recommended landing pages:

- `/ai-agent-security`
- `/agentic-ai-security`
- `/ai-agent-governance`
- `/ai-agent-identity-security`
- `/ai-runtime-security`

Each page must have a distinct search intent. Avoid publishing five near-duplicate pages that all target “AI agent security platform.” Use one category page for the broad term and make the others answer narrower control questions.

### Tier 2: MCP security and execution-path terms

MCP is a high-value topical wedge because it names a concrete protocol and the market is actively publishing around it:

- MCP security
- Model Context Protocol security
- MCP server security
- secure MCP gateway
- MCP gateway security
- MCP access control
- MCP authentication
- MCP authorization
- MCP server monitoring
- MCP server inventory
- MCP audit logs
- MCP prompt injection
- MCP tool poisoning
- MCP server supply chain security
- shadow MCP servers
- MCP least privilege
- secure remote MCP servers

Recommended pages:

- `/mcp-security`
- `/mcp-gateway-security`
- `/mcp-server-security-checklist`
- `/mcp-authentication-and-authorization`
- `/mcp-prompt-injection-and-tool-poisoning`

These should include diagrams, request-flow examples, implementation checklists, and explicit boundaries about what is observed versus what is only declared. CoSAI’s public guidance is a useful source for the threat taxonomy, but ELITZE should add its own practical control mapping and testable examples rather than rewriting the whitepaper.[4]

### Tier 3: identity, least privilege, and governance terms

These terms connect the AI-agent problem to established enterprise security budgets:

- AI agent identity management
- AI agent IAM
- identity for AI agents
- non-human identity security AI agents
- machine identity for AI agents
- least privilege AI agents
- zero trust AI agents
- AI agent authorization
- AI agent permissions
- just-in-time access for AI agents
- AI agent access governance
- AI agent approval workflow
- AI agent audit trail
- human in the loop AI security
- AI agent compliance monitoring

Recommended pages:

- `/ai-agent-identity`
- `/least-privilege-ai-agents`
- `/zero-trust-ai-agents`
- `/ai-agent-access-governance`
- `/ai-agent-audit-logging`

These pages should explicitly explain how an agent identity differs from a user identity, why delegated OAuth alone may be insufficient, and how ELITZE connects the human, agent, tenant, workload, tool, resource, and decision. Microsoft’s agent identity and zero-trust framing provides useful market vocabulary.[1]

### Tier 4: problem and threat terms

These are strong informational opportunities that can create qualified demand before a buyer searches for a vendor:

- prompt injection in AI agents
- indirect prompt injection defense
- tool poisoning attack
- confused deputy attack AI agent
- excessive agency AI security
- AI agent privilege escalation
- AI agent data exfiltration
- rogue AI agent detection
- shadow AI agent discovery
- AI agent supply chain security
- AI agent secrets management
- AI agent runtime monitoring
- AI agent incident response
- AI agent attack surface management
- AI agent red teaming

Recommended pages:

- `/prompt-injection-defense`
- `/tool-poisoning`
- `/rogue-ai-agent-detection`
- `/shadow-ai-agent-discovery`
- `/ai-agent-attack-surface`
- `/ai-agent-incident-response`

Each article should distinguish the threat from the control. For example, a prompt-injection page should explain that model-output filtering is not a substitute for deterministic authorization at the tool or API boundary.

### Tier 5: implementation and comparison terms

These terms capture practitioners who are evaluating architecture:

- how to secure an AI agent
- how to secure an MCP server
- AI agent security checklist
- MCP security checklist
- AI agent security architecture
- AI agent threat model
- AI agent security controls
- AI agent security best practices
- AI agent security testing
- AI agent penetration testing
- AI agent security tools
- AI agent security platform comparison
- AI agent gateway vs MCP gateway
- AI agent observability tools
- AI agent governance framework

Recommended pages:

- `/how-to-secure-an-ai-agent`
- `/ai-agent-security-checklist`
- `/ai-agent-security-architecture`
- `/ai-agent-threat-model`
- `/ai-agent-security-tools`
- `/ai-agent-security-platform-comparison`

Comparison pages must be fair and evidence-based. Do not claim ELITZE is “best” without independently verifiable proof. Explain the control dimensions and where each architecture fits.

## Content architecture and internal linking

Build a hub-and-spoke structure around one authoritative pillar page:

- Pillar: `/ai-agent-security`
- Spokes: agent identity, least privilege, runtime security, MCP security, prompt injection, tool poisoning, observability, governance, incident response, and implementation checklist.

Every spoke should link back to the pillar with descriptive anchor text and link laterally to two or three related spokes. The public navigation should expose the category pages through `/platform`, `/security`, `/integrations`, and `/docs`, while the dashboard and APIs remain excluded from indexing.

Use one canonical URL per topic. Do not publish both `/mcp-security` and `/mcp-security-guide` with substantially identical content. Redirect or canonicalize duplicates. Keep login, registration, console, workspace, API, and tenant-specific pages out of the sitemap and disallowed in robots.txt. Google’s sitemap guidance says the sitemap should contain fully qualified canonical URLs that the owner actually wants shown in search results.[6]

## Twelve-week publishing sequence

### Weeks 1–2: foundation

Publish the category page `/ai-agent-security`, the MCP page `/mcp-security`, and the AI-agent identity page. Add Organization, WebSite, BreadcrumbList, and SoftwareApplication structured data only where the visible page content supports it. Add a real social preview image with accessible alt context rather than a generic dashboard screenshot.

### Weeks 3–4: practical security

Publish `/ai-agent-security-checklist`, `/mcp-server-security-checklist`, and `/how-to-secure-an-ai-agent`. Include a printable checklist, a control-to-threat mapping, and a small test plan. Link every checklist item to the relevant ELITZE control page.

### Weeks 5–6: high-interest threats

Publish prompt injection, tool poisoning, confused deputy, excessive agency, and shadow MCP content. Each page should contain a threat scenario, attack path, prevention controls, detection evidence, and recovery steps.

### Weeks 7–8: enterprise controls

Publish pages for least privilege, zero trust, agent identity, access governance, audit logging, and human approval workflows. Use diagrams showing user → agent → gateway → MCP server → tool → resource, with authorization and evidence points labeled.

### Weeks 9–10: proof and evaluation

Publish an architecture guide, threat model, security controls matrix, platform comparison, and a transparent “what ELITZE does not claim” page. The last page is valuable for trust because Google’s guidance emphasizes clear, accurate content and does not promise any magic ranking formula.[7]

### Weeks 11–12: conversion and distribution

Publish one implementation case study using real, permissioned evidence; a glossary; and a webinar or technical walkthrough. Promote each substantial page through developer communities, security newsletters, GitHub documentation, partner links, and a company social account. Google notes that external links and promotion help discovery, but over-promotion can become counterproductive.[7]

## Page template for every SEO article

Use a clear title of approximately 45–60 characters when possible, but prioritize accuracy over a fixed character target. Google may generate title links from the title element and page headings, so the title and visible H1 must agree with the actual page content.[7]

Each page should include:

- One H1 that states the exact problem.
- A two-sentence answer near the top.
- A “who this is for” section.
- A threat or architecture diagram when useful.
- A concrete control checklist.
- A short ELITZE implementation section.
- A limitations or evidence-boundary section.
- Links to related pages and the next practical action.
- A unique title, meta description, canonical URL, Open Graph title/description/URL/image, and Twitter card.
- Author, reviewer, last-reviewed date, and source links for research-heavy pages.

Do not stuff the same phrase into every heading. Use natural variants such as “AI agent security,” “securing autonomous agents,” “agent identity,” and “MCP access control” where they accurately describe the section.

## Google Search Console setup for elitze.info

### Recommended property

Create a **Domain property** for `elitze.info`, not only a URL-prefix property. A Domain property covers the root domain, HTTPS, HTTP, and subdomains such as `www`, whereas a URL-prefix property covers only the exact prefix entered. Google requires DNS verification for a Domain property.[8]

### Step-by-step setup

1. Sign in at [Google Search Console](https://search.google.com/search-console) with the Google account that should own the property.
2. Click **Add property**.
3. Select **Domain**.
4. Enter `elitze.info` without `https://` and without a path.
5. Google will provide a TXT verification record, typically with a host/name of `@` or the root domain and a value beginning with `google-site-verification=`.
6. Open the DNS management panel for the registrar or DNS provider that controls `elitze.info`.
7. Add the TXT record exactly as Google provides it. Do not replace existing SPF, DKIM, DMARC, or other TXT records. Add a separate TXT record.
8. Save the DNS change. DNS propagation can take time; Google may verify quickly, but do not repeatedly create new records if the first one is still propagating.
9. Return to Search Console and click **Verify**.
10. Keep the DNS record in place. Google’s guidance says Domain verification depends on control of the DNS provider and that removing the verification record can cause ownership to be lost.[8]

If DNS access is unavailable, create a URL-prefix property for `https://www.elitze.info/` and use an HTML tag, HTML file, Google Analytics, or Google Tag Manager verification method. The homepage must be publicly accessible for HTML-tag verification, and the tag must be in the homepage `<head>`.[8] Domain verification remains the better long-term choice if the DNS provider is available.

### Submit the sitemap

After verification:

1. Open the verified `elitze.info` property.
2. In the left menu, open **Sitemaps**.
3. In **Add a new sitemap**, enter `sitemap.xml` if Search Console already displays the site origin, or enter `https://www.elitze.info/sitemap.xml` if it expects the full URL.
4. Click **Submit**.
5. Confirm that the result is **Success** or that Google has accepted the sitemap for processing.
6. Open the sitemap row later to check the last read time, discovered URLs, and errors.

The live sitemap is currently reachable at `https://www.elitze.info/sitemap.xml`, and `robots.txt` references it. Google says sitemap submission is a hint rather than a guarantee that every URL will be crawled or indexed.[6]

### Submit and inspect the highest-value URLs

Use **URL Inspection** for the homepage and the first three new SEO pages after publishing. Request indexing for each page only after:

- The page returns HTTP 200.
- The page contains meaningful server-rendered HTML.
- The canonical points to the intended `https://www.elitze.info/...` URL.
- The URL is included in the sitemap.
- The page is not blocked by robots.txt or a noindex directive.

Search Console can show index coverage, URL inspection details, performance queries, Core Web Vitals, and alerts when Google identifies problems.[5]

### Weekly Search Console operating rhythm

During the first month, review the property weekly. Look for indexed pages, excluded pages, crawl errors, query impressions, average position, click-through rate, and page-level performance. Export queries that show impressions but low clicks; these usually indicate pages where the title or description needs improvement. Export queries where ELITZE ranks between positions 8 and 30; these are often the fastest opportunities for better internal links, clearer answers, and stronger evidence.

Do not request indexing for every small edit. Submit the sitemap once, use URL Inspection for important new or materially revised pages, and let Google recrawl the rest naturally.

## Immediate next actions

1. Deploy the deep-link proxy commit and verify `/console/analyst` and `/console/threat-detection` preserve their destination.
2. Create and verify the Domain property `elitze.info` in Search Console using DNS TXT.
3. Submit `https://www.elitze.info/sitemap.xml`.
4. Publish `/ai-agent-security`, `/mcp-security`, and `/ai-agent-identity-security` before adding many smaller articles.
5. Add a real test account and run the complete login/MFA/deep-link acceptance path.
6. Revisit the keyword priorities after two to four weeks of Search Console impressions instead of assuming search volumes.

## References

[1]: https://www.microsoft.com/en-us/security/blog/2025/05/19/microsoft-extends-zero-trust-to-secure-the-agentic-workforce/ "Microsoft extends Zero Trust to secure the agentic workforce"

[2]: https://www.paloaltonetworks.com/blog/identity-security/secure-ai-agents-controls-visibility-mcp-data-access/ "Secure AI Agents: controls, visibility, and MCP data access"

[3]: https://www.sentinelone.com/platform/prompt-security-agentic-ai-security/ "SentinelOne agentic AI security and MCP visibility"

[4]: https://www.coalitionforsecureai.org/securing-the-ai-agent-revolution-a-practical-guide-to-mcp-security/ "Coalition for Secure AI practical guide to MCP security"

[5]: https://search.google.com/search-console/about "Google Search Console overview"

[6]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap "Google Search Central: Build and submit a sitemap"

[7]: https://developers.google.com/search/docs/fundamentals/seo-starter-guide "Google Search Central SEO Starter Guide"

[8]: https://support.google.com/webmasters/answer/9008080?hl=en "Google Search Console: Verify your site ownership"
