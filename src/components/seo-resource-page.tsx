import type { Metadata } from "next";
import SeoFeaturePage from "@/components/seo-feature-page";
import { productionConfig } from "@/config/production";
import { seoResources, type SeoResource } from "@/lib/seo-resource-data";

export function seoResourceMetadata(resource: SeoResource): Metadata {
  const url = `${productionConfig.canonicalOrigin}/${resource.slug}`;
  return {
    title: `${resource.title} | ELITZE`,
    description: resource.description,
    keywords: resource.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${resource.title} | ELITZE`,
      description: resource.description,
      siteName: "ELITZE Agentic Security",
    },
    twitter: {
      card: "summary",
      title: `${resource.title} | ELITZE`,
      description: resource.description,
    },
  };
}

export default function SeoResourcePage({ slug }: { slug: string }) {
  const resource = seoResources[slug];
  if (!resource) return null;
  return (
    <SeoFeaturePage
      eyebrow={resource.eyebrow}
      title={resource.title}
      description={resource.description}
      sectionTitle={resource.sectionTitle}
      panels={resource.panels}
      links={resource.links}
    />
  );
}
