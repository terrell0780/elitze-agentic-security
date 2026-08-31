import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Full Security CRM for agents, customers, threats, and actions */
export const crmContacts = pgTable("crm_contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 120 }).notNull(), // agent_owner | customer | security_lead | auditor | vendor
  organization: varchar("org", { length: 160 }).notNull(),
  emailDomain: varchar("email_domain", { length: 120 }),
  associatedAgents: jsonb("agents").$type<string[]>().notNull().default([]),
  associatedIntegrations: jsonb("integrations").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  riskTier: varchar("risk_tier", { length: 20 }).notNull().default("low"),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }).defaultNow(),
  notes: text("notes"),
});

export const crmActions = pgTable("crm_actions", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull(),
  agentSlug: varchar("agent_slug", { length: 160 }),
  actionType: varchar("action_type", { length: 80 }).notNull(), // discovery | approval | killswitch | audit_request | redteam
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  result: text("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Top-level agent hierarchy with reasoning layers */
export const topAgents = pgTable("top_agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  tier: integer("tier").notNull(), // 1 = root/archetype, 2 = reasoning, 3 = execution, 4 = skill/tool
  parentSlug: varchar("parent_slug", { length: 120 }),
  framework: varchar("framework", { length: 80 }).notNull(),
  hasLangGraph: boolean("has_langgraph").notNull().default(true),
  hasBiniClaws: boolean("has_bini_claws").notNull().default(true),
  reasoningType: varchar("reasoning_type", { length: 120 }), // singular / recursive / universal / judgment / mythos / maxed
  mythosSkills: jsonb("mythos_skills").$type<string[]>().notNull().default([]),
  searchDomain: varchar("search_domain", { length: 120 }),
  maxDepth: integer("max_depth").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
