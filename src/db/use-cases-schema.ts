import { boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/** Product use cases for Elitze */
export const useCases = pgTable("use_cases", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  category: varchar("category", { length: 80 }).notNull(), // agentic | api | compliance | industry | reach
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary").notNull(),
  problem: text("problem").notNull(),
  approach: text("approach").notNull(),
  outcomes: jsonb("outcomes").$type<string[]>().notNull().default([]),
  industries: jsonb("industries").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Third-party agent / tool integrations Elitze secures or brokers */
export const agentIntegrations = pgTable("agent_integrations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  kind: varchar("kind", { length: 80 }).notNull(), // reach | search | vision | automation | other
  tagline: varchar("tagline", { length: 240 }).notNull(),
  description: text("description").notNull(),
  risks: jsonb("risks").$type<string[]>().notNull().default([]),
  elitzeControls: jsonb("elitze_controls").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 40 }).notNull().default("supported"), // supported | brokered | monitored
  website: varchar("website", { length: 300 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Gods Eye-style visibility findings (attack surface / OSINT style) */
export const godsEyeFindings = pgTable("gods_eye_findings", {
  id: serial("id").primaryKey(),
  target: varchar("target", { length: 200 }).notNull(),
  findingType: varchar("finding_type", { length: 80 }).notNull(), // api | shadow_agent | mcp | subdomain | header | cve
  title: varchar("title", { length: 240 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  detail: text("detail").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("open"),
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).defaultNow().notNull(),
});
