import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  customType,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() { return "bytea"; },
});

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
  (table) => [
    uniqueIndex("team_channels_slug_uq").on(table.slug),
    index("team_channels_type_idx").on(table.channelType),
    index("team_channels_tenant_idx").on(table.tenantId),
  ],
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
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("team_messages_channel_created_idx").on(table.channelId, table.createdAt),
    index("team_messages_decision_idx").on(table.linkedDecisionId),
  ],
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
  (table) => [
    uniqueIndex("team_channel_members_active_uq").on(table.channelId, table.actorId),
  ],
);

export const chatAttachments = pgTable(
  "chat_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    channelId: integer("channel_id").notNull(),
    uploadedBy: varchar("uploaded_by", { length: 200 }).notNull(),
    fileName: varchar("file_name", { length: 300 }).notNull(),
    contentType: varchar("content_type", { length: 160 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    scanState: varchar("scan_state", { length: 40 }).notNull().default("NOT_CONFIGURED"),
    content: bytea("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chat_attachments_tenant_idx").on(table.tenantId, table.createdAt),
    index("chat_attachments_channel_idx").on(table.channelId, table.createdAt),
  ],
);

export const teamMessageAttachments = pgTable(
  "team_message_attachments",
  {
    messageId: integer("message_id").notNull(),
    attachmentId: uuid("attachment_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("team_message_attachments_uq").on(table.messageId, table.attachmentId),
  ],
);

export const aiConnections = pgTable(
  "ai_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    kind: varchar("kind", { length: 20 }).notNull(),
    protocol: varchar("protocol", { length: 40 }).notNull(),
    baseUrl: text("base_url").notNull(),
    model: varchar("model", { length: 160 }),
    encryptedSecret: text("encrypted_secret").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdBy: varchar("created_by", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ai_connections_tenant_idx").on(table.tenantId, table.enabled, table.createdAt)],
);

export const teamVoicePresence = pgTable(
  "team_voice_presence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    channelId: integer("channel_id").notNull(),
    actorId: varchar("actor_id", { length: 200 }).notNull(),
    displayName: varchar("display_name", { length: 200 }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("team_voice_presence_active_uq").on(table.channelId, table.actorId),
    index("team_voice_presence_channel_idx").on(table.tenantId, table.channelId, table.lastSeenAt),
  ],
);

export const teamVoiceSignals = pgTable(
  "team_voice_signals",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    tenantId: uuid("tenant_id").notNull(),
    channelId: integer("channel_id").notNull(),
    fromActorId: varchar("from_actor_id", { length: 200 }).notNull(),
    toActorId: varchar("to_actor_id", { length: 200 }).notNull(),
    signalType: varchar("signal_type", { length: 20 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (table) => [
    index("team_voice_signals_delivery_idx").on(
      table.tenantId,
      table.channelId,
      table.toActorId,
      table.consumedAt,
      table.createdAt,
    ),
  ],
);

export const teamspeakIntegrations = pgTable(
  "teamspeak_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    webqueryUrl: text("webquery_url").notNull(),
    encryptedApiKey: text("encrypted_api_key").notNull(),
    serverId: integer("server_id"),
    enabled: boolean("enabled").notNull().default(true),
    lastState: varchar("last_state", { length: 40 }),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    createdBy: varchar("created_by", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("teamspeak_integrations_tenant_idx").on(table.tenantId, table.enabled, table.createdAt)],
);
