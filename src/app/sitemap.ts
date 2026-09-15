import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";

const securityTopics = [
  "agent-identity-security",
  "mcp-runtime-security",
  "agent-reachability",
  "ai-tool-authorization",
  "agentic-security-evidence",
  "autonomous-agent-governance",
  "prompt-injection-runtime-controls",
  "non-human-identity-security",
  "ai-security-control-plane",
  "agent-security-graph",
] as const;

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
  "/privacy",
  "/terms",
  "/sales",
  ...securityTopics.map((slug) => `/security/topics/${slug}`),
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : path.startsWith("/security/topics/") ? "monthly" : "monthly",
    priority: path === "/" ? 1 : path === "/sales" || path === "/security" || path === "/platform" ? 0.9 : path.startsWith("/security/topics/") ? 0.8 : 0.7,
  }));
}
