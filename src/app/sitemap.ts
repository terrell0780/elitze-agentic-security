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
  "/orchestration",
  "/reo",
  "/search",
  "/privacy",
  "/terms",
  "/sales",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : path === "/search" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/sales" || path === "/security" || path === "/platform" || path === "/search" ? 0.9 : 0.7,
  }));
}
