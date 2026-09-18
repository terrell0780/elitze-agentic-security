"use client";

import Script from "next/script";

const ga4 = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const ads = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export default function Analytics() {
  const primaryId = ga4 || ads;
  if (!primaryId) return null;

  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryId)}`} strategy="afterInteractive" />
    <Script id="google-analytics-and-ads" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());${ga4 ? `gtag('config','${ga4}',{send_page_view:true});` : ""}${ads ? `gtag('config','${ads}');` : ""}`}
    </Script>
  </>;
}
