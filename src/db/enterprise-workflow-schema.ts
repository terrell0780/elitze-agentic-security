import { boolean, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const securityApprovals = pgTable("security_approvals", {
  id: serial("id").primaryKey(),
  approvalId: varchar("approval_id", { length: 120 }).notNull().unique(),
  tenantId: varchar("tenant_id", { length: 200 }).notNull(),
  requestedBy: varchar("requested_by", { length: 200 }).notNull(),
  agentId: varchar("agent_id", { length: 200 }),
  action: varchar("action", { length: 240 }).notNull(),
  target: varchar("target", { length: 500 }).notNull(),
  risk: varchar("risk", { length: 20 }).notNull(),
  rationale: text("rationale").notNull(),
  evidenceIds: jsonb("evidence_ids").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 40 }).notNull().default("PENDING"),
  decidedBy: varchar("decided_by", { length: 200 }),
  decisionReason: text("decision_reason"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const securityIntegrationEvents = pgTable("security_integration_events", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id", { length: 200 }).notNull(),
  source: varchar("source", { length: 160 }).notNull(),
  eventKey: varchar("event_key", { length: 240 }).notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  processed: boolean("processed").notNull().default(false),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastError: text("last_error"),
});
