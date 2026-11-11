import type { Metadata } from "next";
// SeoResourcePage renders the shared SeoFeaturePage main landmark.
import SeoResourcePage, { seoResourceMetadata } from "@/components/seo-resource-page";
import { seoResources } from "@/lib/seo-resource-data";

export const metadata: Metadata = seoResourceMetadata(seoResources["penetration-testing"]);
export default function Page() { return <SeoResourcePage slug="penetration-testing" />; }
