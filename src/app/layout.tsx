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
  title: { default: "Continuous Pentesting, Governed by Evidence", template: "%s | ELITZE Agentic Security" },
  description: "A continuous penetration testing platform for CI/CD: automate security testing every release, verify fixes with evidence-backed retests, and govern access through a multi-tenant security control plane. Live execution claims depend on verified runner results.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: ["ELITZE Agentic Security", "continuous penetration testing platform", "pentest as a service for CI/CD", "automated security testing every release", "fix verification", "retest automation", "multi-tenant security control plane", "continuous pentesting", "release assurance", "API security testing", "security retesting", "vulnerability management", "security evidence", "continuous security validation", "exposure management"],
  creator: "ELITZE", publisher: "ELITZE", authors: [{ name: "ELITZE" }],
  ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  openGraph: { type: "website", siteName: "ELITZE Agentic Security", title: "Continuous Pentesting, Governed by Evidence", description: "Continuous penetration testing for CI/CD, automated security testing on every release, evidence-backed fix verification, and a multi-tenant security control plane.", locale: "en_CA" },
  twitter: { card: "summary_large_image", title: "Continuous Pentesting, Governed by Evidence", description: "Continuous penetration testing for CI/CD, automated security testing on every release, evidence-backed fix verification, and a multi-tenant security control plane." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#061018" }, { media: "(prefers-color-scheme: light)", color: "#f6fafc" }] };

const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: "ELITZE", alternateName: "ELITZE Agentic Security", url: siteUrl, description: "Continuous penetration testing, CI/CD security validation, evidence-backed retest automation, and a multi-tenant security control plane for sensitive execution paths." };
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
  return <html lang="en" className="dark" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}` }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} /></head><body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-cyan-400/20 selection:text-[var(--text)]"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--panel-strong)] focus:px-4 focus:py-3 focus:text-sm">Skip to content</a><Analytics /><AccessibilityRepair />{children}<GlobalThemeToggle /></body></html>;
}
