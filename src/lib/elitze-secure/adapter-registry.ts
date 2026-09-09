import type { SecurityAdapter } from "@/lib/elitze-secure/defense-fabric";
import { createConfiguredAdapter } from "@/lib/elitze-secure/production-adapters";

function configuredAdapters(): SecurityAdapter[] {
  const definitions = [
    { id: "microsoft-graph-security", domain: "SECOPS" as const, endpoint: process.env.ELITZE_GRAPH_SECURITY_URL, token: process.env.ELITZE_GRAPH_SECURITY_TOKEN },
    { id: "okta-system-log", domain: "IDENTITY" as const, endpoint: process.env.ELITZE_OKTA_SYSTEM_LOG_URL, token: process.env.ELITZE_OKTA_SYSTEM_LOG_TOKEN },
    { id: "github-security", domain: "APPLICATION" as const, endpoint: process.env.ELITZE_GITHUB_SECURITY_URL, token: process.env.ELITZE_GITHUB_SECURITY_TOKEN },
    { id: "threat-intelligence", domain: "THREAT_INTEL" as const, endpoint: process.env.ELITZE_THREAT_INTEL_URL, token: process.env.ELITZE_THREAT_INTEL_TOKEN },
    { id: "response-orchestrator", domain: "SECOPS" as const, endpoint: process.env.ELITZE_RESPONSE_URL, token: process.env.ELITZE_RESPONSE_TOKEN },
    { id: "cloud-security", domain: "CLOUD" as const, endpoint: process.env.ELITZE_CLOUD_SECURITY_URL, token: process.env.ELITZE_CLOUD_SECURITY_TOKEN },
    { id: "endpoint-security", domain: "ENDPOINT" as const, endpoint: process.env.ELITZE_ENDPOINT_SECURITY_URL, token: process.env.ELITZE_ENDPOINT_SECURITY_TOKEN },
    { id: "network-security", domain: "NETWORK" as const, endpoint: process.env.ELITZE_NETWORK_SECURITY_URL, token: process.env.ELITZE_NETWORK_SECURITY_TOKEN },
  ];

  return definitions
    .map((definition) => createConfiguredAdapter(definition))
    .filter((adapter): adapter is SecurityAdapter => adapter !== null);
}

export function createDefaultDefenseAdapters(): SecurityAdapter[] {
  return configuredAdapters();
}
