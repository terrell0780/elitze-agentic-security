import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { dataBridgeEvents, dataBridgeSources, dataSources } from "@/db/schema";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";
import type { ObservedSignal, SecurityDomain } from "@/lib/elitze-secure/defense-fabric";

const MAX_BATCH = 100;
const MAX_REQUEST_BYTES = 5_000_000;
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

const ingestSchema = z.object({ events: z.array(eventSchema).min(1).max(MAX_BATCH) });

export type DataBridgeEventInput = z.infer<typeof eventSchema>;
export type DataBridgeEventStatus = "ACCEPTED" | "DUPLICATE";
type SourceRow = typeof dataBridgeSources.$inferSelect;
type EventRow = typeof dataBridgeEvents.$inferSelect;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`).join(",")}}`;
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function slugify(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
  return slug || `source-${randomUUID().slice(0, 8)}`;
}

function inferDomain(event: EventRow): SecurityDomain {
  const value = `${event.eventType} ${event.subject ?? ""} ${event.action ?? ""}`.toLowerCase();
  if (value.includes("identity") || value.includes("credential") || value.includes("user")) return "IDENTITY";
  if (value.includes("cloud") || value.includes("workload") || value.includes("container")) return "CLOUD";
  if (value.includes("endpoint") || value.includes("host")) return "ENDPOINT";
  if (value.includes("network") || value.includes("firewall")) return "NETWORK";
  if (value.includes("email")) return "EMAIL";
  if (value.includes("saas")) return "SAAS";
  if (value.includes("data") || value.includes("secret")) return "DATA";
  if (value.includes("vuln") || value.includes("cve") || value.includes("threat") || value.includes("indicator")) return "THREAT_INTEL";
  if (value.includes("secops") || value.includes("incident") || value.includes("alert")) return "SECOPS";
  return "AI";
}

export function toObservedSignal(event: EventRow): ObservedSignal {
  return {
    id: event.id,
    tenantId: event.tenantId,
    domain: inferDomain(event),
    source: event.sourceId,
    state: "OBSERVED",
    observedAt: event.observedAt.toISOString(),
    summary: event.summary ?? `${event.eventType}${event.subject ? `: ${event.subject}` : ""}`,
    assetIds: event.assetIds,
    evidenceIds: event.evidenceIds,
    metadata: { bridgeEventId: event.eventId, severity: event.severity, action: event.action, sourceEventState: event.state, contentHash: event.contentHash, normalized: event.normalized },
  };
}

function normalizeEvent(source: SourceRow, input: DataBridgeEventInput) {
  const eventId = input.eventId?.trim() || `evt_${sha256(input).slice(0, 32)}`;
  const observedAt = input.observedAt ? new Date(input.observedAt) : new Date();
  if (Number.isNaN(observedAt.getTime())) throw new Error("invalid_observed_at");
  const normalized = {
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
    id: randomUUID(),
    tenantId: source.tenantId,
    sourceId: source.id,
    eventId,
    eventType: normalized.eventType,
    schemaVersion: "1",
    observedAt,
    severity: normalized.severity,
    subject: normalized.subject,
    action: normalized.action,
    state: normalized.state,
    summary: normalized.summary,
    assetIds: normalized.assetIds,
    evidenceIds: normalized.evidenceIds,
    normalized,
    rawPayload: input,
    contentHash: sha256(normalized),
  };
}

function readBearer(request: Request): string | null {
  const explicit = request.headers.get("x-elitze-source-token")?.trim();
  if (explicit) return explicit;
  const authorization = request.headers.get("authorization")?.trim();
  return authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() || null : null;
}

export function assertRequestSize(request: Request): void {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_REQUEST_BYTES) throw new Error("request_too_large");
}

export function parseIngestBody(body: unknown) {
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) throw new Error(`invalid_bridge_payload:${parsed.error.issues.map((issue) => issue.path.join(".")).join(",")}`);
  return parsed.data;
}

export function issueSourceToken(): string { return randomBytes(TOKEN_BYTES).toString("base64url"); }
export function sourceTokenDigest(token: string): string { return tokenHash(token); }

export async function authenticateSource(request: Request): Promise<SourceRow | null> {
  const token = readBearer(request);
  if (!token) return null;
  const rows = await getDb().select().from(dataBridgeSources).where(and(eq(dataBridgeSources.tokenHash, tokenHash(token)), eq(dataBridgeSources.active, true))).limit(1);
  return rows[0] ?? null;
}

export async function provisionSource(args: { tenantId: string; name: string; kind: string; description?: string }) {
  const tenantId = args.tenantId.trim();
  const name = args.name.trim();
  if (!tenantId) throw new Error("tenant_id_required");
  if (tenantId.length > 200) throw new Error("tenant_id_too_long");
  if (!name || name.length > 200) throw new Error("source_name_invalid");
  const token = issueSourceToken();
  const [source] = await getDb().insert(dataBridgeSources).values({ tenantId, name, slug: `${slugify(name)}-${randomUUID().slice(0, 8)}`, kind: args.kind.trim().slice(0, 80) || "external", description: args.description?.trim() || null, tokenHash: tokenHash(token), tokenPrefix: token.slice(0, 10), active: true }).returning();
  return { source, token };
}

export async function ingestEvents(source: SourceRow, body: unknown) {
  const parsed = parseIngestBody(body);
  const db = getDb();
  const audit = new AuditLedger();
  const results: Array<{ eventId: string; status: DataBridgeEventStatus }> = [];
  for (const input of parsed.events) {
    const normalized = normalizeEvent(source, input);
    const [inserted] = await db.insert(dataBridgeEvents).values({ ...normalized, status: "ACCEPTED" }).onConflictDoNothing({ target: [dataBridgeEvents.tenantId, dataBridgeEvents.sourceId, dataBridgeEvents.eventId] }).returning();
    if (!inserted) { results.push({ eventId: normalized.eventId, status: "DUPLICATE" }); continue; }
    results.push({ eventId: normalized.eventId, status: "ACCEPTED" });
    await audit.append(source.tenantId, "data_bridge.ingested", { sourceId: source.id, sourceKind: source.kind, eventId: normalized.eventId, eventType: normalized.eventType, contentHash: normalized.contentHash });
  }
  const accepted = results.filter((result) => result.status === "ACCEPTED").length;
  if (accepted > 0) {
    await db.update(dataBridgeSources).set({ lastIngestAt: new Date(), eventsAccepted: sql`${dataBridgeSources.eventsAccepted} + ${accepted}`, updatedAt: new Date() }).where(eq(dataBridgeSources.id, source.id));
    await db.update(dataSources).set({ lastIngestAt: new Date(), eventsToday: sql`${dataSources.eventsToday} + ${accepted}` }).where(eq(dataSources.slug, source.slug));
  }
  return { tenantId: source.tenantId, sourceId: source.id, accepted, duplicates: results.length - accepted, results };
}

export async function listEvents(args: { tenantId: string; sourceId?: string; limit?: number }) {
  const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
  const conditions = [eq(dataBridgeEvents.tenantId, args.tenantId)];
  if (args.sourceId) conditions.push(eq(dataBridgeEvents.sourceId, args.sourceId));
  return getDb().select().from(dataBridgeEvents).where(and(...conditions)).orderBy(desc(dataBridgeEvents.receivedAt)).limit(limit);
}

export async function observeEvents(args: { tenantId: string; sourceId?: string; limit?: number }) {
  const events = await listEvents(args);
  return events.map(toObservedSignal);
}

export async function health(tenantId?: string) {
  const db = getDb();
  const sources = tenantId
    ? await db.select({ id: dataBridgeSources.id, name: dataBridgeSources.name, tenantId: dataBridgeSources.tenantId, active: dataBridgeSources.active, lastIngestAt: dataBridgeSources.lastIngestAt, eventsAccepted: dataBridgeSources.eventsAccepted }).from(dataBridgeSources).where(eq(dataBridgeSources.tenantId, tenantId))
    : await db.select({ id: dataBridgeSources.id, name: dataBridgeSources.name, tenantId: dataBridgeSources.tenantId, active: dataBridgeSources.active, lastIngestAt: dataBridgeSources.lastIngestAt, eventsAccepted: dataBridgeSources.eventsAccepted }).from(dataBridgeSources);
  const accepted = tenantId
    ? await db.select({ count: sql<number>`count(*)` }).from(dataBridgeEvents).where(and(eq(dataBridgeEvents.tenantId, tenantId), eq(dataBridgeEvents.status, "ACCEPTED")))
    : await db.select({ count: sql<number>`count(*)` }).from(dataBridgeEvents).where(eq(dataBridgeEvents.status, "ACCEPTED"));
  return { sources, acceptedEvents: Number(accepted[0]?.count ?? 0) };
}
