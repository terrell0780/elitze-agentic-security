import type { MetadataRoute } from "next";
import { productionConfig } from "@/config/production";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/console/", "/workspace", "/sales", "/acquisition", "/buyers", "/login", "/register", "/forgot-password", "/reset-password", "/auth/"],
      },
    ],
    sitemap: `${productionConfig.canonicalOrigin}/sitemap.xml`,
  };
}
