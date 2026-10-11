import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/docs";

export const metadata: Metadata = {
  title: "Technical Documentation",
  description: "ELITZE Agentic Security documentation for architecture, security boundaries, source evidence and malware scanning.",
  alternates: { canonical: url },
  openGraph: {
    type: "website",
    url,
    title: "ELITZE Agentic Security Documentation",
    description: "Architecture, evidence policy, supported workflows and security guidance.",
  },
};

export default function DocumentationPage() {
  return (
    <SeoFeaturePage
      eyebrow="ELITZE / documentation"
      title="Read the architecture. Understand the evidence."
      description="Public documentation explains ELITZE's product boundaries, safe development practices and supported security workflows. Documentation is not a substitute for live connection tests or tenant evidence."
      sectionTitle="Public documentation library"
      panels={[
        {
          title: "Product FAQ",
          body: "Agent identity, MCP runtime security, evidence states, integrations and the limits of automated analysis.",
          state: "Public",
        },
        {
          title: "About ELITZE",
          body: "Product mission, security control loop, authorization boundaries and verifiable evidence requirements.",
          state: "Public",
        },
        {
          title: "Contributing guide",
          body: "Development, disposable test databases, tenant isolation, source-only evidence, quality gates and release requirements.",
          state: "Public",
        },
        {
          title: "Malware scanning",
          body: "Private scanner configuration, fail-closed upload behavior, verdict handling, retention and external data-transfer boundaries.",
          state: "Security policy",
        },
      ]}
      links={[
        { title: "FAQ", href: "/docs/faq.md", description: "Product and architecture answers." },
        { title: "About ELITZE", href: "/docs/about.md", description: "Product mission and control model." },
        { title: "Contributing", href: "/docs/contributing.md", description: "Secure development guide." },
        { title: "Malware scanning", href: "/docs/malware-scanning.md", description: "Upload scanning requirements and limitations." },
        { title: "Threat detection", href: "/threat-detection", description: "Source-bound detection logic." },
        { title: "Security architecture", href: "/security", description: "Identity, policy, execution and evidence." },
      ]}
    />
  );
}
