import { db } from "@/db";
import { agentIntegrations, godsEyeFindings, useCases } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function ensureUseCasesSeeded() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS use_cases (
      id serial PRIMARY KEY,
      slug varchar(120) NOT NULL UNIQUE,
      category varchar(80) NOT NULL,
      title varchar(200) NOT NULL,
      summary text NOT NULL,
      problem text NOT NULL,
      approach text NOT NULL,
      outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
      industries jsonb NOT NULL DEFAULT '[]'::jsonb,
      featured boolean NOT NULL DEFAULT false,
      sort_order integer NOT NULL DEFAULT 0
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agent_integrations (
      id serial PRIMARY KEY,
      slug varchar(120) NOT NULL UNIQUE,
      name varchar(160) NOT NULL,
      kind varchar(80) NOT NULL,
      tagline varchar(240) NOT NULL,
      description text NOT NULL,
      risks jsonb NOT NULL DEFAULT '[]'::jsonb,
      elitze_controls jsonb NOT NULL DEFAULT '[]'::jsonb,
      status varchar(40) NOT NULL DEFAULT 'supported',
      website varchar(300),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS gods_eye_findings (
      id serial PRIMARY KEY,
      target varchar(200) NOT NULL,
      finding_type varchar(80) NOT NULL,
      title varchar(240) NOT NULL,
      severity varchar(20) NOT NULL,
      detail text NOT NULL,
      status varchar(40) NOT NULL DEFAULT 'open',
      discovered_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const countResult = await db.execute(
    sql`SELECT count(*)::text AS count FROM use_cases`,
  );
  const countRows = countResult.rows as Array<{ count: string }>;
  if (Number(countRows[0]?.count ?? 0) > 0) return;

  await db.insert(useCases).values([
    {
      slug: "agentic-ai-security",
      category: "agentic",
      title: "Agentic AI Security",
      summary:
        "Secure the full agent loop — prompts, tools, memory, MCP, and multi-agent handoffs — not just the model call.",
      problem:
        "LLM guardrails wrap a single completion. Agents plan, call tools, write memory, and delegate. Attackers hijack goals, misuse tools, poison context, and cascade failures across agent graphs.",
      approach:
        "Elitze binds purpose, enforces pre-tool policy, sandboxes execution, brokers credentials, and killswitches rogue behavior with OWASP ASI-mapped controls.",
      outcomes: [
        "Pre-tool deny in <30ms p99",
        "Purpose-bound agents with per-agent NHI",
        "ASI01–ASI10 control evidence for boards",
      ],
      industries: ["Technology", "Financial Services", "Healthcare"],
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "identify-ai-agent-risk",
      category: "agentic",
      title: "Identify AI Agent Risk",
      summary:
        "Discover sanctioned and shadow agents, score blast radius, and prioritize what can actually hurt you.",
      problem:
        "Shadow GPTs, unregistered MCP servers, and embedded frameworks proliferate without owners, NHI, or killswitch hooks. You cannot govern what you cannot see.",
      approach:
        "Continuous discovery across SaaS, cloud, endpoint, and CI. Risk scoring from tools, privileges, data touch, and intent drift. Auto-quarantine critical shadow agents.",
      outcomes: [
        "Full agent inventory with owners",
        "Risk-ranked blast radius per agent",
        "Shadow → claimed → governed workflow",
      ],
      industries: ["All industries", "MSSP", "Enterprise IT"],
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "api-discovery",
      category: "api",
      title: "API Discovery",
      summary:
        "Find every REST, GraphQL, gRPC, and agent-exposed endpoint — including shadow, zombie, and partner APIs.",
      problem:
        "Official OpenAPI catalogs miss shadow routes, deprecated zombies, mobile backends, and APIs spun up by agents at runtime.",
      approach:
        "Correlate gateway traffic, code specs, runtime eBPF/sidecar signals, and agent tool schemas into one discovery pipeline with likelihood scoring.",
      outcomes: [
        "Shadow & zombie API detection",
        "Owner + sensitivity mapping",
        "Continuous, not quarterly, inventory",
      ],
      industries: ["SaaS", "FinTech", "Retail"],
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "unified-api-inventory",
      category: "api",
      title: "Unified API Inventory",
      summary:
        "One normalized inventory for human APIs and agent tool endpoints — versioned, owned, and policy-linked.",
      problem:
        "Fragmented inventories across gateways, service meshes, and agent frameworks create blind spots and duplicate risk work.",
      approach:
        "Elitze Security Graph normalizes endpoints, auth schemes, data classes, and agent consumers into a single source of truth with GitOps export.",
      outcomes: [
        "Single pane for APIs + agent tools",
        "Auth & data-class tags on every route",
        "Export to CMDB / SIEM / ticketing",
      ],
      industries: ["Enterprise", "Telecom", "Government"],
      featured: false,
      sortOrder: 4,
    },
    {
      slug: "stop-api-attacks",
      category: "api",
      title: "Stop API Attacks",
      summary:
        "Block BOLA, BFLA, injection, credential stuffing, and agent-driven abuse in real time.",
      problem:
        "Agents amplify API abuse: automated enumeration, over-privileged tool tokens, and intent-mismatched calls that look 'authorized'.",
      approach:
        "Runtime enforcement with intent detection, rate & capability limits, schema validation, and automatic token revoke + isolate playbooks.",
      outcomes: [
        "Intent-mismatch blocks on tool calls",
        "BOLA/BFLA multi-session testing",
        "Auto-isolate compromised agent identities",
      ],
      industries: ["FinTech", "E-commerce", "Healthcare"],
      featured: true,
      sortOrder: 5,
    },
    {
      slug: "reduce-attack-surface",
      category: "api",
      title: "Reduce Attack Surface",
      summary:
        "Shrink reachable exposure: unused APIs, over-scoped MCP tools, open egress, and forgotten agent skills.",
      problem:
        "Attack surface grows with every agent skill, MCP server, and microservice. Most exposure is unused or over-permissioned.",
      approach:
        "Gods Eye-style continuous outside-in + inside-out mapping. Recommend decommission, scope reduction, and egress allowlists with guided remediation.",
      outcomes: [
        "Reachable exposure prioritized by exploitability",
        "MCP/tool allowlists enforced",
        "Measurable surface reduction over time",
      ],
      industries: ["All industries"],
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "compliance-governance",
      category: "compliance",
      title: "Compliance & Governance",
      summary:
        "EU AI Act, SOC2, ISO, HIPAA evidence for agent decisions — explainable, tamper-evident, retention-ready.",
      problem:
        "Regulators and insurers demand audit trails for autonomous actions. Most agent stacks log prompts, not who/why/what-system/what-data.",
      approach:
        "Evidence-quality trails: invoker, purpose, tools, data classes, policy decision, HITL outcome. ASI-mapped control matrix for procurement.",
      outcomes: [
        "6+ month tamper-evident retention",
        "Board-ready ASI coverage scores",
        "Insurance MTTR evidence packs",
      ],
      industries: ["BFSI", "Healthcare", "Public sector"],
      featured: true,
      sortOrder: 7,
    },
    {
      slug: "api-posture-management",
      category: "compliance",
      title: "API Posture Management",
      summary:
        "Continuous discovery, testing, risk scoring, and ownership — ASPM for APIs and agent tools together.",
      problem:
        "Discovery without testing is inventory theater. Testing without owners creates unfixed findings forever.",
      approach:
        "Four loops: discover → test (BOLA/BFLA/schema) → score → assign owner. Block CI on critical posture regressions.",
      outcomes: [
        "Posture score per API & agent",
        "Owner-routed remediation SLAs",
        "CI gates on posture regressions",
      ],
      industries: ["SaaS", "Platform engineering"],
      featured: false,
      sortOrder: 8,
    },
    {
      slug: "api-incident-response",
      category: "compliance",
      title: "API Incident Response",
      summary:
        "Agent-aware IR: freeze identities, revoke tool tokens, contain blast radius, replay the chain.",
      problem:
        "Classic IR playbooks assume humans and servers. Compromised agents move at machine speed across APIs and MCP.",
      approach:
        "One-click killswitch scopes, NHI revoke, sandbox forensic freeze, signed trace replay, and SOAR playbook fan-out.",
      outcomes: [
        "Containment in seconds, not hours",
        "Replayable agent decision chains",
        "SIEM/SOAR-native incident packages",
      ],
      industries: ["SOC teams", "MSSP", "Critical infrastructure"],
      featured: false,
      sortOrder: 9,
    },
    {
      slug: "industry-bfsi",
      category: "industry",
      title: "Financial Services",
      summary:
        "Purpose-bound trading, refund, and KYC agents with financial blast-radius caps and HITL on irreversible money movement.",
      problem:
        "Agent refund bots and research agents can move money or leak PII faster than fraud teams can react.",
      approach:
        "Hard $ caps, audience-bound payment tokens, external-email gates, and full audit for SOX/GLBA examiners.",
      outcomes: [
        "Financial action HITL queue",
        "PII redaction on outbound tools",
        "Examiner-ready decision logs",
      ],
      industries: ["Banking", "FinTech", "Insurance"],
      featured: true,
      sortOrder: 10,
    },
    {
      slug: "industry-healthcare",
      category: "industry",
      title: "Healthcare & Life Sciences",
      summary:
        "HIPAA-ready agent guardrails for clinical copilots, scheduling, and claims — PHI never leaves policy scope.",
      problem:
        "Clinical and revenue-cycle agents touch ePHI across EHR APIs with weak purpose binding.",
      approach:
        "PHI DLP, BAA-friendly audit, least-privilege EHR tool scopes, and memory isolation between patients.",
      outcomes: [
        "PHI egress blocked by default",
        "Patient-scoped memory partitions",
        "HIPAA evidence exports",
      ],
      industries: ["Healthcare", "Payers", "Life sciences"],
      featured: false,
      sortOrder: 11,
    },
    {
      slug: "industry-public",
      category: "industry",
      title: "Government & Defense",
      summary:
        "High-impact AI classification, FedRAMP-minded controls, and killswitch drills aligned to NIST agent standards.",
      problem:
        "OMB high-impact AI and NIST agent initiatives require action authority, tool invocation security, and auditable autonomy.",
      approach:
        "Strict purpose binding, air-gapped BYOM options, signed A2A, and scheduled killswitch / cascade drills.",
      outcomes: [
        "High-impact AI control mapping",
        "BYOM / air-gap deployment paths",
        "Documented killswitch drills",
      ],
      industries: ["Federal", "Defense", "Critical infrastructure"],
      featured: false,
      sortOrder: 12,
    },
    {
      slug: "industry-saas",
      category: "industry",
      title: "SaaS & Technology",
      summary:
        "Ship agent features safely: MCP gateways, customer-tenant isolation, and red-team loops before GA.",
      problem:
        "Product teams ship agents weekly; security still reviews quarterly. Tenant isolation and tool abuse become product-risk.",
      approach:
        "Tenant-aware policy bundles, continuous red-team evals, AIBOM in CI, and customer-facing trust center exports.",
      outcomes: [
        "Tenant-isolated agent runtimes",
        "Pre-GA adversarial pass rates",
        "Trust-center API posture pages",
      ],
      industries: ["SaaS", "AI startups", "Platforms"],
      featured: false,
      sortOrder: 13,
    },
  ]);

  await db.insert(agentIntegrations).values([
    {
      slug: "agent-reach",
      name: "Agent Reach",
      kind: "reach",
      tagline: "Internet reach for agents — secured at the edge by Elitze",
      description:
        "Agent Reach (open-source) installs and health-checks upstream readers so agents can search and read the public web, GitHub, video transcripts, RSS, and social platforms without paid APIs. Elitze wraps Reach routes with purpose binding, egress allowlists, content inspection, and credential isolation so internet reach does not become prompt-injection reach.",
      risks: [
        "Untrusted web content → indirect prompt injection",
        "Cookie/session backed social routes expand account takeover blast radius",
        "Supply-chain risk from upstream CLIs (yt-dlp, gh, scrapers)",
        "No native policy on which domains/tools an agent may call",
      ],
      elitzeControls: [
        "Egress allowlist + domain reputation gate on every Reach fetch",
        "Retrieved content treated as untrusted data (ASI01 injection defense)",
        "Local credentials stay in vault broker — never in agent context",
        "Per-route rate limits, DLP on outbound, killswitch on anomaly bursts",
        "AIBOM entry for each Reach upstream tool + version pin checks",
      ],
      status: "brokered",
      website: "https://github.com/Panniantong/agent-reach",
    },
    {
      slug: "duckduckgo",
      name: "DuckDuckGo Search",
      kind: "search",
      tagline: "Privacy-first web search tool for agents — no tracking profiles",
      description:
        "DuckDuckGo is the default privacy-preserving search backend for Elitze-brokered agents. No API key required for basic search, no search-profile tracking, and easy scoping via site: prefixes. Ideal when agents need live web facts without sending query telemetry to ad-tech search graphs.",
      risks: [
        "Search snippets can carry injected instructions",
        "Result quality/rate limits vary vs commercial SERP APIs",
        "Agents may over-trust top results without provenance",
      ],
      elitzeControls: [
        "Search tool is capability-scoped and purpose-bound",
        "Snippets sanitized before entering agent memory",
        "Optional domain allowlist / query_prefix lock",
        "Full audit: query, results hash, downstream tool use",
        "Live try-it panel in Elitze console (server-side proxy)",
      ],
      status: "supported",
      website: "https://duckduckgo.com",
    },
    {
      slug: "gods-eye",
      name: "Gods Eye",
      kind: "vision",
      tagline: "All-seeing attack-surface & OSINT visibility — Elitze's eye layer",
      description:
        "Gods Eye is Elitze's visibility mode: continuous outside-in reconnaissance style scanning (inspired by GOD'S EYE class tools) correlated with inside-out agent/API inventory. Fingerprint tech, discover shadow endpoints, correlate CVEs, and feed the Security Graph so the eye always knows what is exposed.",
      risks: [
        "Unauthorized scanning is illegal — scope to owned assets only",
        "Noisy findings without exploitability context overwhelm SOCs",
        "OSINT data can include sensitive employee or customer traces",
      ],
      elitzeControls: [
        "Authorized target lists + rate-limited recon only",
        "Findings enriched with exploitability & owner routing",
        "PII/email harvest redacted in default views",
        "CVE correlation into VulnOps SLAs",
        "One-click promote finding → policy gate or killswitch drill",
      ],
      status: "supported",
      website: null,
    },
    {
      slug: "lindy-ai",
      name: "Lindy AI",
      kind: "automation",
      tagline: "No-code multi-step AI employees — governed by Elitze runtime",
      description:
        "Lindy AI lets teams build autonomous 'AI employees' with natural language, 5,000+ app integrations, computer-use browsers, and HITL checkpoints (SOC2/HIPAA). Elitze sits beside Lindy agents as the runtime guardian: discover each Lindy, bind purpose, broker app credentials, escalate irreversible actions, and killswitch drift — without ripping out the builder your business users love.",
      risks: [
        "Computer-use / browser agents bypass API-only controls",
        "Credit-based scale can mean many agents with unclear owners",
        "Broad SaaS OAuth scopes on Gmail, HubSpot, calendars",
        "Cloud-only residency may conflict with strict data zones",
      ],
      elitzeControls: [
        "Auto-discover Lindy agents into inventory + NHI issuance",
        "Map each integration scope → least-privilege capability tokens",
        "HITL bridge for financial / external / irreversible Lindy steps",
        "Browser computer-use session sandbox + egress policy",
        "Shared audit trail for SOC2/HIPAA evidence packs",
      ],
      status: "monitored",
      website: "https://www.lindy.ai",
    },
  ]);

  await db.insert(godsEyeFindings).values([
    {
      target: "api.acme.io",
      findingType: "api",
      title: "Shadow GraphQL endpoint /internal/graphql exposed",
      severity: "critical",
      detail:
        "No auth header required on introspection. Appears in agent tool schema refund-bot.tools.",
    },
    {
      target: "mcp.finance.local",
      findingType: "mcp",
      title: "Unauthenticated MCP server on 10.0.4.18:8721",
      severity: "critical",
      detail:
        "sql.exec + fs.write tools. No audience-bound tokens. Gods Eye tagged as high-reach.",
    },
    {
      target: "app.acme.io",
      findingType: "header",
      title: "Missing CSP + weak CORS on customer portal",
      severity: "high",
      detail:
        "Access-Control-Allow-Origin reflects arbitrary origin. Elevates agent XSS → tool abuse path.",
    },
    {
      target: "staging-agents.acme.io",
      findingType: "shadow_agent",
      title: "Unregistered AutoGen worker in staging NS",
      severity: "high",
      detail:
        "No NHI, purpose_bound=false, tools include shell.exec. Recommended quarantine.",
    },
    {
      target: "cdn.acme.io",
      findingType: "cve",
      title: "CVE-2026-3141 in edge image nginx-extras",
      severity: "medium",
      detail:
        "Mapped via Gods Eye fingerprint → VulnOps ticket. EPSS elevated for internet-facing hosts.",
    },
    {
      target: "partners.acme.io",
      findingType: "subdomain",
      title: "Forgotten partner subdomain serves old OpenAPI",
      severity: "medium",
      detail:
        "Zombie API set from 2023 partnership. Still reachable; no owner in inventory.",
    },
  ]);
}
