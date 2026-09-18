import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GlobalThemeToggle from "@/components/global-theme-toggle";
import Analytics from "@/components/analytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ELITZE Agentic Security | AI Security Control Plane", template: "%s | ELITZE Agentic Security" },
  description: "ELITZE Agentic Security provides an evidence-backed control path for agent identity, MCP servers, tools, reachability, policy enforcement, authorized execution, runtime observation and retesting.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: ["ELITZE Agentic Security", "agent identity security", "MCP runtime security", "AI agent security", "agent reachability", "tool authorization", "security control plane", "security evidence", "runtime security", "security validation"],
  creator: "ELITZE", publisher: "ELITZE", authors: [{ name: "ELITZE" }],
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  alternates: { canonical: siteUrl },
  openGraph: { type: "website", url: siteUrl, siteName: "ELITZE Agentic Security", title: "ELITZE Agentic Security | Discover. Control. Prove.", description: "Evidence-backed security controls for agent identity, MCP runtime paths, policy enforcement and verification.", locale: "en_CA" },
  twitter: { card: "summary_large_image", title: "ELITZE Agentic Security | Discover. Control. Prove.", description: "Evidence-backed security controls for agent identity, MCP runtime paths, policy enforcement and verification." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061018" }, { media: "(prefers-color-scheme: light)", color: "#f6fafc" }] };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", alternateName: "ELITZE Agentic Security", url: siteUrl, description: "Security decision and evidence plane for AI agents, software, cloud, identity, APIs and runtime behavior." };
const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "ELITZE Agentic Security", url: siteUrl, description: "See the threat. Control the path. Prove the fix." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /></head><body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-cyan-400/20 selection:text-[var(--text)]"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--panel-strong)] focus:px-4 focus:py-3 focus:text-sm">Skip to content</a><Analytics />{children}<GlobalThemeToggle /></body></html>;
}
