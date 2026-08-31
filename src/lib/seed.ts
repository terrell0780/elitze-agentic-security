import { db } from "@/db";
import {
  agents,
  asiControls,
  discoveries,
  enforcementEvents,
  hitlApprovals,
  marketGaps,
} from "@/db/schema";
import { sql } from "drizzle-orm";

export async function ensureSeeded() {
  // Ensure tables exist even if drizzle-kit push hasn't been run yet
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS agents (
      id serial PRIMARY KEY,
      name varchar(160) NOT NULL,
      slug varchar(160) NOT NULL UNIQUE,
      owner varchar(160) NOT NULL,
      framework varchar(80) NOT NULL,
      surface varchar(80) NOT NULL,
      status varchar(40) NOT NULL DEFAULT 'active',
      risk_score integer NOT NULL DEFAULT 0,
      purpose text NOT NULL,
      purpose_bound boolean NOT NULL DEFAULT true,
      tools jsonb NOT NULL DEFAULT '[]'::jsonb,
      nhi_id varchar(120),
      last_seen_at timestamptz DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS discoveries (
      id serial PRIMARY KEY,
      kind varchar(40) NOT NULL,
      name varchar(200) NOT NULL,
      location varchar(300) NOT NULL,
      severity varchar(20) NOT NULL DEFAULT 'medium',
      details text NOT NULL,
      status varchar(40) NOT NULL DEFAULT 'open',
      discovered_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS hitl_approvals (
      id serial PRIMARY KEY,
      agent_slug varchar(160) NOT NULL,
      action varchar(200) NOT NULL,
      blast_radius varchar(40) NOT NULL,
      rationale text NOT NULL,
      status varchar(40) NOT NULL DEFAULT 'pending',
      requested_at timestamptz NOT NULL DEFAULT now(),
      decided_at timestamptz,
      decided_by varchar(120)
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS asi_controls (
      id serial PRIMARY KEY,
      code varchar(20) NOT NULL UNIQUE,
      title varchar(160) NOT NULL,
      control text NOT NULL,
      coverage integer NOT NULL DEFAULT 0,
      status varchar(40) NOT NULL DEFAULT 'partial'
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS enforcement_events (
      id serial PRIMARY KEY,
      agent_slug varchar(160) NOT NULL,
      event_type varchar(80) NOT NULL,
      severity varchar(20) NOT NULL,
      summary text NOT NULL,
      intent_mismatch boolean NOT NULL DEFAULT false,
      latency_ms real NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS market_gaps (
      id serial PRIMARY KEY,
      title varchar(200) NOT NULL,
      demand varchar(20) NOT NULL,
      buyer varchar(120) NOT NULL,
      why text NOT NULL,
      elitze_status varchar(40) NOT NULL,
      differentiator boolean NOT NULL DEFAULT false
    );
  `);

  const countResult = await db.execute(
    sql`SELECT count(*)::text AS count FROM market_gaps`,
  );
  const countRows = countResult.rows as Array<{ count: string }>;
  if (Number(countRows[0]?.count ?? 0) > 0) return;

  await db.insert(agents).values([
    {
      name: "frontier-desk",
      slug: "frontier-desk",
      owner: "secops@acme.io",
      framework: "LangGraph",
      surface: "saas",
      status: "active",
      riskScore: 22,
      purpose: "Triage inbound security tickets and draft responses",
      purposeBound: true,
      tools: ["jira.read", "slack.post", "knowledge.search"],
      nhiId: "nhi-fd-9a2c",
    },
    {
      name: "refund-bot",
      slug: "refund-bot",
      owner: "payments@acme.io",
      framework: "CrewAI",
      surface: "cloud",
      status: "quarantined",
      riskScore: 81,
      purpose: "Issue customer refunds under $50",
      purposeBound: true,
      tools: ["stripe.refund", "crm.read", "email.send"],
      nhiId: "nhi-rb-44ef",
    },
    {
      name: "code-fixer",
      slug: "code-fixer",
      owner: "platform@acme.io",
      framework: "AutoGen",
      surface: "ci",
      status: "active",
      riskScore: 35,
      purpose: "Propose dependency upgrades and open PRs",
      purposeBound: true,
      tools: ["github.pr", "sbom.scan", "cosign.sign"],
      nhiId: "nhi-cf-1b77",
    },
    {
      name: "shadow-researcher",
      slug: "shadow-researcher",
      owner: "unknown",
      framework: "Custom GPT",
      surface: "endpoint",
      status: "shadow",
      riskScore: 94,
      purpose: "Unknown — discovered via browser extension telemetry",
      purposeBound: false,
      tools: ["browser.fetch", "clipboard.read"],
      nhiId: null,
    },
  ]);

  await db.insert(discoveries).values([
    {
      kind: "shadow_agent",
      name: "shadow-researcher",
      location: "endpoint · chrome://extensions",
      severity: "critical",
      details:
        "Unregistered agent with clipboard + browser tools. No NHI, no purpose binding, no killswitch hook.",
    },
    {
      kind: "mcp_server",
      name: "mcp://finance-tools.local",
      location: "laptop · 10.0.4.18:8721",
      severity: "high",
      details:
        "Unauthenticated MCP server exposing sql.exec and fs.write. No audience-bound tokens.",
    },
    {
      kind: "embedded_framework",
      name: "LlamaIndex RAG worker",
      location: "k8s · payments-ns",
      severity: "medium",
      details:
        "Embedded agent framework in payments microservice without runtime guardrails.",
    },
    {
      kind: "skill",
      name: "shell-exec skill v0.3.1",
      location: "agent marketplace · unsigned",
      severity: "high",
      details:
        "Unsigned skill allowing arbitrary shell. Supply-chain risk (ASI04).",
    },
  ]);

  await db.insert(hitlApprovals).values([
    {
      agentSlug: "refund-bot",
      action: "stripe.refund $4,200 → customer_9921",
      blastRadius: "financial",
      rationale:
        "Amount exceeds purpose-bound $50 cap. Intent mismatch vs baseline refund pattern.",
      status: "pending",
    },
    {
      agentSlug: "code-fixer",
      action: "git push --force origin main",
      blastRadius: "irreversible",
      rationale: "Force-push to protected branch. Requires human approval.",
      status: "pending",
    },
    {
      agentSlug: "frontier-desk",
      action: "email.send external · vendor@unknown.io",
      blastRadius: "external",
      rationale: "First-time external recipient + PII fingerprint in body.",
      status: "denied",
      decidedBy: "secops@acme.io",
      decidedAt: new Date(),
    },
  ]);

  await db.insert(asiControls).values([
    {
      code: "ASI01",
      title: "Agent Goal Hijack",
      control: "Prompt + retrieved-doc injection defense; purpose binding",
      coverage: 92,
      status: "covered",
    },
    {
      code: "ASI02",
      title: "Tool Misuse & Exploitation",
      control: "Pre-tool policy hooks; capability-scoped tokens",
      coverage: 95,
      status: "covered",
    },
    {
      code: "ASI03",
      title: "Identity & Privilege Abuse",
      control: "Per-agent NHI; least-privilege; short-lived vault tokens",
      coverage: 90,
      status: "covered",
    },
    {
      code: "ASI04",
      title: "Agentic Supply Chain",
      control: "AIBOM + MCP/skill allowlists; signed provenance",
      coverage: 88,
      status: "covered",
    },
    {
      code: "ASI05",
      title: "Unexpected Code Execution",
      control: "Sandbox + egress allowlist + seccomp/microVM",
      coverage: 94,
      status: "covered",
    },
    {
      code: "ASI06",
      title: "Memory & Context Poisoning",
      control: "Signed memory writes; provenance; integrity checks",
      coverage: 86,
      status: "covered",
    },
    {
      code: "ASI07",
      title: "Insecure Inter-Agent Comms",
      control: "A2A message signing + inspection",
      coverage: 78,
      status: "partial",
    },
    {
      code: "ASI08",
      title: "Cascading Agent Failures",
      control: "Circuit breakers; blast-radius limits; saga rollback",
      coverage: 84,
      status: "covered",
    },
    {
      code: "ASI09",
      title: "Human-Agent Trust Exploitation",
      control: "Explanation audit; forced verification on high-impact",
      coverage: 80,
      status: "partial",
    },
    {
      code: "ASI10",
      title: "Rogue Agents",
      control: "Drift monitoring + killswitch + quarantine",
      coverage: 96,
      status: "covered",
    },
  ]);

  await db.insert(enforcementEvents).values([
    {
      agentSlug: "refund-bot",
      eventType: "deny",
      severity: "critical",
      summary: "Tool call blocked: refund above purpose-bound cap",
      intentMismatch: true,
      latencyMs: 18,
    },
    {
      agentSlug: "shadow-researcher",
      eventType: "quarantine",
      severity: "critical",
      summary: "Shadow agent isolated; tokens revoked; clipboard tool disabled",
      intentMismatch: false,
      latencyMs: 42,
    },
    {
      agentSlug: "frontier-desk",
      eventType: "injection_block",
      severity: "high",
      summary: "Indirect prompt injection in attached PDF neutralized",
      intentMismatch: true,
      latencyMs: 27,
    },
    {
      agentSlug: "code-fixer",
      eventType: "memory_block",
      severity: "high",
      summary: "Poisoned memory write rejected — unsigned provenance",
      intentMismatch: false,
      latencyMs: 11,
    },
    {
      agentSlug: "refund-bot",
      eventType: "killswitch",
      severity: "critical",
      summary: "Killswitch armed for refund-bot after anomalous tool burst",
      intentMismatch: true,
      latencyMs: 9,
    },
  ]);

  await db.insert(marketGaps).values([
    {
      title: "Shadow agent & MCP discovery",
      demand: "critical",
      buyer: "CISO / AI Sec",
      why: "You can't govern what you can't see. Shadow agents are the #1 blind spot in every 2026 POC checklist.",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "Intent-focused detection (not just API logs)",
      demand: "critical",
      buyer: "SOC / Detection Eng",
      why: "Authorized tools used for unauthorized purposes evade API-level logging. Intent mismatch is the differentiator.",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "Execution-time policy (pre-tool hooks)",
      demand: "critical",
      buyer: "Platform / AppSec",
      why: "Post-execution alerts are forensics. Buyers require intercept-before-execute.",
      elitzeStatus: "shipped",
      differentiator: false,
    },
    {
      title: "Human-in-the-loop for irreversible actions",
      demand: "critical",
      buyer: "Risk / Compliance",
      why: "EU AI Act + boards demand escalation on high-impact actions. Escalation-only UX (not approve-everything).",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "Memory integrity / context poisoning defense",
      demand: "high",
      buyer: "AI Platform",
      why: "Poisoned memory persists across sessions. Rarely covered by chatbot guardrail vendors.",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "Non-human identity (NHI) per agent",
      demand: "critical",
      buyer: "IAM / Identity",
      why: "Enterprises average 45 NHIs per human. Agents need first-class identity, not shared service accounts.",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "Audience-bound MCP tokens + tool broker",
      demand: "high",
      buyer: "Platform Eng",
      why: "MCP is the new attack surface. Tokens must be audience-bound; credentials never enter the agent process.",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "OWASP ASI Top 10 mapped controls",
      demand: "high",
      buyer: "GRC / Board",
      why: "Procurement and auditors now ask for ASI01–ASI10 coverage, not just LLM Top 10.",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "Explainable / evidence-quality audit trails",
      demand: "critical",
      buyer: "Compliance / Legal",
      why: "Orgs with evidence-quality trails score 20–32 pts higher on AI maturity. EU AI Act needs 6+ month logs.",
      elitzeStatus: "shipped",
      differentiator: false,
    },
    {
      title: "Automated response: isolate + revoke + playbook",
      demand: "high",
      buyer: "SOC",
      why: "Manual response can't match machine-speed attacks. Auto-isolate agent, revoke tokens, fire SOAR.",
      elitzeStatus: "shipped",
      differentiator: false,
    },
    {
      title: "Red-team / continuous adversarial eval loop",
      demand: "high",
      buyer: "AppSec / Red Team",
      why: "Guardrails without continuous red team drift. Market wants DAST-for-agents closed loop.",
      elitzeStatus: "building",
      differentiator: false,
    },
    {
      title: "AIBOM + agent SBOM in CI",
      demand: "high",
      buyer: "AppSec / Supply Chain",
      why: "CISA/NIST push SBOMs for agentic systems. Tools, models, MCP servers, skills must be inventoried.",
      elitzeStatus: "shipped",
      differentiator: false,
    },
    {
      title: "Multi-agent blast-radius / cascade controls",
      demand: "high",
      buyer: "Architecture",
      why: "ASI08 cascading failures. Circuit breakers across agent graphs are rare in point products.",
      elitzeStatus: "building",
      differentiator: true,
    },
    {
      title: "Purpose binding + capability tokens",
      demand: "critical",
      buyer: "Security Architecture",
      why: "Governance-containment gap: 58% monitor, only ~38% can actually contain. Purpose binding closes it.",
      elitzeStatus: "shipped",
      differentiator: true,
    },
    {
      title: "Insurance / MTTR evidence packs",
      demand: "medium",
      buyer: "CISO / CFO",
      why: "Cyber insurers cut premiums 18–32% for agentic platforms with MTTR < 4h and documented controls.",
      elitzeStatus: "planned",
      differentiator: true,
    },
  ]);
}
