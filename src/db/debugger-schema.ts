import { jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const debugSessions = pgTable("debug_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 80 }).notNull().unique(),
  actorId: varchar("actor_id", { length: 200 }).notNull(),
  entry: varchar("entry", { length: 400 }).notNull(),
  cwd: varchar("cwd", { length: 500 }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("starting"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const debugEvents = pgTable("debug_events", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 80 }).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
