import { createHash } from "node:crypto";
import type { SecurityConnectorId, SecurityConnectorDefinition } from "@/lib/elitze-secure/security-source-fabric-types";
import { getSecurityConnector } from "@/lib/elitze-secure/security-source-fabric-types";

export { SECURITY_CONNECTORS, SECURITY_CONNECTOR_IDS, getSecurityConnector, isSecurityConnectorId, type SecurityConnectorDefinition, type SecurityConnectorStatus, type SecurityConnectorId } from "@/lib/elitze-secure/security-source-fabric-types";

const env = (name: string) => process.env[name]?.trim() || "";

const timeoutFetch = async (url: string, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

function configured(definition: SecurityConnectorDefinition) {
  if (definition.mode === "REFERENCE") return true;
  return definition.credentialEnv.every((name) => Boolean(env(name)))
    && (!definition.endpointEnv || Boolean(env(definition.endpointEnv)));
}

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  return "{" + Object.keys(value as Record<string, unknown>).sort().map((key) =>
    JSON.stringify(key) + ":" + stableJson((value as Record<string, unknown>)[key])
  ).join(",") + "}";
};

export const stablePayloadHash = (value: unknown) =>
  createHash("sha256").update(stableJson(value)).digest("hex");

export async function probeSecurityConnector(id: SecurityConnectorId) {
  const definition = getSecurityConnector(id);
  if (definition.mode === "COLLECTOR" || definition.mode === "SCANNER") {
    return {
      id,
      health: "NOT_CONFIGURED" as const,
      integrationState: "IMPLEMENTED" as const,
      evidenceState: "UNKNOWN" as const,
      detail: "An external collector or isolated runner is required.",
    };
  }

  const url = definition.endpointEnv ? env(definition.endpointEnv) : definition.defaultEndpoint;
  if (!url) throw new Error(id + "_endpoint_unconfigured");

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = definition.credentialEnv[0] ? env(definition.credentialEnv[0]) : "";
  if (token && id !== "misp") headers.Authorization = "Bearer " + token;

  if (id === "opencti") {
    const response = await timeoutFetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ about { version } }" }),
    });
    if (!response.ok) throw new Error("opencti_http_" + response.status);
  } else if (id === "wazuh") {
    const username = env("ELITZE_WAZUH_USERNAME");
    const password = env("ELITZE_WAZUH_PASSWORD");
    const auth = Buffer.from(username + ":" + password).toString("base64");
    const authResponse = await timeoutFetch(url.replace(/\/$/, "") + "/security/user/authenticate", {
      method: "POST",
      headers: { Accept: "application/json", Authorization: "Basic " + auth },
    });
    if (!authResponse.ok) throw new Error("wazuh_auth_http_" + authResponse.status);
    const authBody = await authResponse.json().catch(() => ({})) as { data?: { token?: string } };
    if (!authBody.data?.token) throw new Error("wazuh_auth_token_missing");
    const response = await timeoutFetch(url.replace(/\/$/, "") + "/", {
      headers: { Accept: "application/json", Authorization: "Bearer " + authBody.data.token },
    });
    if (!response.ok) throw new Error("wazuh_http_" + response.status);
  } else if (id === "fleetdm") {
    const response = await timeoutFetch(url.replace(/\/$/, "") + "/api/v1/fleet/me", { headers });
    if (!response.ok) throw new Error("fleetdm_http_" + response.status);
  } else if (id === "misp") {
    const response = await timeoutFetch(url.replace(/\/$/, "") + "/servers/getPyMISPVersion.json", {
      headers: { Accept: "application/json", Authorization: env("ELITZE_MISP_TOKEN") },
    });
    if (!response.ok) throw new Error("misp_http_" + response.status);
  } else if (id === "thehive") {
    const statusPath = env("ELITZE_THEHIVE_STATUS_PATH") || "/api/v1/status";
    const response = await timeoutFetch(url.replace(/\/$/, "") + statusPath, { headers });
    if (!response.ok) throw new Error("thehive_http_" + response.status);
  } else {
    const response = await timeoutFetch(url, { headers });
    if (!response.ok) throw new Error(id + "_http_" + response.status);
  }

  return {
    id,
    health: "CONNECTED" as const,
    integrationState: "INTEGRATED" as const,
    evidenceState: "OBSERVED" as const,
    detail: "Live provider path responded successfully.",
  };
}

export async function ingestSecurityFabricEvent(tenantId: string, input: {
  connectorId: SecurityConnectorId;
  eventType: string;
  subjectKey?: string;
  evidenceState?: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  observedAt?: string;
  sourceRef?: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  if (!tenantId.trim()) throw new Error("tenant_id_required");
  const { getPgPool } = await import("@/db");
  const payload = input.payload ?? {};
  const metadata = input.metadata ?? {};
  const contentHash = stablePayloadHash({
    connectorId: input.connectorId,
    eventType: input.eventType,
    subjectKey: input.subjectKey ?? null,
    evidenceState: input.evidenceState ?? "OBSERVED",
    severity: input.severity ?? null,
    observedAt: input.observedAt ?? null,
    sourceRef: input.sourceRef ?? null,
    payload,
    metadata,
  });
  const db = getPgPool();
  const eventResult = await db.query(
    "INSERT INTO security_fabric_events " +
    "(tenant_id,connector_id,event_type,subject_key,evidence_state,severity,observed_at,source_ref,content_hash,payload,metadata) " +
    "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) " +
    "ON CONFLICT (tenant_id,connector_id,content_hash) DO NOTHING RETURNING id",
    [
      tenantId, input.connectorId, input.eventType, input.subjectKey ?? null,
      input.evidenceState ?? "OBSERVED", input.severity ?? null,
      input.observedAt ?? new Date().toISOString(), input.sourceRef ?? null,
      contentHash, payload, metadata,
    ],
  );
  await db.query(
    "INSERT INTO security_fabric_sources " +
    "(tenant_id,connector_id,health_state,last_observed_at,last_error,metadata) " +
    "VALUES ($1,$2,'CONNECTED',now(),NULL,$3) " +
    "ON CONFLICT (tenant_id,connector_id) DO UPDATE SET " +
    "health_state='CONNECTED',last_observed_at=now(),last_error=NULL,last_error_at=NULL,updated_at=now()",
    [tenantId, input.connectorId, JSON.stringify({ lastEventHash: contentHash })],
  );
  return {
    inserted: eventResult.rowCount === 1,
    eventId: eventResult.rows[0]?.id ?? null,
    contentHash,
  };
}
