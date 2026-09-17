import type { MetadataRoute } from "next";

const siteUrl = "https://elitze.ca";

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
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority:
      path === "/"
        ? 1
        : ["/sales", "/security", "/platform"].includes(path)
          ? 0.9
          : 0.7,
  }));
}
