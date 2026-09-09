import type {
  ActionResult,
  AuthorizedAction,
  ObservedSignal,
  SecurityAdapter,
  SecurityDomain,
} from "@/lib/elitze-secure/defense-fabric";

export type HttpJsonAdapterConfig = {
  id: string; domain: SecurityDomain; endpoint: string; token?: string; headers?: Record<string, string>; queryParam?: string; integration?: "IMPLEMENTED" | "INTEGRATED";
};
type JsonRecord = Record<string, unknown>;
function isRecord(value: unknown): value is JsonRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function clean(value: unknown, fallback: string): string { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function toSignal(item: unknown, config: HttpJsonAdapterConfig, tenantId: string, index: number): ObservedSignal {
  const record = isRecord(item) ? item : { value: item };
  const severity = clean(record.severity ?? record.risk ?? record.priority, "unknown");
  const title = clean(record.title ?? record.name ?? record.message ?? record.description, "Observed security signal");
  const sourceId = clean(record.id ?? record._id, `${config.id}:${index}`);
  const observedAt = clean(record.observedAt ?? record.createdAt ?? record.updatedAt ?? record.timestamp, new Date().toISOString());
  const assets = Array.isArray(record.assetIds) ? record.assetIds.filter((value): value is string => typeof value === "string") : undefined;
  const evidence = Array.isArray(record.evidenceIds) ? record.evidenceIds.filter((value): value is string => typeof value === "string") : undefined;
  return { id: `${config.id}:${sourceId}`, tenantId, domain: config.domain, source: config.id, state: "OBSERVED", observedAt, summary: `${title} (severity=${severity})`, assetIds: assets, evidenceIds: evidence, metadata: record };
}
function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [payload];
  for (const key of ["items", "findings", "alerts", "incidents", "events", "results", "data"]) { const value = payload[key]; if (Array.isArray(value)) return value; }
  return [payload];
}

export class HttpJsonSecurityAdapter implements SecurityAdapter {
  readonly id: string; readonly domain: SecurityDomain; readonly integration: "IMPLEMENTED" | "INTEGRATED"; private readonly config: HttpJsonAdapterConfig;
  constructor(config: HttpJsonAdapterConfig) {
    if (!/^https:\/\//i.test(config.endpoint)) throw new Error(`Security adapter ${config.id} endpoint must use HTTPS`);
    this.config = config; this.id = config.id; this.domain = config.domain; this.integration = config.integration ?? "INTEGRATED";
  }
  health() { return this.config.endpoint && this.config.token ? "CONNECTED" as const : "NOT_CONFIGURED" as const; }
  async collect(tenantId: string, query?: string): Promise<ObservedSignal[]> {
    if (this.health() !== "CONNECTED") return [];
    const url = new URL(this.config.endpoint);
    if (query && this.config.queryParam) url.searchParams.set(this.config.queryParam, query);
    const headers = new Headers(this.config.headers); headers.set("accept", "application/json"); headers.set("authorization", `Bearer ${this.config.token}`); headers.set("x-elitze-tenant", tenantId);
    const response = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(15_000), cache: "no-store" });
    if (!response.ok) throw new Error(`${this.id} returned HTTP ${response.status}`);
    return extractItems(await response.json()).map((item, index) => toSignal(item, this.config, tenantId, index));
  }
  async execute(action: AuthorizedAction): Promise<ActionResult> {
    if (this.health() !== "CONNECTED") return { state: "FAILED", actionId: action.id, target: action.target, summary: "Connector is not configured or connected.", evidenceIds: [] };
    const headers = new Headers(this.config.headers); headers.set("accept", "application/json"); headers.set("content-type", "application/json"); headers.set("authorization", `Bearer ${this.config.token}`);
    const response = await fetch(this.config.endpoint, { method: "POST", headers, signal: AbortSignal.timeout(15_000), body: JSON.stringify({ tenantId: action.tenantId, action: action.action, target: action.target, risk: action.risk, evidenceIds: action.evidenceIds }), cache: "no-store" });
    if (!response.ok) return { state: "FAILED", actionId: action.id, target: action.target, summary: `${this.id} rejected the action with HTTP ${response.status}.`, evidenceIds: [] };
    const payload = await response.json().catch(() => ({}));
    const evidenceIds = isRecord(payload) && Array.isArray(payload.evidenceIds) ? payload.evidenceIds.filter((value): value is string => typeof value === "string") : [];
    return { state: "EXECUTED", actionId: action.id, target: action.target, summary: `${this.id} accepted the authorized action.`, evidenceIds };
  }
}

export function createConfiguredAdapter(args: { id: string; domain: SecurityDomain; endpoint?: string; token?: string; queryParam?: string }): SecurityAdapter {
  if (!args.endpoint) {
    return { id: args.id, domain: args.domain, integration: "PLANNED", health: () => "NOT_CONFIGURED" };
  }
  return new HttpJsonSecurityAdapter({ id: args.id, domain: args.domain, endpoint: args.endpoint, token: args.token, queryParam: args.queryParam ?? "q" });
}
