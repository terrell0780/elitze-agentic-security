export type ElitzeGatewayChannel = "LLM" | "MCP" | "A2A" | "API" | "BROWSER" | "SAAS";

export type GatewayRequest = {
  tenantId: string;
  requestId: string;
  channel: ElitzeGatewayChannel;
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

export type GatewayDecision = {
  requestId: string;
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  reasons: string[];
  controls: string[];
};

export function evaluateGatewayRequest(input: GatewayRequest): GatewayDecision {
  const reasons: string[] = [];
  const controls = ["identity", "tenant-boundary", "policy", "budget", "rate-limit"];
  if (!input.tenantId) reasons.push("missing tenant boundary");
  if (!input.actorId) reasons.push("missing actor identity");
  if (input.channel === "MCP" && !input.tool?.name) reasons.push("missing MCP tool identity");
  if (input.actorType === "AGENT" && !input.agentId) reasons.push("missing agent identity");
  if ((input.riskSignals || []).includes("critical")) reasons.push("critical risk signal");
  return {
    requestId: input.requestId,
    decision: reasons.length ? "BLOCK" : "ALLOW",
    reasons,
    controls,
  };
}
