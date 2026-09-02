import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/platform`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/use-cases`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
