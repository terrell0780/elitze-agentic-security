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
  return (process.env.ELITZE_WEBAUTHN_ORIGIN?.trim() || configuredSiteOrigin())
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function webAuthnRpId() {
  const configured = process.env.ELITZE_WEBAUTHN_RP_ID?.trim();
  if (configured) return configured;
  return new URL(configuredSiteOrigin()).hostname;
}
