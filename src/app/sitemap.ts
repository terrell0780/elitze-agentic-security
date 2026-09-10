import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";

const routes = [
  "/",
  "/platform",
  "/security",
  "/use-cases",
  "/compare",
  "/about",
  "/faq",
  "/mythos",
  "/reo",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
  }));
}
