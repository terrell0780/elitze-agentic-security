import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GlobalThemeToggle from "@/components/global-theme-toggle";
import Analytics from "@/components/analytics";
import AccessibilityRepair from "@/components/accessibility-repair";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.info";
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ELITZE Agentic Security | AI Security Control Plane", template: "%s | ELITZE Agentic Security" },
  description: "ELITZE Agentic Security provides an evidence-backed control path for agent identity, MCP servers, tools, reachability, policy enforcement, authorized execution, runtime observation and retesting.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: ["ELITZE Agentic Security", "agentic security", "AI agent security", "AI security", "MCP security", "LLM security", "API security", "AI governance", "agent runtime security", "security control plane", "security decision plane", "security evidence", "continuous security validation", "vulnerability management", "exposure management", "security operations", "SOC automation"],
  creator: "ELITZE", publisher: "ELITZE", authors: [{ name: "ELITZE" }],
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  alternates: { canonical: siteUrl },
  openGraph: { type: "website", url: siteUrl, siteName: "ELITZE Agentic Security", title: "ELITZE Agentic Security | See the threat. Control the path. Prove the fix.", description: "A security decision and evidence plane for AI agents, software, cloud, identity, APIs and runtime behavior.", locale: "en_CA" },
  twitter: { card: "summary_large_image", title: "ELITZE Agentic Security | See the threat. Control the path. Prove the fix.", description: "Security decision, policy enforcement and verification for the agentic enterprise." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061018" }, { media: "(prefers-color-scheme: light)", color: "#f6fafc" }] };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", alternateName: "ELITZE Agentic Security", url: siteUrl, description: "Security decision and evidence plane for AI agents, software, cloud, identity, APIs and runtime behavior." };
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
