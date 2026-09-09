import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GlobalThemeToggle from "@/components/global-theme-toggle";
import Analytics from "@/components/analytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ELITZE | Agentic Security Control Plane", template: "%s | ELITZE" },
  description: "ELITZE is an agentic security control plane for software, cloud, identities, AI agents and runtime behavior, built around governed decisions and verified outcomes.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: ["agentic security", "AI security", "application security", "AI agent security", "MCP security", "runtime security", "attack path analysis", "exploit validation", "security control plane", "automated remediation"],
  creator: "ELITZE",
  publisher: "ELITZE",
  authors: [{ name: "ELITZE" }],
  alternates: { canonical: siteUrl },
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", url: siteUrl, siteName: "ELITZE Agentic Security", title: "ELITZE | Agentic Security Control Plane", description: "One governed security system for software, cloud, identity, AI agents and runtime behavior.", locale: "en_CA" },
  twitter: { card: "summary_large_image", title: "ELITZE | Agentic Security Control Plane", description: "One governed security system for software, cloud, identity, AI agents and runtime behavior." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#07040a" }, { media: "(prefers-color-scheme: light)", color: "#f7f8fa" }] };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", url: siteUrl, description: "Agentic security control plane for software, cloud, identities, AI agents and runtime behavior." };
const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "ELITZE Agentic Security", url: siteUrl, description: "Agentic security with governed decisions, security graph context and verified remediation." };
const softwareSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "ELITZE Agentic Security", applicationCategory: "SecurityApplication", operatingSystem: "Web", url: siteUrl, description: "Security control plane for software, cloud, identities, AI agents and runtime behavior." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} /></head><body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-red-500/20 selection:text-[var(--text)]"><Analytics />{children}<GlobalThemeToggle /></body></html>;
}
