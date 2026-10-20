import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GlobalThemeToggle from "@/components/global-theme-toggle";
import Analytics from "@/components/analytics";
import AccessibilityRepair from "@/components/accessibility-repair";
import { productionConfig } from "@/config/production";

const siteUrl = productionConfig.canonicalOrigin;
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Enterprise Cybersecurity Built on Evidence", template: "%s | ELITZE Agentic Security" },
  description: "ELITZE Agentic Security maps exposed execution paths, enforces identity-bound access, and verifies remediation with source-attributed security evidence.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: ["ELITZE Agentic Security", "enterprise cybersecurity", "continuous penetration testing", "attack surface mapping", "application security", "API security", "identity security", "privileged access security", "MCP security", "security posture management", "vulnerability remediation", "security validation", "security operations", "AI agent security"],
  creator: "ELITZE", publisher: "ELITZE", authors: [{ name: "ELITZE" }],
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", siteName: "ELITZE Agentic Security", title: "Enterprise Cybersecurity Built on Evidence", description: "Map exposed execution paths, enforce identity-bound access, and verify remediation with source-attributed security evidence.", locale: "en_CA" },
  twitter: { card: "summary_large_image", title: "Enterprise Cybersecurity Built on Evidence", description: "Map exposed execution paths, enforce identity-bound access, and verify remediation with source-attributed security evidence." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061018" }, { media: "(prefers-color-scheme: light)", color: "#f6fafc" }] };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", alternateName: "ELITZE Agentic Security", url: siteUrl, description: "Evidence-governed security testing and identity-aware control for AI agents, APIs, and sensitive execution paths." };
const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ELITZE Agentic Security",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: "Enterprise cybersecurity controls for identity-bound access, exposed API and tool paths, security validation, and evidence-backed remediation.",
  keywords: [
    "enterprise cybersecurity",
    "attack surface mapping",
    "API security",
    "identity security",
    "MCP security",
    "security validation",
    "vulnerability remediation",
    "security operations",
  ],
  featureList: [
    "Identity-bound authorization",
    "API and tool reachability mapping",
    "Policy enforcement for sensitive execution paths",
    "Evidence-backed security validation and retesting",
    "Tenant-scoped security records",
  ],
};
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ELITZE Agentic Security",
  url: siteUrl,
  description: "Continuous Pentesting, Governed by Evidence.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }} /></head><body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-cyan-400/20 selection:text-[var(--text)]"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--panel-strong)] focus:px-4 focus:py-3 focus:text-sm">Skip to content</a><Analytics /><AccessibilityRepair />{children}<GlobalThemeToggle /></body></html>;
}
