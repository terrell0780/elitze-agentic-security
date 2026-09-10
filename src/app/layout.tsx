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
  description: "ELITZE Agentic Security is a governed security control plane for AI agents, MCP, APIs, software, cloud, identity, data and runtime behavior.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: [
    "ELITZE Agentic Security",
    "agentic security",
    "AI security",
    "AI agent security",
    "MCP security",
    "LLM security",
    "API security",
    "AI governance",
    "AI security gateway",
    "agent runtime security",
    "security control plane",
    "application security",
    "cloud security",
    "identity security",
    "data security",
    "exposure management",
    "vulnerability management",
    "software supply chain security",
    "security operations",
    "continuous security validation",
  ],
  creator: "ELITZE",
  publisher: "ELITZE",
  authors: [{ name: "ELITZE" }],
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "ELITZE Agentic Security",
    title: "ELITZE Agentic Security | AI Security Control Plane",
    description: "Policy enforcement at the point of generation, not after the fact.",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "ELITZE Agentic Security | AI Security Control Plane",
    description: "Policy enforcement at the point of generation, not after the fact.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07040a" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ELITZE",
  url: siteUrl,
  description: "ELITZE Agentic Security: a governed security control plane for AI agents, software, cloud, identity, data and runtime behavior.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ELITZE Agentic Security",
  url: siteUrl,
  description: "AI and agentic security with policy enforcement, security graph context, continuous validation and verified evidence.",
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ELITZE Agentic Security",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: "Security control plane for AI agents, MCP, APIs, software, cloud, identity, data and runtime behavior.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-red-500/20 selection:text-[var(--text)]">
        <Analytics />
        {children}
        <GlobalThemeToggle />
      </body>
    </html>
  );
}
