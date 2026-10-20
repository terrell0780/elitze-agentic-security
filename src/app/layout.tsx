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
  title: { default: "Enterprise Cybersecurity Platform", template: "%s | ELITZE Agentic Security" },
  description: "Enterprise cybersecurity platform for identities, APIs, connected systems, and sensitive execution paths, with continuous testing, threat detection, vulnerability intelligence, and evidence-backed remediation.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: [
    "ELITZE Agentic Security",
    "enterprise cybersecurity",
    "cybersecurity platform",
    "continuous penetration testing",
    "attack surface management",
    "vulnerability management",
    "security validation",
    "API security",
    "runtime security",
    "agent security",
    "MCP security",
    "threat detection",
    "security operations",
    "exposure management",
    "evidence-backed remediation",
  ],
  creator: "ELITZE",
  publisher: "ELITZE",
  authors: [{ name: "ELITZE" }],
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: {
    type: "website",
    siteName: "ELITZE Agentic Security",
    title: "Enterprise Cybersecurity Platform",
    description: "Enterprise cybersecurity with continuous testing, threat detection, vulnerability intelligence, and evidence-backed remediation for enterprise systems.",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Enterprise Cybersecurity Platform",
    description: "Enterprise cybersecurity with continuous testing, threat detection, vulnerability intelligence, and evidence-backed remediation for enterprise systems.",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061018" }, { media: "(prefers-color-scheme: light)", color: "#f6fafc" }] };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", alternateName: "ELITZE Agentic Security", url: siteUrl, description: "Enterprise cybersecurity, continuous security testing, threat detection, and evidence-backed remediation for identities, APIs, and sensitive execution paths." };
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ELITZE Agentic Security",
  url: siteUrl,
  description: "Enterprise cybersecurity with continuous testing and evidence-backed remediation.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ELITZE Agentic Security",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: "Enterprise cybersecurity for identities, APIs, connected systems, and sensitive execution paths, with continuous testing and evidence-backed remediation.",
  keywords: "enterprise cybersecurity, cybersecurity platform, penetration testing, attack surface management, vulnerability management, API security, runtime security, threat detection, security operations",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }} /></head><body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-cyan-400/20 selection:text-[var(--text)]"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--panel-strong)] focus:px-4 focus:py-3 focus:text-sm">Skip to content</a><Analytics /><AccessibilityRepair />{children}<GlobalThemeToggle /></body></html>;
}
