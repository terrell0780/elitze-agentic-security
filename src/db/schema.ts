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

export { useCases, agentIntegrations, godsEyeFindings } from "./use-cases-schema";
export { crmContacts, crmActions } from "./crm-schema";
export { dataSources, insights } from "./data-hub-schema";

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  owner: varchar("owner", { length: 160 }).notNull(),
  framework: varchar("framework", { length: 80 }).notNull(),
  surface: varchar("surface", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("active"),
  riskScore: integer("risk_score").notNull().default(0),
  purpose: text("purpose").notNull(),
  purposeBound: boolean("purpose_bound").notNull().default(true),
  tools: jsonb("tools").$type<string[]>().notNull().default([]),
  nhiId: varchar("nhi_id", { length: 120 }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const discoveries = pgTable("discoveries", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 40 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  location: varchar("location", { length: 300 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  details: text("details").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("open"),
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).defaultNow().notNull(),
});

export const hitlApprovals = pgTable("hitl_approvals", {
  id: serial("id").primaryKey(),
  agentSlug: varchar("agent_slug", { length: 160 }).notNull(),
  action: varchar("action", { length: 200 }).notNull(),
  blastRadius: varchar("blast_radius", { length: 40 }).notNull(),
  rationale: text("rationale").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: varchar("decided_by", { length: 120 }),
});

export const asiControls = pgTable("asi_controls", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  control: text("control").notNull(),
  coverage: integer("coverage").notNull().default(0),
  status: varchar("status", { length: 40 }).notNull().default("partial"),
});

export const enforcementEvents = pgTable("enforcement_events", {
  id: serial("id").primaryKey(),
  agentSlug: varchar("agent_slug", { length: 160 }).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  summary: text("summary").notNull(),
  intentMismatch: boolean("intent_mismatch").notNull().default(false),
  latencyMs: real("latency_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const marketGaps = pgTable("market_gaps", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  demand: varchar("demand", { length: 20 }).notNull(),
  buyer: varchar("buyer", { length: 120 }).notNull(),
  why: text("why").notNull(),
  elitzeStatus: varchar("elitze_status", { length: 40 }).notNull(),
  differentiator: boolean("differentiator").notNull().default(false),
});

export const securityIdentities = pgTable("security_identities", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 200 }).notNull().unique(),
  kind: varchar("kind", { length: 40 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("active"),
  owner: varchar("owner", { length: 160 }),
  purpose: text("purpose"),
  capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const securityPolicies = pgTable("security_policies", {
  id: serial("id").primaryKey(),
  policyId: varchar("policy_id", { length: 120 }).notNull().unique(),
  version: varchar("version", { length: 40 }).notNull(),
  effect: varchar("effect", { length: 20 }).notNull(),
  scope: varchar("scope", { length: 120 }).notNull(),
  rules: jsonb("rules").$type<Record<string, unknown>>().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const securityDecisions = pgTable("security_decisions", {
  id: serial("id").primaryKey(),
  requestHash: varchar("request_hash", { length: 64 }).notNull().unique(),
  actorId: varchar("actor_id", { length: 200 }).notNull(),
  agentId: varchar("agent_id", { length: 200 }),
  action: varchar("action", { length: 200 }).notNull(),
  decision: varchar("decision", { length: 30 }).notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
  policyVersion: varchar("policy_version", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attackPaths = pgTable("attack_paths", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("open"),
  nodes: jsonb("nodes").$type<Array<Record<string, unknown>>>().notNull(),
  evidence: jsonb("evidence").$type<Array<Record<string, unknown>>>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const redTeamRuns = pgTable("red_team_runs", {
  id: serial("id").primaryKey(),
  target: varchar("target", { length: 240 }).notNull(),
  campaign: varchar("campaign", { length: 160 }).notNull(),
  mode: varchar("mode", { length: 40 }).notNull().default("authorized"),
  status: varchar("status", { length: 40 }).notNull().default("queued"),
  findings: jsonb("findings").$type<Array<Record<string, unknown>>>().notNull().default([]),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const evidenceRecords = pgTable("evidence_records", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 240 }).notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
