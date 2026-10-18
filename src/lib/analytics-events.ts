export type ElitzeAnalyticsEvent =
  | "console_open"
  | "privacy_consent_granted"
  | "privacy_consent_denied";

type EventParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function hasConsent() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((item) => item === "elitze_consent=granted");
}

export function trackElitzeEvent(name: ElitzeAnalyticsEvent, params: EventParams = {}) {
  if (typeof window === "undefined" || !hasConsent()) return false;

  const payload = { ...params, source: "elitze.info" };

  if (typeof window.gtag === "function") {
    window.gtag("event", name, payload);
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(["event", name, payload]);
  return true;
}
