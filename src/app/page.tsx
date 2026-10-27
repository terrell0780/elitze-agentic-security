import type { Metadata } from "next";
import ProductWorkspaceHome from "@/components/home/product-workspace-home";

export const metadata: Metadata = {
  title: "ELITZE Security Workspace",
  description: "Interactive security workspace for dashboards, investigations, governed chat, validation tools, integrations and evidence.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <ProductWorkspaceHome />
    </main>
  );
}
