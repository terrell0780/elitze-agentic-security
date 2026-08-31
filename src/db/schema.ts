import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export {
  useCases,
  agentIntegrations,
  godsEyeFindings,
} from "./use-cases-schema";
export {
  crmContacts,
  crmActions,
  topAgents,
} from "./crm-schema";
export {
  dataSources,
  insights,
} from "./data-hub-schema";

/** Discovered / registered AI agents across the estate */
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  owner: varchar("owner", { length: 160 }).notNull(),
  framework: varchar("framework", { length: 80 }).notNull(),
  surface: varchar("surface", { length: 80 }).notNull(), // saas | cloud | endpoint | ci | mcp
  status: varchar("status", { length: 40 }).notNull().default("active"), // active | paused | quarantined | shadow
  riskScore: integer("risk_score").notNull().default(0),
  purpose: text("purpose").notNull(),
  purposeBound: boolean("purpose_bound").notNull().default(true),
  tools: jsonb("tools").$type<string[]>().notNull().default([]),
  nhiId: varchar("nhi_id", { length: 120 }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Shadow AI / unregistered agent & MCP discoveries */
export const discoveries = pgTable("discoveries", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 40 }).notNull(), // shadow_agent | mcp_server | embedded_framework | skill
  name: varchar("name", { length: 200 }).notNull(),
  location: varchar("location", { length: 300 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  details: text("details").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("open"), // open | claimed | suppressed
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Human-in-the-loop approval queue for irreversible actions */
export const hitlApprovals = pgTable("hitl_approvals", {
  id: serial("id").primaryKey(),
  agentSlug: varchar("agent_slug", { length: 160 }).notNull(),
  action: varchar("action", { length: 200 }).notNull(),
  blastRadius: varchar("blast_radius", { length: 40 }).notNull(), // reversible | irreversible | financial | external
  rationale: text("rationale").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("pending"), // pending | approved | denied | expired
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: varchar("decided_by", { length: 120 }),
});

/** OWASP ASI Top 10 coverage matrix */
export const asiControls = pgTable("asi_controls", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(), // ASI01..ASI10
  title: varchar("title", { length: 160 }).notNull(),
  control: text("control").notNull(),
  coverage: integer("coverage").notNull().default(0), // 0-100
  status: varchar("status", { length: 40 }).notNull().default("partial"), // covered | partial | gap
});

/** Runtime enforcement / killswitch events */
export const enforcementEvents = pgTable("enforcement_events", {
  id: serial("id").primaryKey(),
  agentSlug: varchar("agent_slug", { length: 160 }).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(), // deny | quarantine | killswitch | memory_block | injection_block
  severity: varchar("severity", { length: 20 }).notNull(),
  summary: text("summary").notNull(),
  intentMismatch: boolean("intent_mismatch").notNull().default(false),
  latencyMs: real("latency_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Market demand / competitive gap backlog for product roadmap */
export const marketGaps = pgTable("market_gaps", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  demand: varchar("demand", { length: 20 }).notNull(), // critical | high | medium
  buyer: varchar("buyer", { length: 120 }).notNull(),
  why: text("why").notNull(),
  elitzeStatus: varchar("elitze_status", { length: 40 }).notNull(), // shipped | building | planned
  differentiator: boolean("differentiator").notNull().default(false),
});
