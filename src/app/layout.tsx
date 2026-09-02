import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze-agentic-security.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ELITZE · Agentic Security",
    template: "%s · ELITZE",
  },
  description:
    "ELITZE · Agentic Security — security control for identities, agents, tools, data and runtime containment.",
  applicationName: "ELITZE · Agentic Security",
  creator: "ELITZE",
  publisher: "ELITZE",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "ELITZE · Agentic Security",
    title: "ELITZE · Agentic Security",
    description:
      "Security control for identities, agents, tools, data and runtime containment.",
  },
  twitter: {
    card: "summary",
    title: "ELITZE · Agentic Security",
    description:
      "Security control for identities, agents, tools, data and runtime containment.",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ELITZE",
  url: siteUrl,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ELITZE · Agentic Security",
  url: siteUrl,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="bg-[#07040a] text-slate-100 antialiased selection:bg-red-500/30 selection:text-red-100">
        {children}
      </body>
    </html>
  );
}
