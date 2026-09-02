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

/** Security CRM for customers, security contacts, and operational actions. */
export const crmContacts = pgTable("crm_contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  role: varchar("role", { length: 120 }).notNull(),
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
  actionType: varchar("action_type", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  result: text("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
