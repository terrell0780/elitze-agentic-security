import type { MetadataRoute } from "next";
import { productionConfig } from "@/config/production";

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
  "/legal",
  "/legal/ownership",
  "/sales",
  "/help",
  "/contact",
  "/search",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${productionConfig.canonicalOrigin}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/sales" || path === "/security" || path === "/compliance" || path === "/platform" ? 0.9 : 0.7,
  }));
}
