import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/integrations";
export const metadata: Metadata = {
  title: "Security Integrations: Nmap, Metasploit, John the Ripper, MCP and SIEM",
  description: "ELITZE security integrations for Nmap XML evidence, privacy-preserving John the Ripper audit results, guarded Metasploit RPC observation, SIEM, and threat intelligence.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "ELITZE Security Integrations", description: "Connect authorized sources and preserve source-specific, tenant-scoped evidence." },
};

export default function Page() {
  return <SeoFeaturePage
    eyebrow="Integration control plane"
    title="Connect the real source. Verify the connection. Keep the evidence."
    description="ELITZE separates connector code, credentials, configured state, successful probes, and observed records. A provider name or secret variable is not proof of an operational integration. Each tenant connector must pass its provider-specific authentication and runtime check."
    panels={[
      { title: "Nmap", body: "Import Nmap XML scan results through an authenticated API. ELITZE records live-host and confirmed open-port/service observations in the tenant security graph; it rejects DTD/entity declarations and does not persist raw XML or NSE script output. Scan execution belongs on an authorized runner, not a public web server.", state: "XML evidence import implemented" },
      { title: "Metasploit Framework", body: "A separately deployed HTTPS bridge adapts the local Metasploit MessagePack RPC interface. ELITZE can verify bridge health and observe session metadata. The bridge URL and token are server-side secrets; this web endpoint does not expose arbitrary module/exploit execution.", state: "Read-only bridge; operator managed" },
      { title: "John the Ripper", body: "Import John --show audit output as summary evidence. ELITZE records cracked/remaining counts and audit metadata only. Plaintext passwords and account labels are never persisted by the importer; run password audits on a controlled, authorized worker.", state: "Privacy-preserving result import implemented" },
      { title: "NVIDIA NIM", body: "Tenant model connections use the standard NVIDIA NIM /v1 endpoint. Keys are encrypted at rest; GET /v1/models validates endpoint reachability and selected model availability. Inference success is tracked separately.", state: "Optional / probe required" },
      { title: "MCP and agent identity", body: "The security control path maps an authenticated agent/workload identity to MCP servers, tools, policy decisions, and auditable evidence. Unobserved relationships stay unknown.", state: "Tenant scoped" },
      { title: "Vulnerability intelligence", body: "NVD, CISA KEV, and FIRST EPSS provide external reference records. They do not establish that a CVE is present or reachable on a customer's asset.", state: "Reference evidence" },
      { title: "SIEM / SOAR / endpoint", body: "Source adapters require real credentials, endpoint configuration, permissions, and a successful probe or authenticated ingest. A repository implementation alone remains IMPLEMENTED, not CONNECTED.", state: "Probe required" },
      { title: "Recursive context layer", body: "ELITZE implements bounded recursive consistency review inside LangGraph. A separate direct Recursive vendor API adapter is not claimed because a supported public API contract is not configured.", state: "Direct vendor link not configured" },
      { title: "SEO / Search Console", body: "The authenticated MCP endpoint supports Google Search Console Search Analytics and GA4 Data API reports with a real access token and authorized property. Without them, performance figures remain unavailable.", state: "Live permission required" }
    ]}
    links={[
      { title: "Agentic SOC", href: "/agentic-soc", description: "LangGraph workflow and optional NVIDIA NIM configuration." },
      { title: "Threat detection", href: "/threat-detection", description: "Consume authenticated observed event streams." },
      { title: "SEO tools", href: "/reo", description: "Use the live Search Console / GA4 path when credentials are authorized." },
      { title: "Model/agent connection API", href: "/console/agentic-soc", description: "Configure, probe and inspect the selected tenant model." }
    ]}
  />;
}
