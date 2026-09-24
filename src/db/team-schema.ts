import { index, integer, pgTable, serial, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const teamChannels = pgTable(
  "team_channels",
  {
    id: serial("id").primaryKey(),
    tenantId: uuid("tenant_id"),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    channelType: varchar("channel_type", { length: 40 }).notNull().default("team"),
    incidentId: integer("incident_id"),
    createdBy: varchar("created_by", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("team_channels_slug_uq").on(table.slug), index("team_channels_type_idx").on(table.channelType), index("team_channels_tenant_idx").on(table.tenantId)],
);

export const teamMessages = pgTable(
  "team_messages",
  {
    id: serial("id").primaryKey(),
    channelId: integer("channel_id").notNull(),
    authorId: varchar("author_id", { length: 200 }).notNull(),
    authorType: varchar("author_type", { length: 40 }).notNull().default("human"),
    body: text("body").notNull(),
    replyToId: integer("reply_to_id"),
    linkedDecisionId: integer("linked_decision_id"),
    linkedEvidenceId: integer("linked_evidence_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [index("team_messages_channel_created_idx").on(table.channelId, table.createdAt), index("team_messages_decision_idx").on(table.linkedDecisionId)],
);

export const teamChannelMembers = pgTable(
  "team_channel_members",
  {
    id: serial("id").primaryKey(),
    channelId: integer("channel_id").notNull(),
    actorId: varchar("actor_id", { length: 200 }).notNull(),
    role: varchar("role", { length: 40 }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("team_channel_members_active_uq").on(table.channelId, table.actorId)],
);
