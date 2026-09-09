import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GlobalThemeToggle from "@/components/global-theme-toggle";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.elitze.ca";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ELITZE | See the threat. Control the path. Prove the fix.", template: "%s | ELITZE" },
  description: "ELITZE is an agentic security control plane for software, cloud, identities, AI agents and runtime behavior, built around governed decisions and verified outcomes.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: ["agentic security","AI security","application security","attack path analysis","security graph","runtime security","AI agent security","MCP security","exploit validation","automated remediation"],
  creator: "ELITZE",
  publisher: "ELITZE",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", url: siteUrl, siteName: "ELITZE Agentic Security", title: "ELITZE | See the threat. Control the path. Prove the fix.", description: "A security control plane for software, cloud, identities, AI agents and runtime behavior." },
  twitter: { card: "summary_large_image", title: "ELITZE | See the threat. Control the path. Prove the fix.", description: "See the threat. Control the path. Prove the fix." },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#07040a" }, { media: "(prefers-color-scheme: light)", color: "#f7f8fa" }] };
const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", url: siteUrl };
const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "ELITZE Agentic Security", url: siteUrl, description: "Agentic security with governed decisions, security graph context and verified remediation." };
const softwareSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "ELITZE Agentic Security", applicationCategory: "SecurityApplication", operatingSystem: "Web", url: siteUrl, description: "Security control plane for software, cloud, identities, AI agents and runtime behavior." };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} /></head><body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-red-500/20 selection:text-[var(--text)]">{children}<GlobalThemeToggle /></body></html>; }
