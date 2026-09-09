import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";

const routes = [
  ["/", 1, "weekly"],
  ["/platform", 0.9, "monthly"],
  ["/security", 0.9, "monthly"],
  ["/use-cases", 0.85, "monthly"],
  ["/compare", 0.8, "monthly"],
  ["/about", 0.7, "monthly"],
  ["/faq", 0.7, "monthly"],
  ["/mythos", 0.65, "monthly"],
  ["/reo", 0.65, "monthly"],
  ["/privacy", 0.3, "yearly"],
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(([path, priority, changeFrequency]) => ({
    url: `${siteUrl}${path}`,
    changeFrequency,
    priority,
  }));
}
