import type { Metadata } from "next";
import SiteHeader from "@/components/home/site-header";
import HeroSection from "@/components/home/hero-section";
import BrandMarquee from "@/components/home/brand-marquee";
import ControlModelSection from "@/components/home/control-model-section";
import EndpointIntegrationSection from "@/components/home/endpoint-integration-section";
import AboutPromoSection from "@/components/home/about-promo-section";
import ValidationSection from "@/components/home/validation-section";
import WorkspaceCtaSection from "@/components/home/workspace-cta-section";
import SiteFooter from "@/components/home/site-footer";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader />

      <HeroSection />

      <BrandMarquee />

      <ControlModelSection />

      <EndpointIntegrationSection />

      <AboutPromoSection />

      <ValidationSection />

      <WorkspaceCtaSection />

      <SiteFooter />
    </main>
  );
}
