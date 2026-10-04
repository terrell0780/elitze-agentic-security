import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("organizations_slug_uq").on(table.slug),
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  role: varchar("role", { length: 40 }).notNull().default("member"),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("users_org_email_uq").on(table.organizationId, table.email),
  index("users_email_idx").on(table.email),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("sessions_token_hash_uq").on(table.tokenHash),
  index("sessions_user_idx").on(table.userId),
]);

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("auth_tokens_hash_uq").on(table.tokenHash),
  index("auth_tokens_user_kind_idx").on(table.userId, table.kind),
]);

export const securityPolicies = pgTable("production_security_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  policyId: varchar("policy_id", { length: 120 }).notNull(),
  version: varchar("version", { length: 40 }).notNull(),
  effect: varchar("effect", { length: 20 }).notNull(),
  rules: jsonb("rules").$type<Record<string, unknown>>().notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("production_policies_org_id_uq").on(table.organizationId, table.policyId),
]);

export const securityDecisions = pgTable("production_security_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  agentId: varchar("agent_id", { length: 200 }),
  requestHash: varchar("request_hash", { length: 64 }).notNull(),
  action: varchar("action", { length: 200 }).notNull(),
  decision: varchar("decision", { length: 40 }).notNull(),
  reasons: jsonb("reasons").$type<string[]>().notNull(),
  evidenceHash: varchar("evidence_hash", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("production_decisions_request_hash_uq").on(table.requestHash),
  index("production_decisions_org_created_idx").on(table.organizationId, table.createdAt),
]);

export const securityEvidence = pgTable("production_security_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 240 }).notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("production_evidence_org_created_idx").on(table.organizationId, table.createdAt),
]);

export const auditEvents = pgTable("production_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  requestId: varchar("request_id", { length: 120 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("production_audit_org_created_idx").on(table.organizationId, table.createdAt),
]);
