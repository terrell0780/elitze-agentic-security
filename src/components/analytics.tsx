"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const ga4 = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const ads = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

type ConsentState = "unknown" | "granted" | "denied";

function readConsent(): ConsentState {
  if (typeof document === "undefined") return "unknown";
  const match = document.cookie.match(/(?:^|; )elitze_consent=([^;]+)/);
  const value = match?.[1];
  return value === "granted" || value === "denied" ? value : "unknown";
}

export default function Analytics() {
  const [consent, setConsent] = useState<ConsentState>("unknown");

  useEffect(() => {
    const update = () => setConsent(readConsent());
    update();
    window.addEventListener("elitze-consent-changed", update);
    return () => window.removeEventListener("elitze-consent-changed", update);
  }, []);

  const primaryId = ga4 || ads;
  if (!primaryId || consent !== "granted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-and-ads" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});gtag("consent","update",{analytics_storage:"granted",ad_storage:"granted",ad_user_data:"granted",ad_personalization:"granted"});${ga4 ? `gtag("config","${ga4}",{send_page_view:true});` : ""}${ads ? `gtag("config","${ads}");` : ""}`}
      </Script>
    </>
  );
}
