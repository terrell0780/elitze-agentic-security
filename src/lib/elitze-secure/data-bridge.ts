import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { desc, eq, and, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { dataBridgeEvents, dataBridgeSources, dataSources } from "@/db/data-bridge-schema";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

const MAX_EVENT_BYTES = 256_000;
const MAX_BATCH = 100;
const TOKEN_BYTES = 48;

const eventSchema = z.object({
  eventId: z.string().min(1).max(200).optional(),
  eventType: z.string().min(1).max(120),
  observedAt: z.string().datetime({ offset: true }).optional(),
  severity: z.string().max(40).optional(),
  subject: z.string().max(300).optional(),
  action: z.string().max(200).optional(),
  state: z.string().max(80).optional(),
  summary: z.string().max(2_000).optional(),
  assetIds: z.array(z.string().max(200)).max(200).optional(),
  evidenceIds: z.array(z.string().max(200)).max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const ingestSchema = z.object({
  events: z.array(eventSchema).min(1).max(MAX_BATCH),
});

export type DataBridgeEventInput = z.infer<typeof eventSchema>;
export type DataBridgeEventStatus = "ACCEPTED" | "DUPLICATE" | "REJECTED";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

function payloadHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEvent(sourceId: string, tenantId: string, input: DataBridgeEventInput) {
  const eventId = input.eventId?.trim() || `evt_${payloadHash(input).slice(0, 32)}`;
  const observedAt = input.observedAt ? new Date(input.observedAt) : new Date();
  if (Number.isNaN(observedAt.getTime())) throw new Error("invalid_observed_at");
  const raw = {
    eventId,
    eventType: input.eventType.trim(),
    observedAt: observedAt.toISOString(),
    severity: input.severity?.trim() || "unknown",
    subject: input.subject?.trim() || null,
    action: input.action?.trim() || null,
    state: input.state?.trim() || "OBSERVED",
    summary: input.summary?.trim() || null,
    assetIds: input.assetIds ?? [],
    evidenceIds: input.evidenceIds ?? [],
    metadata: input.metadata ?? {},
    payload: input.payload,
  };
  return {
    id: crypto.randomUUID(),
    tenantId,
    sourceId,
    eventId,
    eventType: raw.eventType,
    schemaVersion: "1",
    observedAt,
    severity: raw.severity,
    subject: raw.subject,
    action: raw.action,
    state: raw.state,
    summary: raw.summary,
    assetIds: raw.assetIds,
    evidenceIds: raw.evidenceIds,
    normalized: raw,
    rawPayload: input,
    contentHash: payloadHash(raw),
  };
}

function readBearer(request: Request): string | null {
  const explicit = request.headers.get("x-elitze-source-token")?.trim();
  if (explicit) return explicit;
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

async function assertBodySize(request: Request): Promise<void> {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_EVENT_BYTES * MAX_BATCH) throw new Error("request_too_large");
}

export function parseIngestBody(body: unknown) {
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) throw new Error(`invalid_bridge_payload:${parsed.error.issues.map((issue) => issue.path.join(".")).join(",")}`);
  return parsed.data;
}

export function issueSourceToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function sourceTokenDigest(token: string): string {
  return tokenHash(token);
}

export async function authenticateSource(request: Request) {
  const token = readBearer(request);
  if (!token) return null;
  const hash = tokenHash(token);
  const rows = await getDb().select().from(dataBridgeSources).where(and(eq(dataBridgeSources.tokenHash, hash), eq(dataBridgeSources.active, true))).limit(1);
  return rows[0] ?? null;
}

export async function provisionSource(args: { tenantId: string; name: string; kind: string; description?: string }) {
  const tenantId = args.tenantId.trim();
  if (!tenantId) throw new Error("tenant_id_required");
  if (tenantId.length > 200) throw new Error("tenant_id_too_long");
  const name = args.name.trim();
  if (!name || name.length > 200) throw new Error("source_name_invalid");
  const token = issueSourceToken();
  const db = getDb();
  const [source] = await db.insert(dataBridgeSources).values({
    tenantId,
    name,
    kind: args.kind.trim().slice(0, 80) || "external",
    description: args.description?.trim() || null,
    tokenHash: tokenHash(token),
    tokenPrefix: token.slice(0, 10),
    active: true,
  }).returning();
  return { source, token };
}

export async function ingestEvents(source: typeof dataBridgeSources.$inferSelect, body: unknown) {
  await assertBodySize(new Request("http://internal", { headers: { "content-length": "0" } }));
  const parsed = parseIngestBody(body);
  const db = getDb();
  const audit = new AuditLedger();
  const results: Array<{ eventId: string; status: DataBridgeEventStatus }> = [];

  for (const input of parsed.events) {
    const normalized = normalizeEvent(source.id, source.tenantId, input);
    const [inserted] = await db.insert(dataBridgeEvents).values({
      id: normalized.id,
      tenantId: normalized.tenantId,
      sourceId: normalized.sourceId,
      eventId: normalized.eventId,
      eventType: normalized.eventType,
      schemaVersion: normalized.schemaVersion,
      observedAt: normalized.observedAt,
      severity: normalized.severity,
      subject: normalized.subject,
      action: normalized.action,
      state: normalized.state,
      summary: normalized.summary,
      assetIds: normalized.assetIds,
      evidenceIds: normalized.evidenceIds,
      normalized: normalized.normalized,
      rawPayload: normalized.rawPayload,
      contentHash: normalized.contentHash,
      status: "ACCEPTED",
      receivedAt: new Date(),
    }).onConflictDoNothing({ target: [dataBridgeEvents.tenantId, dataBridgeEvents.sourceId, dataBridgeEvents.eventId] }).returning();

    if (!inserted) {
      results.push({ eventId: normalized.eventId, status: "DUPLICATE" });
      continue;
    }

    results.push({ eventId: normalized.eventId, status: "ACCEPTED" });
    await audit.append(source.tenantId, "data_bridge.ingested", {
      sourceId: source.id,
      sourceKind: source.kind,
      eventId: normalized.eventId,
      eventType: normalized.eventType,
      contentHash: normalized.contentHash,
    });
  }

  await db.update(dataBridgeSources).set({ lastIngestAt: new Date(), eventsAccepted: sql`${dataBridgeSources.eventsAccepted} + ${results.filter((result) => result.status === "ACCEPTED").length}` }).where(eq(dataBridgeSources.id, source.id));
  await db.update(dataSources).set({ lastIngestAt: new Date(), eventsToday: sql`${dataSources.eventsToday} + ${results.filter((result) => result.status === "ACCEPTED").length}` }).where(eq(dataSources.slug, source.slug));
  return { tenantId: source.tenantId, sourceId: source.id, accepted: results.filter((result) => result.status === "ACCEPTED").length, duplicates: results.filter((result) => result.status === "DUPLICATE").length, results };
}

export async function listEvents(args: { tenantId: string; sourceId?: string; limit?: number; cursor?: string }) {
  const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
  const conditions = [eq(dataBridgeEvents.tenantId, args.tenantId)];
  if (args.sourceId) conditions.push(eq(dataBridgeEvents.sourceId, args.sourceId));
  const events = await getDb().select().from(dataBridgeEvents).where(and(...conditions)).orderBy(desc(dataBridgeEvents.receivedAt)).limit(limit);
  return events;
}

export async function health(tenantId?: string) {
  const sourceConditions = tenantId ? eq(dataBridgeSources.tenantId, tenantId) : undefined;
  const eventConditions = tenantId ? eq(dataBridgeEvents.tenantId, tenantId) : undefined;
  const [sources, accepted, rejected] = await Promise.all([
    getDb().select({ id: dataBridgeSources.id, name: dataBridgeSources.name, tenantId: dataBridgeSources.tenantId, active: dataBridgeSources.active, lastIngestAt: dataBridgeSources.lastIngestAt, eventsAccepted: dataBridgeSources.eventsAccepted }).from(dataBridgeSources).where(sourceConditions),
    getDb().select({ count: sql<number>`count(*)` }).from(dataBridgeEvents).where(and(eventConditions, eq(dataBridgeEvents.status, "ACCEPTED"))),
    getDb().select({ count: sql<number>`count(*)` }).from(dataBridgeEvents).where(and(eventConditions, eq(dataBridgeEvents.status, "REJECTED"))),
  ]);
  return { sources, acceptedEvents: Number(accepted[0]?.count ?? 0), rejectedEvents: Number(rejected[0]?.count ?? 0) };
}
