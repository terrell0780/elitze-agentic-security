import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/contributing";
export const metadata: Metadata = {
  title: "Contributing to ELITZE Agentic Security",
  description: "Development guide, evidence integrity rules, release gates, authorized runner limits and ways to improve ELITZE Agentic Security.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "Contributing to ELITZE", description: "Help improve security validation, tenant isolation, source evidence, accessibility and tested integrations." },
};

export default function Page() {
  return <SeoFeaturePage
    eyebrow="Documentation / contribution guide"
    title="Make security claims testable. Keep evidence real."
    description="ELITZE changes must preserve tenant isolation, source attribution, real integration state, bounded AI reasoning and verified execution. This public page follows the full contribution guide in docs/contributing.md."
    panels={[
      { title: "Local setup", body: "Use the supported Node version, install lockfile-pinned dependencies with npm ci, and configure local-only environment variables. Never copy production secrets into development." },
      { title: "Disposable test data", body: "Run auth E2E only against explicit loopback PostgreSQL test databases. Fixtures belong to tests, never production customer records." },
      { title: "Evidence lineage", body: "Preserve connector ID, source event ID, timestamp, source reference and original evidence state. Non-observed events are not detections." },
      { title: "Integration truth", body: "Do not mark an integration CONNECTED until a provider-specific live probe succeeds. Source code and saved credentials are not connectivity proof." },
      { title: "Safe execution", body: "Maintain target allowlists, private-address rejection, exact scope/profile rules, unexpired authorization, signed callbacks and approval gates. Never execute arbitrary model-generated commands." },
      { title: "Release procedure", body: "Run focused self-tests, lint, typecheck, npm audit, sale:readiness, git diff --check and production build. Promote only after mandatory CI and live integration gates are green." }
    ]}
    links={[
      { title: "Full Markdown guide", href: "/docs/contributing.md", description: "Read or save the repository's complete contribution document." },
      { title: "FAQ", href: "/faq", description: "Product behavior and evidence boundaries." },
      { title: "Security disclosure", href: "/security-disclosure", description: "Responsible disclosure and testing boundaries." },
      { title: "Integration console", href: "/console/integrations", description: "Configure tenant model providers and run live probes." }
    ]}
  />;
}
