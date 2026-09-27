import type { MetadataRoute } from "next";
import { productionConfig } from "@/config/production";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/console/", "/login", "/register", "/forgot-password", "/reset-password", "/auth/", "/sales/access"],
      },
    ],
    sitemap: `${productionConfig.canonicalOrigin}/sitemap.xml`,
  };
}
