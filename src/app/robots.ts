import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.elitze.info";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/console/", "/login", "/register", "/auth/", "/sales/access"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
