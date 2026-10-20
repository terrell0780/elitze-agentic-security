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
  title: { default: "ELITZE Agentic Security | See the threat. Control the path. Prove the fix.", template: "%s | ELITZE Agentic Security" },
  description: "ELITZE Agentic Security protects sensitive execution paths with identity-aware access control, reachability analysis, policy enforcement, runtime observation, and evidence-backed remediation.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: ["ELITZE Agentic Security", "cybersecurity platform", "agentic security", "MCP security", "API security", "runtime threat detection", "identity security", "policy enforcement", "security evidence", "continuous security validation", "vulnerability management", "exposure management", "security operations", "authorized execution"],
  creator: "ELITZE", publisher: "ELITZE", authors: [{ name: "ELITZE" }],
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", siteName: "ELITZE Agentic Security", title: "ELITZE Agentic Security | See the threat. Control the path. Prove the fix.", description: "Identity-aware security controls for agents, MCP servers, APIs, tools, and sensitive execution paths—with evidence you can verify.", locale: "en_CA" },
  twitter: { card: "summary_large_image", title: "ELITZE Agentic Security | See the threat. Control the path. Prove the fix.", description: "Security decision, policy enforcement, runtime observation, and evidence-backed remediation." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061018" }, { media: "(prefers-color-scheme: light)", color: "#f6fafc" }] };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", alternateName: "ELITZE Agentic Security", url: siteUrl, description: "Cybersecurity controls for agent identities, MCP servers, APIs, tools, and sensitive execution paths." };
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ELITZE Agentic Security",
  url: siteUrl,
  description: "See the threat. Control the path. Prove the fix.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /></head><body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-cyan-400/20 selection:text-[var(--text)]"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--panel-strong)] focus:px-4 focus:py-3 focus:text-sm">Skip to content</a><Analytics /><AccessibilityRepair />{children}<GlobalThemeToggle /></body></html>;
}
