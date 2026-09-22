import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.info";

const routes = [
  "/",
  "/platform",
  "/security",
  "/compliance",
  "/use-cases",
  "/compare",
  "/about",
  "/faq",
  "/orchestration",
  "/reo",
  "/privacy",
  "/terms",
  "/sales",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/sales" || path === "/security" || path === "/compliance" || path === "/platform" ? 0.9 : 0.7,
  }));
}
