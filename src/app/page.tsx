import type { Metadata } from "next";
import PublicLandingPage from "@/components/home/public-landing-page";

export const metadata: Metadata = {
  title: "ELITZE Agentic Security | Govern AI agents and sensitive execution",
  description: "ELITZE Agentic Security governs AI agents, MCP servers, APIs, tools, and sensitive execution with identity-aware controls, runtime observation, and evidence-backed remediation.",
  alternates: { canonical: "/" },
  // Social titles must match the rendered document title. The root layout supplies a
  // branded default, so an unset openGraph/twitter block makes the card disagree with the tab.
  openGraph: {
    title: "ELITZE Agentic Security | Govern AI agents and sensitive execution",
    description: "Identity-aware controls, runtime observation, and evidence-backed remediation for AI agents, MCP servers, APIs, and sensitive execution paths.",
    url: "/",
  },
  twitter: {
    title: "ELITZE Agentic Security | Govern AI agents and sensitive execution",
    description: "Identity-aware controls, runtime observation, and evidence-backed remediation for AI agents, MCP servers, APIs, and sensitive execution paths.",
  },
};

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <PublicLandingPage />
    </main>
  );
}
