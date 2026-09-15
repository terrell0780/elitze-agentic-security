import { z } from "zod";
import type { DataBridgeEventInput } from "@/lib/elitze-secure/data-bridge";

export type DataBridgeTransport = "WEBHOOK" | "REST_PULL" | "EVENT_STREAM" | "MCP" | "CUSTOM";
export type DataBridgeCapability = "INGEST" | "HEALTH" | "DISCOVERY" | "NORMALIZE" | "PUBLISH" | "EXECUTE";

export type DataBridgeConnectionConfig = {
  endpoint?: string;
  token?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** AWS IAM access key for SigV4 connections. Never log or expose this value. */
  accessKeyId?: string;
  /** AWS IAM secret key for SigV4 connections. Never log or expose this value. */
  secretAccessKey?: string;
  /** AWS region used to scope SigV4 requests. */
  region?: string;
  /** Temporary AWS session token, when using short-lived credentials. */
  sessionToken?: string;
};

export type DataBridgeConnectorContext = {
  tenantId: string;
  sourceId: string;
  sourceName: string;
};

export type DataBridgeConnectionResult = {
  ok: boolean;
  status: "CONNECTED" | "AUTHENTICATED" | "UNAVAILABLE" | "INVALID_CONFIG";
  detail: string;
};

export type DataBridgeConnector = {
  id: string;
  displayName: string;
  version: string;
  transports: readonly DataBridgeTransport[];
  capabilities: readonly DataBridgeCapability[];
  connect(config: DataBridgeConnectionConfig, context: DataBridgeConnectorContext): Promise<DataBridgeConnectionResult>;
  normalize?(payload: unknown, context: DataBridgeConnectorContext): DataBridgeEventInput[];
  health?(config: DataBridgeConnectionConfig, context: DataBridgeConnectorContext): Promise<DataBridgeConnectionResult>;
  publish?(events: readonly DataBridgeEventInput[], config: DataBridgeConnectionConfig, context: DataBridgeConnectorContext): Promise<{ accepted: number; rejected: number }>;
};

type JsonRecord = Record<string, unknown>;

const connectorManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,80}$/),
  displayName: z.string().min(1).max(160),
  version: z.string().min(1).max(40),
  transports: z.array(z.enum(["WEBHOOK", "REST_PULL", "EVENT_STREAM", "MCP", "CUSTOM"])).min(1),
  capabilities: z.array(z.enum(["INGEST", "HEALTH", "DISCOVERY", "NORMALIZE", "PUBLISH", "EXECUTE"])).min(1),
});

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateConnectorManifest(connector: Pick<DataBridgeConnector, "id" | "displayName" | "version" | "transports" | "capabilities">) {
  return connectorManifestSchema.parse({ ...connector });
}

export function createGenericHttpJsonConnector(): DataBridgeConnector {
  return {
    id: "generic-http-json",
    displayName: "Generic HTTPS JSON Security Source",
    version: "1",
    transports: ["WEBHOOK", "REST_PULL"],
    capabilities: ["INGEST", "HEALTH", "NORMALIZE"],
    async connect(config) {
      if (!config.endpoint) return { ok: false, status: "INVALID_CONFIG", detail: "endpoint_required" };
      if (!/^https:\/\//i.test(config.endpoint)) return { ok: false, status: "INVALID_CONFIG", detail: "https_endpoint_required" };
      if (!config.token) return { ok: false, status: "INVALID_CONFIG", detail: "token_required" };
      return { ok: true, status: "AUTHENTICATED", detail: "configuration_valid" };
    },
    normalize(payload, context) {
      if (!isJsonRecord(payload)) {
        return [{ eventType: "source.payload", subject: context.sourceId, summary: "Observed non-object source payload", payload: { value: payload } }];
      }

      const record = payload;
      const items: unknown[] = Array.isArray(record.items)
        ? record.items
        : Array.isArray(record.events)
          ? record.events
          : Array.isArray(record.findings)
            ? record.findings
            : [record];

      return items.map((item, index): DataBridgeEventInput => {
        const value: JsonRecord = isJsonRecord(item) ? item : { value: item };
        const eventId = typeof value.id === "string" ? value.id : `${context.sourceId}:${index}`;
        const assetIds = Array.isArray(value.assetIds)
          ? value.assetIds.filter((entry: unknown): entry is string => typeof entry === "string")
          : undefined;
        const evidenceIds = Array.isArray(value.evidenceIds)
          ? value.evidenceIds.filter((entry: unknown): entry is string => typeof entry === "string")
          : undefined;

        return {
          eventId,
          eventType: typeof value.eventType === "string" ? value.eventType : "source.event",
          observedAt: typeof value.observedAt === "string" ? value.observedAt : undefined,
          severity: typeof value.severity === "string" ? value.severity : undefined,
          subject: typeof value.subject === "string" ? value.subject : undefined,
          action: typeof value.action === "string" ? value.action : undefined,
          state: typeof value.state === "string" ? value.state : "OBSERVED",
          summary: typeof value.summary === "string" ? value.summary : undefined,
          assetIds,
          evidenceIds,
          metadata: { connector: "generic-http-json", sourceId: context.sourceId },
          payload: value,
        };
      });
    },
    async health(config, context) {
      return this.connect(config, context);
    },
  };
}

export function getBuiltInDataBridgeConnectors(): DataBridgeConnector[] {
  return [createGenericHttpJsonConnector()];
}
