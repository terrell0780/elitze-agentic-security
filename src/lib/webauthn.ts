const fallbackSiteOrigin = "https://elitze.info";

function configuredSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteOrigin;
  try {
    return new URL(configured).origin;
  } catch {
    return fallbackSiteOrigin;
  }
}

export function webAuthnOrigins() {
  const configured = process.env.ELITZE_WEBAUTHN_ORIGIN?.trim();
  if (configured) {
    return configured
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  const origin = configuredSiteOrigin();
  return canonicalWebAuthnOrigins(origin);
}

export function webAuthnRpId() {
  const configured = process.env.ELITZE_WEBAUTHN_RP_ID?.trim();
  if (configured) return configured;
  const hostname = new URL(configuredSiteOrigin()).hostname;
  if (hostname === "elitze.info" || hostname === "www.elitze.info") return "elitze.info";
  return hostname;
}

function canonicalWebAuthnOrigins(origin: string) {
  const hostname = new URL(origin).hostname;
  if (hostname === "elitze.info" || hostname === "www.elitze.info") {
    return ["https://elitze.info", "https://www.elitze.info"];
  }
  return [origin];
}
