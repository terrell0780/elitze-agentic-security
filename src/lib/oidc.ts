import * as oidc from "openid-client";
import { productionConfig } from "@/config/production";

export function oidcConfig() {
  const issuer = process.env.ELITZE_OIDC_ISSUER_URL?.trim();
  const clientId = process.env.ELITZE_OIDC_CLIENT_ID?.trim();
  const clientSecret = process.env.ELITZE_OIDC_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret) throw new Error("oidc_not_configured");
  return { issuer, clientId, clientSecret };
}

export async function discoverOidc() {
  const { issuer, clientId, clientSecret } = oidcConfig();
  return oidc.discovery(new URL(issuer), clientId, clientSecret);
}

export function oidcRedirectUri() {
  return new URL("/api/auth/oidc/callback", productionConfig.canonicalOrigin).toString();
}

export { oidc };
