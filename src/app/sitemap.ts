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
  "/security-disclosure",
  "/accessibility",
  "/legal",
  "/legal/ownership",
  "/help",
  "/contact",
  "/search",
  "/agentic-soc",
  "/threat-detection",
  "/adversary-emulation",
  "/integrations",
  "/recursive-agents",
  "/docs",
  "/contributing",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${productionConfig.canonicalOrigin}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/security" || path === "/compliance" || path === "/platform" ? 0.9 : 0.7,
  }));
}
