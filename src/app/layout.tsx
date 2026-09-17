import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import GlobalThemeToggle from "@/components/global-theme-toggle";
import Analytics from "@/components/analytics";
import AccessibilityRepair from "@/components/accessibility-repair";
import CookieConsent from "@/components/cookie-consent";

const siteUrl = "https://elitze.ca";
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION;
const baiduVerification = process.env.NEXT_PUBLIC_BAIDU_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ELITZE Agentic Security | AI Security Control Plane",
    template: "%s | ELITZE Agentic Security",
  },
  description:
    "ELITZE Agentic Security is a security control plane for AI agents, MCP, APIs, software, cloud, identity and runtime operations.",
  applicationName: "ELITZE Agentic Security",
  category: "cybersecurity",
  keywords: [
    "ELITZE Agentic Security",
    "ELITZE",
    "agentic security",
    "AI agent security",
    "AI security",
    "MCP security",
    "LLM security",
    "API security",
    "AI governance",
    "agent runtime security",
    "security control plane",
    "security decision plane",
    "security evidence",
    "continuous security validation",
    "vulnerability management",
    "exposure management",
    "security operations",
    "SOC automation",
  ],
  creator: "ELITZE",
  publisher: "ELITZE",
  authors: [{ name: "ELITZE" }],
  alternates: { canonical: siteUrl },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
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
    title:
      "ELITZE Agentic Security | See the threat. Control the path. Prove the fix.",
    description:
      "Security decision, policy enforcement and verification for the agentic enterprise.",
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "ELITZE Agentic Security | See the threat. Control the path. Prove the fix.",
    description:
      "Security decision, policy enforcement and verification for the agentic enterprise.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#061018" },
    { media: "(prefers-color-scheme: light)", color: "#f6fafc" },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ELITZE",
  alternateName: "ELITZE Agentic Security",
  url: siteUrl,
  description:
    "Security control plane for AI agents, software, cloud, identity, APIs and runtime behavior.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ELITZE Agentic Security",
  alternateName: "ELITZE",
  url: siteUrl,
  description:
    "Security control plane for AI agents, MCP, APIs, software, cloud, identity and runtime operations.",
  inLanguage: "en-CA",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-CA" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('elitze-theme');if(t){document.documentElement.dataset.theme=t;document.documentElement.className=t==='light'?'light':'dark'}}catch(e){}",
          }}
        />
        {googleVerification ? (
          <meta
            name="google-site-verification"
            content={googleVerification}
          />
        ) : null}
        {bingVerification ? (
          <meta name="msvalidate.01" content={bingVerification} />
        ) : null}
        {yandexVerification ? (
          <meta name="yandex-verification" content={yandexVerification} />
        ) : null}
        {baiduVerification ? (
          <meta name="baidu-site-verification" content={baiduVerification} />
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased selection:bg-cyan-400/20 selection:text-[var(--text)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--panel-strong)] focus:px-4 focus:py-3 focus:text-sm"
        >
          Skip to content
        </a>
        <Analytics />
        <AccessibilityRepair />
        <CookieConsent />
        {children}
        <GlobalThemeToggle />
      </body>
    </html>
  );
}
