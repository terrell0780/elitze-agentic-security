import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/console/"] },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Google-InspectionTool", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "OAI-AdsBot", allow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
