import { db } from "@/db";
import { dataSources, insights } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function ensureDataHubSeeded() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS data_sources (
      id serial PRIMARY KEY,
      slug varchar(120) NOT NULL UNIQUE,
      name varchar(200) NOT NULL,
      kind varchar(80) NOT NULL,
      provider varchar(160) NOT NULL,
      endpoint text NOT NULL,
      status varchar(40) NOT NULL DEFAULT 'connected',
      last_ingest_at timestamptz DEFAULT now(),
      events_today integer NOT NULL DEFAULT 0,
      tags jsonb NOT NULL DEFAULT '[]'::jsonb
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS insights (
      id serial PRIMARY KEY,
      kind varchar(60) NOT NULL,
      title varchar(240) NOT NULL,
      summary text NOT NULL,
      evidence text NOT NULL,
      severity varchar(20) NOT NULL,
      sources jsonb NOT NULL DEFAULT '[]'::jsonb,
      status varchar(40) NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const countResult = await db.execute(
    sql`SELECT count(*)::text AS count FROM data_sources`,
  );
  const rows = countResult.rows as Array<{ count: string }>;
  if (Number(rows[0]?.count ?? 0) > 0) return;

  await db.insert(dataSources).values([
    { slug: "agent-graph", name: "Agent Security Graph", kind: "event", provider: "elitze", endpoint: "/data/graph/live", tags: ["security-graph", "runtime"], eventsToday: 48219 },
    { slug: "cve-feed", name: "CVE Intelligence", kind: "event", provider: "cisa-nvd", endpoint: "/data/cve/enrich", tags: ["intelligence", "vulnerability"], eventsToday: 317 },
    { slug: "gateway-traffic", name: "Kong Gateway Traffic", kind: "metric", provider: "kong", endpoint: "/data/metrics/gateway", tags: ["api", "edge"], eventsToday: 1247 },
    { slug: "hitl-queue", name: "HITL Approval Queue", kind: "event", provider: "elitze", endpoint: "/data/hitl/stream", tags: ["governance", "approval"], eventsToday: 317 },
    { slug: "redteam", name: "Continuous Red Team", kind: "log", provider: "elitze-redteam", endpoint: "/data/redteam/eval", tags: ["adversarial", "test"], eventsToday: 184 },
    { slug: "audit-evidence", name: "Audit Evidence Log", kind: "log", provider: "elitze", endpoint: "/data/evidence/stream", tags: ["compliance", "audit"], eventsToday: 2231 },
    { slug: "llm-firewall", name: "LLM Firewall / Prompt Guard", kind: "event", provider: "elitze", endpoint: "/data/firewall/prompt", tags: ["guardrail", "prompt"], eventsToday: 48219 },
  ]);

  await db.insert(insights).values([
    {
      kind: "anomaly",
      title: "Anomalous tool burst from agent refund-bot",
      summary: "Tool call rate 4.3x baseline for 42 seconds. Strikes across stripe.refund, crm.read, and email.send. Intent mismatch detected before execution blocked.",
      evidence: "Latency 41ms. Intent-mismatch flag on action 317 of 48219. Policy: purpose_bound + financial cap enforced.",
      severity: "high",
      sources: ["agent-graph", "gateway-traffic", "hitl-queue"],
      status: "open",
    },
    {
      kind: "correlation",
      title: "Shadow agent correlation: shadow-researcher → MCP finance server",
      summary: "Same process parent links shadow agent to unauthenticated MCP server. Agent used clipboard.read + browser.fetch; server exposed sql.exec.",
      evidence: "Graph path: endpoint → shadow-researcher → mcp://finance-tools.local. Killswitch fired. Quarantine propagated.",
      severity: "critical",
      sources: ["agent-graph", "redteam", "audit-evidence"],
      status: "open",
    },
    {
      kind: "risk_shift",
      title: "CVE intelligence shift: critical advisory mapped to 142 agents",
      summary: "CVE-2026-31412 mapped to langchain-core 0.4.x across 142 agent instances. Reachability score 92% in production.",
      evidence: "VulnOps enriched with agent dependency SBOM. Remediation PR drafted; killswitch armed as contingency.",
      severity: "critical",
      sources: ["cve-feed", "redteam", "agent-graph"],
      status: "open",
    },
    {
      kind: "gap",
      title: "AS07 inter-agent message inspection: partial coverage",
      summary: "A2A message signing is covered (88%), but full message inspection and multi-agent cascade containment remains a gap.",
      evidence: "ASI control matrix: ASI07 = 78%. Cascade limits and saga rollback under active build; target 94%.",
      severity: "medium",
      sources: ["audit-evidence", "redteam", "agent-graph"],
      status: "open",
    },
  ]);
}
