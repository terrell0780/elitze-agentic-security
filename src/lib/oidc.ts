import * as oidc from "openid-client";

const siteOrigin = () => process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://elitze.info";

export function oidcConfig() {
  const issuer = process.env.ELITZE_OIDC_ISSUER_URL?.trim();
  const clientId = process.env.ELITZE_OIDC_CLIENT_ID?.trim();
  const clientSecret = process.env.ELITZE_OIDC_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret) throw new Error("oidc_not_configured");
  return { issuer, clientId, clientSecret };
}

export function oidcRedirectUri() {
  return new URL("/api/auth/oidc/callback", siteOrigin()).toString();
}

export { oidc };
