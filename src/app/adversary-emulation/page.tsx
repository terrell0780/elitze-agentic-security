import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";

const url = productionConfig.canonicalOrigin + "/adversary-emulation";
export const metadata: Metadata = {
  title: "Authorized Adversary Emulation and Purple Teaming",
  description: "Plan evidence-led, authorized adversary emulation with MITRE ATT&CK technique references, rules of engagement, scope validation, and verified runner status.",
  alternates: { canonical: url },
  openGraph: { type: "website", url, title: "ELITZE Adversary Emulation", description: "ATT&CK-guided validation with explicit authorization and a verifiable result boundary." },
};

export default function Page() {
  return <SeoFeaturePage
    eyebrow="Adversary emulation / purple team"
    title="Test the control path—only inside an approved scope."
    description="ELITZE combines an official MITRE ATT&CK technique catalogue with explicit rules of engagement and the existing signed security-runner boundary. ATT&CK plans provide technique context; they are not represented as executed emulation until a compatible, authorised executor reports a verified result."
    panels={[
      { title: "ATT&CK technique library", body: "Techniques, tactics, platforms, descriptions, and links are retrieved from MITRE's official Enterprise STIX dataset. Stale or unavailable source data is not replaced by a fabricated catalogue.", state: "Live source" },
      { title: "Rules of engagement", body: "Every execution request requires an HTTPS target, an allowlisted scope/profile, an authorization reference, and a future expiry time. The runner independently enforces target allowlists, safe DNS resolution, port rules, and signed callbacks.", state: "Required" },
      { title: "Nuclei validation boundary", body: "The existing runner executes its configured scanner profile. Selecting an ATT&CK technique creates a plan/reference—not proof that a technique was emulated. Technique-specific emulators require a compatible authorised executor.", state: "Capability boundary" },
      { title: "Purple-team evidence", body: "Preserve timestamps, result hashes, scanner findings, technique references, policy decisions, and retest outcomes. A successful scan process does not itself prove every remediation worked.", state: "Evidence lifecycle" },
      { title: "Approval-aware automation", body: "Scheduled runs require explicit valid scope and unexpired authorization. Unconfigured runner state remains RUNNER_NOT_CONFIGURED and never becomes a synthetic success.", state: "Fail closed" },
      { title: "AttackIQ compatibility", body: "The design follows public adversary-emulation principles and ATT&CK mapping. No undocumented AttackIQ API or vendor credential is assumed; a direct platform integration remains NOT_CONFIGURED until its supported contract is supplied.", state: "No invented connector" }
    ]}
    links={[
      { title: "Adversary emulation workspace", href: "/console/adversary-emulation", description: "Choose official techniques and create an explicitly authorised validation request." },
      { title: "Pentest / runner status", href: "/console/pentesting", description: "Review current request, runner, scope and evidence status." },
      { title: "Threat detection", href: "/console/threat-detection", description: "Correlate resulting observations without manufacturing coverage." },
      { title: "Read the security disclosure", href: "/security-disclosure", description: "Review responsible testing and disclosure boundaries." }
    ]}
  />;
}
