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
  "/how-to",
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
  "/penetration-testing",
  "/vulnerability-scanning",
  "/network-security",
  "/web-application-security",
  "/offensive-security",
  "/security-integrations",
  "/ai-agent-security",
  "/mcp-security",
  "/attack-surface-management",
  "/security-operations",
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
