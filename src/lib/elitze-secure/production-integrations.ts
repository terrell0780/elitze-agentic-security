import { createHmac, createHash } from "node:crypto";
import type { DataBridgeEventInput } from "@/lib/elitze-secure/data-bridge";
import type { DataBridgeConnectionConfig, DataBridgeConnectionResult, DataBridgeConnector, DataBridgeConnectorContext } from "@/lib/elitze-secure/data-bridge-adapter";

const DEFAULT_TIMEOUT_MS = 10_000;

type Json = Record<string, unknown>;
type GitHubDataBridgeConnectionConfig = DataBridgeConnectionConfig & {
  owner?: string;
  repository?: string;
};
type AwsDataBridgeConnectionConfig = DataBridgeConnectionConfig & {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  sessionToken?: string;
};

function isJson(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchJson(url: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const text = await response.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 4000) }; }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function authFailure(status: number, service: string): DataBridgeConnectionResult {
  if (status === 401 || status === 403) return { ok: false, status: "UNAVAILABLE", detail: `${service}_authorization_failed` };
  return { ok: false, status: "UNAVAILABLE", detail: `${service}_http_${status}` };
}

function event(sourceId: string, eventId: string, eventType: string, summary: string, payload: unknown): DataBridgeEventInput {
  const safePayload = typeof payload === "object" && payload !== null && !Array.isArray(payload) ? payload as Record<string, unknown> : { value: payload };
  return { eventId, eventType, subject: sourceId, summary, state: "OBSERVED", metadata: { sourceId }, payload: safePayload };
}

async function connectGitHub(config: DataBridgeConnectionConfig): Promise<DataBridgeConnectionResult> {
  const githubConfig = config as GitHubDataBridgeConnectionConfig;
  if (!githubConfig.token || !githubConfig.owner || !githubConfig.repository) return { ok: false, status: "INVALID_CONFIG", detail: "github_token_owner_repository_required" };
  const base = (githubConfig.endpoint || "https://api.github.com").replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${githubConfig.token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...githubConfig.headers };
  const repoPath = `/repos/${encodeURIComponent(githubConfig.owner)}/${encodeURIComponent(githubConfig.repository)}`;
  const repo = await fetchJson(`${base}${repoPath}`, { headers }, githubConfig.timeoutMs);
  if (repo.status !== 200) return authFailure(repo.status, "github");
  const runs = await fetchJson(`${base}${repoPath}/actions/runs?per_page=1`, { headers }, githubConfig.timeoutMs);
  if (runs.status !== 200) return authFailure(runs.status, "github_actions");
  return { ok: true, status: "CONNECTED", detail: "github_repository_and_actions_observed" };
}

const githubConnector: DataBridgeConnector = {
  id: "github-actions",
  displayName: "GitHub + GitHub Actions",
  version: "1",
  transports: ["REST_PULL", "WEBHOOK"],
  capabilities: ["INGEST", "HEALTH", "DISCOVERY", "NORMALIZE"],
  connect: async (config) => connectGitHub(config),
  health: async (config) => connectGitHub(config),
  normalize(payload, context) {
    if (!isJson(payload)) return [event(context.sourceId, `${context.sourceId}:github:payload`, "github.payload", "Observed GitHub payload", payload)];
    const records: DataBridgeEventInput[] = [];
    const repo = payload.repository;
    if (isJson(repo)) records.push(event(context.sourceId, `${context.sourceId}:repo:${String(repo.id ?? repo.full_name ?? "unknown")}`, "github.repository", `Observed repository ${String(repo.full_name ?? "")}`.trim(), repo));
    const runs = payload.workflow_runs;
    if (Array.isArray(runs)) for (const [index, run] of runs.entries()) records.push(event(context.sourceId, `${context.sourceId}:run:${String((isJson(run) && (run.id ?? index)) ?? index)}`, "github.actions.run", "Observed GitHub Actions workflow run", run));
    return records.length ? records : [event(context.sourceId, `${context.sourceId}:github:event`, "github.event", "Observed GitHub event", payload)];
  },
};

async function connectMcp(config: DataBridgeConnectionConfig): Promise<DataBridgeConnectionResult> {
  if (!config.endpoint) return { ok: false, status: "INVALID_CONFIG", detail: "mcp_endpoint_required" };
  if (!/^https:\/\//i.test(config.endpoint)) return { ok: false, status: "INVALID_CONFIG", detail: "mcp_https_endpoint_required" };
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json", "MCP-Protocol-Version": "2026-07-28", ...(config.headers ?? {}) };
  if (config.token) headers.Authorization = `Bearer ${config.token}`;
  const response = await fetchJson(config.endpoint, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server/discover", params: {} }) }, config.timeoutMs);
  if (response.status === 401 || response.status === 403) return authFailure(response.status, "mcp");
  if (response.status < 200 || response.status >= 300) return { ok: false, status: "UNAVAILABLE", detail: `mcp_http_${response.status}` };
  return { ok: true, status: "CONNECTED", detail: "mcp_server_discovery_observed" };
}

const mcpConnector: DataBridgeConnector = {
  id: "mcp-gateway",
  displayName: "MCP Gateway / Server",
  version: "2026-07-28",
  transports: ["MCP", "REST_PULL"],
  capabilities: ["INGEST", "HEALTH", "DISCOVERY", "NORMALIZE"],
  connect: async (config) => connectMcp(config),
  health: async (config) => connectMcp(config),
  normalize(payload, context) {
    const out: DataBridgeEventInput[] = [];
    if (isJson(payload)) {
      const result = isJson(payload.result) ? payload.result : payload;
      out.push(event(context.sourceId, `${context.sourceId}:mcp:server`, "mcp.server", "Observed MCP server discovery response", result));
      if (Array.isArray(result.tools)) for (const [index, tool] of result.tools.entries()) out.push(event(context.sourceId, `${context.sourceId}:mcp:tool:${String((isJson(tool) && (tool.name ?? index)) ?? index)}`, "mcp.tool", "Observed MCP tool capability", tool));
    } else out.push(event(context.sourceId, `${context.sourceId}:mcp:payload`, "mcp.payload", "Observed MCP payload", payload));
    return out;
  },
};

async function connectAzure(config: DataBridgeConnectionConfig): Promise<DataBridgeConnectionResult> {
  if (!config.token) return { ok: false, status: "INVALID_CONFIG", detail: "azure_bearer_token_required" };
  const base = (config.endpoint || "https://graph.microsoft.com/v1.0").replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${config.token}`, Accept: "application/json", ...config.headers };
  const org = await fetchJson(`${base}/organization?$select=id,displayName`, { headers }, config.timeoutMs);
  if (org.status !== 200) return authFailure(org.status, "microsoft_graph");
  return { ok: true, status: "CONNECTED", detail: "entra_directory_observed" };
}

const azureConnector: DataBridgeConnector = {
  id: "microsoft-entra-azure",
  displayName: "Microsoft Entra ID + Azure",
  version: "1",
  transports: ["REST_PULL", "EVENT_STREAM"],
  capabilities: ["INGEST", "HEALTH", "DISCOVERY", "NORMALIZE"],
  connect: async (config) => connectAzure(config),
  health: async (config) => connectAzure(config),
  normalize(payload, context) {
    return [event(context.sourceId, `${context.sourceId}:entra:event`, "entra.activity", "Observed Microsoft Entra / Azure activity", payload)];
  },
};

function hmac(key: Uint8Array | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function awsSigningKey(secret: string, date: string, region: string, service: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, date), region), service), "aws4_request");
}

async function awsJson(config: DataBridgeConnectionConfig, target: string, body: Json): Promise<{ status: number; body: unknown }> {
  const awsConfig = config as AwsDataBridgeConnectionConfig;
  const accessKeyId = awsConfig.accessKeyId;
  const secretAccessKey = awsConfig.secretAccessKey;
  const region = awsConfig.region;
  if (!accessKeyId || !secretAccessKey || !region) return { status: 0, body: null };
  const host = `cloudtrail.${region}.amazonaws.com`;
  const service = "cloudtrail";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const payload = JSON.stringify(body);
  const payloadHash = createHash("sha256").update(payload).digest("hex");
  const canonicalHeaders = `content-type:application/x-amz-json-1.1\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${target}\n`;
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${createHash("sha256").update(canonicalRequest).digest("hex")}`;
  const signature = createHmac("sha256", awsSigningKey(secretAccessKey, date, region, service)).update(stringToSign, "utf8").digest("hex");
  const headers: Record<string, string> = { "Content-Type": "application/x-amz-json-1.1", Host: host, "X-Amz-Date": amzDate, "X-Amz-Target": target, Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}` };
  if (awsConfig.sessionToken) headers["X-Amz-Security-Token"] = awsConfig.sessionToken;
  return fetchJson(`https://${host}/`, { method: "POST", headers, body: payload }, awsConfig.timeoutMs);
}

const awsConnector: DataBridgeConnector = {
  id: "aws-iam-cloudtrail",
  displayName: "AWS IAM + CloudTrail",
  version: "1",
  transports: ["REST_PULL", "EVENT_STREAM"],
  capabilities: ["INGEST", "HEALTH", "DISCOVERY", "NORMALIZE"],
  async connect(config) {
    const awsConfig = config as AwsDataBridgeConnectionConfig;
    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey || !awsConfig.region) return { ok: false, status: "INVALID_CONFIG", detail: "aws_access_key_secret_region_required" };
    const result = await awsJson(config, "AWSCloudTrail_20131101.LookupEvents", { MaxResults: 1 });
    if (result.status !== 200) return authFailure(result.status, "aws_cloudtrail");
    return { ok: true, status: "CONNECTED", detail: "aws_cloudtrail_lookup_observed" };
  },
  health: async (config) => awsConnector.connect(config, { tenantId: "health", sourceId: "health", sourceName: "health" }),
  normalize(payload, context) {
    const events = isJson(payload) && Array.isArray(payload.Events) ? payload.Events : [payload];
    return events.map((item, index) => event(context.sourceId, `${context.sourceId}:aws:${String((isJson(item) && (item.EventId ?? index)) ?? index)}`, "aws.cloudtrail", "Observed AWS CloudTrail activity", item));
  },
};

async function connectKubernetes(config: DataBridgeConnectionConfig): Promise<DataBridgeConnectionResult> {
  if (!config.endpoint || !/^https:\/\//i.test(config.endpoint) || !config.token) return { ok: false, status: "INVALID_CONFIG", detail: "kubernetes_https_endpoint_and_bearer_token_required" };
  const base = config.endpoint.replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${config.token}`, Accept: "application/json", ...config.headers };
  const version = await fetchJson(`${base}/version`, { headers }, config.timeoutMs);
  if (version.status !== 200) return authFailure(version.status, "kubernetes");
  const rbac = await fetchJson(`${base}/apis/rbac.authorization.k8s.io/v1/roles?limit=1`, { headers }, config.timeoutMs);
  if (rbac.status !== 200 && rbac.status !== 403) return authFailure(rbac.status, "kubernetes_rbac");
  return { ok: true, status: "CONNECTED", detail: rbac.status === 200 ? "kubernetes_version_and_rbac_observed" : "kubernetes_authenticated_rbac_permission_limited" };
}

const kubernetesConnector: DataBridgeConnector = {
  id: "kubernetes",
  displayName: "Kubernetes",
  version: "1",
  transports: ["REST_PULL", "EVENT_STREAM"],
  capabilities: ["INGEST", "HEALTH", "DISCOVERY", "NORMALIZE"],
  connect: async (config) => connectKubernetes(config),
  health: async (config) => connectKubernetes(config),
  normalize(payload, context) {
    return [event(context.sourceId, `${context.sourceId}:k8s:event`, "kubernetes.object", "Observed Kubernetes API object or event", payload)];
  },
};


type SentinelOneConnectionConfig = DataBridgeConnectionConfig & {
  /** SentinelOne Management Console origin, e.g. https://tenant.sentinelone.net */
  endpoint?: string;
};

function sentinelOneBaseUrl(config: SentinelOneConnectionConfig): URL | null {
  if (!config.endpoint || !config.token) return null;
  try {
    const parsed = new URL(config.endpoint);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || !parsed.hostname) return null;
    if (parsed.pathname !== "/" && parsed.pathname !== "" && parsed.pathname !== "/web/api/v2.1") return null;
    parsed.pathname = "/web/api/v2.1/";
    parsed.search = "";
    parsed.hash = "";
    return parsed;
  } catch {
    return null;
  }
}

async function sentinelOneGet(config: SentinelOneConnectionConfig, path: string): Promise<{ status: number; body: unknown }> {
  const base = sentinelOneBaseUrl(config);
  if (!base) return { status: 0, body: null };
  const url = new URL(path.replace(/^\//, ""), base);
  return fetchJson(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `ApiToken ${config.token}`,
      Accept: "application/json",
      ...(config.headers ?? {}),
    },
  }, config.timeoutMs);
}

function sentinelOneItems(payload: unknown): unknown[] {
  if (!isJson(payload)) return [];
  const data = payload.data;
  if (Array.isArray(data)) return data;
  if (isJson(data)) {
    for (const key of ["threats", "agents", "items"]) {
      if (Array.isArray(data[key])) return data[key] as unknown[];
    }
  }
  return [];
}

async function connectSentinelOne(config: DataBridgeConnectionConfig): Promise<DataBridgeConnectionResult> {
  const sentinelConfig = config as SentinelOneConnectionConfig;
  if (!sentinelOneBaseUrl(sentinelConfig)) {
    return { ok: false, status: "INVALID_CONFIG", detail: "sentinelone_https_console_endpoint_and_api_token_required" };
  }
  // Read-only least-privilege smoke checks. No remediation or endpoint-control actions are issued.
  const threats = await sentinelOneGet(sentinelConfig, "threats?limit=1");
  if (threats.status !== 200) return authFailure(threats.status, "sentinelone_threats");
  const agents = await sentinelOneGet(sentinelConfig, "agents?limit=1");
  if (agents.status !== 200) return authFailure(agents.status, "sentinelone_agents");
  return { ok: true, status: "CONNECTED", detail: "sentinelone_threats_and_agents_api_verified_read_only" };
}

const sentinelOneConnector: DataBridgeConnector = {
  id: "sentinelone-singularity",
  displayName: "SentinelOne Singularity Endpoint Security",
  version: "2.1",
  transports: ["REST_PULL"],
  capabilities: ["INGEST", "HEALTH", "DISCOVERY", "NORMALIZE"],
  connect: async (config) => connectSentinelOne(config),
  health: async (config) => connectSentinelOne(config),
  normalize(payload, context) {
    const records = sentinelOneItems(payload);
    if (!records.length) {
      return [event(context.sourceId, `${context.sourceId}:sentinelone:empty`, "sentinelone.observation", "SentinelOne returned no records in this response", { observed: true, recordCount: 0 })];
    }
    return records.map((record, index) => {
      const item = isJson(record) ? record : { value: record };
      const id = String(item.id ?? item.threatId ?? item.uuid ?? index);
      return event(context.sourceId, `${context.sourceId}:sentinelone:${id}`, "sentinelone.threat", "Observed SentinelOne threat or endpoint record", item);
    });
  },
};

export function getProductionIntegrationConnectors(): DataBridgeConnector[] {
  return [mcpConnector, githubConnector, awsConnector, azureConnector, kubernetesConnector, sentinelOneConnector];
}

export const PRODUCTION_INTEGRATION_SCOPE = [
  { id: "mcp-gateway", title: "MCP Gateway / Server", value: "discover servers/tools, authorize sensitive calls, preserve decision evidence, observe execution" },
  { id: "github-actions", title: "GitHub + GitHub Actions", value: "discover repositories/workflows, map workload identity, observe runs/releases, verify deployment evidence" },
  { id: "aws-iam-cloudtrail", title: "AWS IAM + CloudTrail", value: "discover IAM principals and CloudTrail activity, correlate reachability and identity, preserve API evidence" },
  { id: "microsoft-entra-azure", title: "Microsoft Entra ID + Azure", value: "discover identities/apps and Azure activity, correlate authorization and runtime evidence" },
  { id: "kubernetes", title: "Kubernetes", value: "discover workloads/RBAC/API resources, map workload identity and reachable execution surfaces, verify runtime events" },
  { id: "sentinelone-singularity", title: "SentinelOne Singularity Endpoint Security", value: "read-only connection validation, ingest real threat and endpoint records, preserve source evidence; response actions are not enabled by this connector" },
] as const;

export function productionIntegrationStatus(configured: Set<string>) {
  return PRODUCTION_INTEGRATION_SCOPE.map((item) => ({ ...item, status: configured.has(item.id) ? "INTEGRATED" as const : "BLOCKED" as const }));
}
