/**
 * ELITZE Portable Client
 *
 * Reusable server-side TypeScript client for calling the ELITZE Agentic Security
 * control plane from other applications.
 *
 * This client exposes the ELITZE capabilities that currently exist as HTTP
 * control endpoints. It does not claim to be a standalone model-inference SDK.
 * A future ELITZE model-generation endpoint can be added here without changing
 * the integration surface used by consuming projects.
 *
 * Example:
 *   const elitze = new ElitzeClient({
 *     baseUrl: process.env.ELITZE_URL ?? "https://www.elitze.info",
 *     apiKey: process.env.ELITZE_API_KEY,
 *   });
 *
 *   const decision = await elitze.securityDecision({ ... });
 */

export type ElitzeDecision = "APPROVE" | "REVIEW" | "QUEUE" | "BLOCK";
export type ElitzeEvidenceState = "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
export type ElitzeGatewayDecision = "ALLOW" | "REVIEW" | "BLOCK";
export type ElitzeAgentRiskAction = "ALLOW" | "REVIEW" | "RESTRICT" | "BLOCK";
export type ElitzeReoDecision = "APPROVE" | "REVIEW" | "QUEUE" | "BLOCK";

export type ElitzeClientOptions = {
  /** ELITZE deployment URL, for example https://www.elitze.info. */
  baseUrl?: string;
  /** API credential for protected ELITZE control-plane endpoints. Server-side only. */
  apiKey?: string;
  /** Optional custom fetch implementation for Node, tests, or edge runtimes. */
  fetch?: typeof globalThis.fetch;
};

export type SecurityDecisionInput = {
  tenantId: string;
  subjectId: string;
  subjectType: "CONTENT" | "AGENT_ACTION" | "TOOL_CALL" | "MCP_CALL" | "DEPLOYMENT";
  action: string;
  evidenceState?: ElitzeEvidenceState;
  trustScore?: number | null;
  [key: string]: unknown;
};

export type SecurityDecisionResult = {
  subjectId: string;
  subjectType: SecurityDecisionInput["subjectType"];
  decision: ElitzeDecision;
  trustScore: number | null;
  hardPolicyFailures: Array<{
    policyId: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    reason: string;
    hardGate: boolean;
  }>;
  evidenceState: ElitzeEvidenceState;
  observedAt: string;
  auditEventId: string;
};

export type GatewayRequest = {
  tenantId: string;
  requestId: string;
  channel: "LLM" | "MCP" | "A2A" | "API" | "BROWSER" | "SAAS";
  actorId: string;
  actorType: "HUMAN" | "AGENT" | "WORKLOAD";
  agentId?: string;
  model?: { provider: string; name: string };
  tool?: { name: string; server?: string };
  projectId?: string;
  estimatedTokens?: number;
  estimatedCost?: number;
  riskSignals?: string[];
};

export type GatewayDecisionResult = {
  requestId: string;
  decision: ElitzeGatewayDecision;
  reasons: string[];
  controls: string[];
};

export type AgentRiskInput = {
  autonomy: number;
  privilege: number;
  monitorability: number;
  delegationDepth: number;
  persistence: number;
  dataSensitivity: number;
};

export type AgentRiskResult = {
  score: number;
  action: ElitzeAgentRiskAction;
};

export type ReoInput = {
  provenance: {
    contentId: string;
    tenantId: string;
    authorId: string;
    modelId: string | null;
    modelProvider: string | null;
    sourceIds: string[];
    generationTimestamp: string | null;
    revisionChain: string[];
    humanContributors: string[];
    evidenceHashes: string[];
    mediaHashes: string[];
    contentHash: string;
  };
  content: string;
  evidence: Array<{ id: string; contentHash: string; verified: boolean }>;
  uniqueness?: {
    semanticSimilarity: number | null;
    lexicalSimilarity: number | null;
    structuralSimilarity: number | null;
    headingSimilarity: number | null;
    entityOverlap: number | null;
    templateFingerprintMatch: boolean | null;
    ctaSimilarity: number | null;
    internalLinkPatternSimilarity: number | null;
    crossDomainSimilarity: number | null;
    clusterId: string | null;
  };
  risk?: Partial<{
    scale: number | null;
    duplication: number | null;
    thinness: number | null;
    factuality: number | null;
    staleness: number | null;
    policy: number | null;
    provenance: number | null;
    reputation: number | null;
  }>;
  policyFailures?: string[];
  queueRequested?: boolean;
};

export type ReoResult = {
  contentId: string;
  decision: ElitzeReoDecision;
  trustScore: number | null;
  hardPolicyFailures: string[];
  riskDimensions: {
    scale: number | null;
    duplication: number | null;
    thinness: number | null;
    factuality: number | null;
    staleness: number | null;
    policy: number | null;
    provenance: number | null;
    reputation: number | null;
  };
  provenanceVerified: boolean;
  evidenceVerified: boolean;
  uniqueness: number | null;
  semanticClusterId: string | null;
  auditEventId: string | null;
};

export type ElitzeErrorBody = {
  error?: string;
  [key: string]: unknown;
};

export class ElitzeApiError extends Error {
  readonly status: number;
  readonly body: ElitzeErrorBody | unknown;

  constructor(message: string, status: number, body: ElitzeErrorBody | unknown) {
    super(message);
    this.name = "ElitzeApiError";
    this.status = status;
    this.body = body;
  }
}

export class ElitzeClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(options: ElitzeClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "https://elitze.info").replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** Health is intentionally unauthenticated and contains no secret material. */
  async health<T = unknown>(): Promise<T> {
    return this.request<T>("/api/health", { method: "GET" });
  }

  /** Evaluate a governed security decision for content, agent actions, tools, MCP calls, or deployments. */
  async securityDecision(input: SecurityDecisionInput): Promise<SecurityDecisionResult> {
    return this.request<SecurityDecisionResult>("/api/security/decision", {
      method: "POST",
      body: JSON.stringify(input),
      authenticated: true,
    });
  }

  /** Evaluate an AI gateway request across LLM, MCP, A2A, API, browser, or SaaS channels. */
  async gatewayDecision(input: GatewayRequest): Promise<GatewayDecisionResult> {
    return this.request<GatewayDecisionResult>("/api/security/gateway/decision", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** Assess agent autonomy, privilege, monitorability, delegation, persistence, and data sensitivity. */
  async agentRisk(input: AgentRiskInput): Promise<AgentRiskResult> {
    return this.request<AgentRiskResult>("/api/agent/risk", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** Assess content provenance, evidence, uniqueness, and risk through ELITZE REO. */
  async reoContentDecision(input: ReoInput): Promise<ReoResult> {
    return this.request<ReoResult>("/api/reo/content-decision", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  /** Generic escape hatch for a current or future ELITZE endpoint. */
  async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: BodyInit | null;
      headers?: HeadersInit;
      authenticated?: boolean;
    } = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body !== undefined && options.body !== null && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    if ((options.authenticated ?? false) && !this.apiKey) {
      throw new Error("ELITZE API key required for this operation. Keep it server-side.");
    }
    if (this.apiKey) headers.set("x-elitze-api-key", this.apiKey);

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ELITZE request failed";
      throw new Error(`ELITZE request failed: ${message}`);
    }

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      const apiError = parsed && typeof parsed === "object" ? parsed : { error: String(parsed ?? "request_failed") };
      throw new ElitzeApiError(`ELITZE API returned HTTP ${response.status}`, response.status, apiError);
    }

    return parsed as T;
  }
}

export function createElitzeClient(options: ElitzeClientOptions = {}): ElitzeClient {
  return new ElitzeClient(options);
}

export default ElitzeClient;
