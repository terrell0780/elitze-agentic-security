import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/threat-detection";
export const metadata: Metadata = {
  title: "Threat Detection and Security Signal Correlation",
  description: "Deterministic ELITZE threat detection correlates authenticated tenant observations with source-linked evidence, explicit uncertainty, and approval-gated response.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "ELITZE Threat Detection", description: "Source-backed detections, clear uncertainty, and controlled security response." },
};

export default function Page() {
  return <SeoFeaturePage
    eyebrow="Threat detection / continuous validation"
    title="Detect the signal. Preserve the proof. Control the response."
    description="ELITZE's threat-detection path evaluates authenticated tenant security events marked OBSERVED. Rules prioritize source-authored high-impact alerts, correlated authentication failures, explicit credential/exfiltration signals, and sensitive-tool policy denials. Results include source references and event IDs for investigation."
    panels={[
      { title: "Observed-source gate", body: "INFERRED, UNKNOWN, simulated, or otherwise non-observed rows do not enter deterministic matches. No telemetry is not interpreted as no threat.", state: "Evidence gated" },
      { title: "Authentication failure clustering", body: "Three or more source-identified authentication failures for the same subject are correlated within a 30-minute window. The rule recommends review; it does not automatically block an identity.", state: "Deterministic rule" },
      { title: "Explicit exfiltration / credential signals", body: "Only source-authored indicators that explicitly name credential exposure or exfiltration can trigger the rule. Generic network activity is not labelled exfiltration.", state: "Source bounded" },
      { title: "MCP/tool policy denial", body: "A recorded denial is preserved as a possible successful control outcome—not treated as proof that an attack succeeded.", state: "Control evidence" },
      { title: "MITRE ATT&CK context", body: "Technique details are fetched from the official Enterprise STIX dataset. An ATT&CK identifier supplied by a source is kept distinct from a technique inferred from a rule.", state: "Official data" },
      { title: "3D evidence globe", body: "Interactive globe markers appear only when an observed source record provides valid latitude and longitude. The grid and sphere are visual context, not security telemetry.", state: "Observed coordinates only" }
    ]}
    links={[
      { title: "Live detection console", href: "/console/threat-detection", description: "Inspect actual tenant-scoped matches, sources, and evidence state." },
      { title: "ATT&CK technique catalogue", href: "/api/threat-intel/attack", description: "Authenticated query over the current MITRE Enterprise dataset." },
      { title: "Adversary emulation", href: "/adversary-emulation", description: "Build authorised, scoped validation plans informed by ATT&CK." },
      { title: "Security graph", href: "/console", description: "Trace observed identity-to-tool reachability and policy boundaries." }
    ]}
  />;
}
