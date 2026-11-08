import type { Metadata } from "next";
import ProductWorkspaceHome from "@/components/home/product-workspace-home";

export const metadata: Metadata = {
  title: "ELITZE Security Workspace",
  description: "Interactive security workspace for dashboards, investigations, governed chat, validation tools, integrations and evidence.",
  alternates: { canonical: "/" },
  // Social titles must match the rendered document title. The root layout supplies a
  // branded default, so an unset openGraph/twitter block makes the card disagree with the tab.
  openGraph: {
    title: "ELITZE Security Workspace",
    description: "Interactive security workspace for dashboards, investigations, governed chat, validation tools, integrations and evidence.",
    url: "/",
  },
  twitter: {
    title: "ELITZE Security Workspace",
    description: "Interactive security workspace for dashboards, investigations, governed chat, validation tools, integrations and evidence.",
  },
};

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <ProductWorkspaceHome />
    </main>
  );
}
