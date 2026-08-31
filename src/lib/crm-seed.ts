import { db } from "@/db";
import { crmContacts, crmActions, topAgents } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function ensureCrmSeeded() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id serial PRIMARY KEY,
      name varchar(200) NOT NULL,
      role varchar(120) NOT NULL,
      organization varchar(160) NOT NULL,
      email_domain varchar(120),
      agents jsonb NOT NULL DEFAULT '[]'::jsonb,
      integrations jsonb NOT NULL DEFAULT '[]'::jsonb,
      tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      risk_tier varchar(20) NOT NULL DEFAULT 'low',
      last_contact_at timestamptz DEFAULT now(),
      notes text
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS crm_actions (
      id serial PRIMARY KEY,
      contact_id integer NOT NULL,
      agent_slug varchar(160),
      action_type varchar(80) NOT NULL,
      status varchar(40) NOT NULL DEFAULT 'pending',
      result text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS top_agents (
      id serial PRIMARY KEY,
      name varchar(200) NOT NULL,
      slug varchar(120) NOT NULL UNIQUE,
      tier integer NOT NULL,
      parent_slug varchar(120),
      framework varchar(80) NOT NULL,
      has_langgraph boolean NOT NULL DEFAULT true,
      has_bini_claws boolean NOT NULL DEFAULT true,
      reasoning_type varchar(120),
      mythos_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
      search_domain varchar(120),
      max_depth integer NOT NULL DEFAULT 3,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const cRes = await db.execute(sql`SELECT count(*)::text AS count FROM top_agents`);
  const cRows = cRes.rows as Array<{ count: string }>;
  if (Number(cRows[0]?.count ?? 0) > 0) return;

  await db.insert(topAgents).values([
    {
      name: "Elitze — Judgment / Reasoning (Root)",
      slug: "judge-elitze",
      tier: 1,
      parentSlug: null,
      framework: "Custom / Meta-LLM",
      reasoningType: "singular",
      mythosSkills: ["judgment", "policy-arbitration", "killswitch-decision", "audit-evidence"],
      maxDepth: 5,
    },
    {
      name: "Agent Reach — Search / Discovery",
      slug: "agent-reach",
      tier: 2,
      parentSlug: "judge-elitze",
      framework: "Agent Reach (open-source CLI)",
      reasoningType: "recursive",
      mythosSkills: ["search", "discover", "crawl", "extract", "map"],
      searchDomain: "internet / github / youtube / rss",
      maxDepth: 3,
    },
    {
      name: "Gods Eye — Visibility / Surveillance / Intelligence",
      slug: "gods-eye",
      tier: 2,
      parentSlug: "judge-elitze",
      framework: "Gods Eye (multi-modal OSINT engine)",
      reasoningType: "singular",
      mythosSkills: ["recon", "fingerprint", "correlation", "cve-map", "blast-radius", "visual-analysis"],
      maxDepth: 4,
    },
    {
      name: "Lindy AI — Workflow / Automation / Human-in-Loop",
      slug: "lindy-ai",
      tier: 3,
      parentSlug: "judge-elitze",
      framework: "Lindy AI (enterprise AI employee builder)",
      reasoningType: "recursive",
      mythosSkills: ["workflow", "approval-flow", "computer-use", "email-automation", "crm-integration"],
      maxDepth: 3,
    },
    {
      name: "Recursive Agent — Recursive / Self-Improving",
      slug: "recursive-agent",
      tier: 4,
      parentSlug: "judge-elitze",
      framework: "Custom meta-cognitive loop",
      reasoningType: "recursive",
      mythosSkills: ["self-modify", "self-test", "red-team-self", "plan-refine", "cascade-break"],
      maxDepth: 6,
    },
    {
      name: "Singularity Agent — Universal / Singularity",
      slug: "singularity",
      tier: 1,
      parentSlug: "judge-elitze",
      framework: "Universal Intelligence Framework",
      reasoningType: "singular",
      mythosSkills: ["universal-reasoning", "multi-modal-synthesis", "cross-domain-transfer", "singularity-monitor"],
      maxDepth: 5,
    },
    {
      name: "Universal AI — Universal Intelligence Broker",
      slug: "universal-ai",
      tier: 1,
      parentSlug: "judge-elitze",
      framework: "Universal AI (multi-modal intelligence layer)",
      reasoningType: "universal",
      mythosSkills: ["unification", "ontology", "brokering", "cross-language", "multi-modal-merge"],
      maxDepth: 4,
    },
    {
      name: "Graphics Security — Mythos Agent Skills",
      slug: "graphics-security",
      tier: 4,
      parentSlug: "judge-elitze",
      framework: "Custom (eBPF + GPU-rendered security graphs)",
      reasoningType: "mythos",
      mythosSkills: ["visual-graph", "3d-rendering", "topology-animation", "blast-radius-visualization", "security-art"],
      maxDepth: 4,
    },
    {
      name: "Maximum Agent — Maxed / Peak Performance",
      slug: "maxed-agent",
      tier: 4,
      parentSlug: "judge-elitze",
      framework: "Custom (maximum throughput + lowest latency mode)",
      reasoningType: "maxed",
      mythosSkills: ["throughput-optimization", "latency-reduction", "batch-processing", "parallel-execution", "resource-maximization"],
      maxDepth: 5,
    },
  ]);

  await db.insert(crmContacts).values([
    {
      name: "Dr. Aisha K. Rahman",
      role: "agent_owner",
      organization: "Acme Financial",
      emailDomain: "acme.io",
      associatedAgents: ["judge-elitze", "agent-reach", "gods-eye"],
      associatedIntegrations: ["AWS", "Azure", "GitHub"],
      tags: ["security-architect", "customer"],
      riskTier: "high",
      notes: "Owns frontier-desk agent program. Needs HITL approvals for financial actions.",
    },
    {
      name: "Jordan M. Patel",
      role: "security_lead",
      organization: "Federated Health",
      emailDomain: "fedhealth.org",
      associatedAgents: ["judge-elitze", "lindy-ai", "revenue-ops"],
      associatedIntegrations: ["Kong", "Datadog", "Splunk"],
      tags: ["SOC", "customer", "bfs-insurance-adjacent"],
      riskTier: "high",
      notes: "Requires HIPAA evidence exports and PHI DLP reports monthly.",
    },
    {
      name: "Elena R. Vasquez",
      role: "agent_owner",
      organization: "National Security Agency (demo tenant)",
      emailDomain: "gov.demo",
      associatedAgents: ["judge-elitze", "singularity", "universal-ai", "graphics-security"],
      tags: ["public-sector", "fed-ramp-progress", "air-gap-candidate"],
      riskTier: "critical",
      notes: "BYOM + BYOK deployment. Needs killswitch drills documented monthly.",
    },
    {
      name: "Sasha T. Knight",
      role: "vendor",
      organization: "Agent Reach (Open Source)",
      emailDomain: "agent-reach.dev",
      associatedIntegrations: ["Agent Reach"],
      associatedAgents: ["agent-reach", "judge-elitze"],
      tags: ["partner", "open-source", "brokered-integrator"],
      riskTier: "medium",
      notes: "Open-source tool. Brokered through Elitze with egress policies and vault isolation.",
    },
    {
      name: "Lindy AI Enterprise",
      role: "vendor",
      organization: "Lindy AI",
      emailDomain: "lindy.ai",
      associatedIntegrations: ["Lindy AI"],
      associatedAgents: ["lindy-ai", "judge-elitze"],
      tags: ["partner", "enterprise-automation", "hitl-bridge"],
      riskTier: "medium",
      notes: "SOC2 / HIPAA certified. Monitored for purpose binding and HITL escalation.",
    },
    {
      name: "Marcus Chen",
      role: "customer",
      organization: "SaaS Startup — Product Platform",
      emailDomain: "platform.co",
      associatedAgents: ["judge-elitze", "agent-reach", "maxed-agent"],
      tags: ["startup", "growth", "red-team-adopter"],
      riskTier: "medium",
      notes: "Needs continuous red-team loop + AIBOM + CI gates.",
    },
  ]);

  await db.insert(crmActions).values([
    {
      contactId: 1,
      agentSlug: "judge-elitze",
      actionType: "audit_request",
      status: "pending",
    },
    {
      contactId: 2,
      agentSlug: "lindy-ai",
      actionType: "approval",
      status: "approved",
      result: "HITL flow configured for financial actions; evidence package delivered.",
    },
    {
      contactId: 3,
      agentSlug: "judge-elitze",
      actionType: "killswitch",
      status: "pending",
      result: "Drill scheduled; kill-pill and cascade-break verified.",
    },
    {
      contactId: 4,
      agentSlug: "agent-reach",
      actionType: "discovery",
      status: "approved",
      result: "Reach routes brokered through Elitze; vault session isolation confirmed.",
    },
  ]);
}
