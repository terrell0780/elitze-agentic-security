import { integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const decisionEvidence = pgTable("decision_evidence", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id").notNull(),
  evidenceId: integer("evidence_id").notNull(),
  relationship: varchar("relationship", { length: 60 }).notNull().default("supports"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analystFeedback = pgTable("analyst_feedback", {
  id: serial("id").primaryKey(),
  decisionId: integer("decision_id"),
  analystId: varchar("analyst_id", { length: 200 }).notNull(),
  verdict: varchar("verdict", { length: 40 }).notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
