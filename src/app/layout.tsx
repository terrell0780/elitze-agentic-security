import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze-agentic-security.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ELITZE · Agentic Security", template: "%s · ELITZE" },
  description: "ELITZE is an agentic application security platform for continuous pentesting, exploit validation, automated remediation, secrets, SAST, supply-chain security, runtime defense and AI guardrails.",
  applicationName: "ELITZE · Agentic Security",
  category: "cybersecurity",
  keywords: ["agentic security", "AI security", "application security", "continuous pentesting", "automated remediation", "SAST", "secrets scanning", "software supply chain security", "runtime security", "AI guardrails", "MCP security"],
  creator: "ELITZE",
  publisher: "ELITZE",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website", url: siteUrl, siteName: "ELITZE · Agentic Security",
    title: "ELITZE · Agentic Security",
    description: "Pentest every release. Patch automatically. Continuous application security with agentic guardrails.",
  },
  twitter: { card: "summary_large_image", title: "ELITZE · Agentic Security", description: "Pentest every release. Patch automatically." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07040a" };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", url: siteUrl };
const websiteSchema = { "@context": "https://schema.org", "@type": "WebSite", name: "ELITZE · Agentic Security", url: siteUrl };
const softwareSchema = {
  "@context": "https://schema.org", "@type": "SoftwareApplication", name: "ELITZE · Agentic Security", applicationCategory: "SecurityApplication", operatingSystem: "Web", url: siteUrl,
  description: "Continuous application security with automated pentesting, remediation validation and agentic guardrails."
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
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-red-500/20 selection:text-[var(--text)]">{children}</body>
    </html>
  );
}
