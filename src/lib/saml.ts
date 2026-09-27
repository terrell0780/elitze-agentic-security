import { SAML, ValidateInResponseTo } from "@node-saml/node-saml";
import { productionConfig } from "@/config/production";

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`saml_config_missing:${name}`);
  return value;
};

const normalizePem = (value: string) => value.replace(/\\n/g, "\n").trim();

export function samlConfig() {
  const idpEntityId = required("ELITZE_SAML_IDP_ENTITY_ID");
  const entryPoint = required("ELITZE_SAML_IDP_SSO_URL");
  const idpCert = normalizePem(required("ELITZE_SAML_IDP_CERTIFICATE"));
  const spEntityId = process.env.ELITZE_SAML_SP_ENTITY_ID?.trim()
    || new URL("/api/auth/saml/metadata", productionConfig.canonicalOrigin).toString();
  const callbackUrl = process.env.ELITZE_SAML_ACS_URL?.trim()
    || new URL("/api/auth/saml/callback", productionConfig.canonicalOrigin).toString();
  const privateKey = process.env.ELITZE_SAML_SP_PRIVATE_KEY?.trim();
  const publicCert = process.env.ELITZE_SAML_SP_CERTIFICATE?.trim();

  if ((privateKey && !publicCert) || (!privateKey && publicCert)) {
    throw new Error("saml_sp_signing_key_and_certificate_required_together");
  }

  return {
    callbackUrl,
    entryPoint,
    issuer: spEntityId,
    audience: spEntityId,
    idpIssuer: idpEntityId,
    idpCert,
    identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    signatureAlgorithm: "sha256" as const,
    digestAlgorithm: "sha256" as const,
    acceptedClockSkewMs: 5_000,
    maxAssertionAgeMs: 5 * 60_000,
    validateInResponseTo: ValidateInResponseTo.never,
    ...(privateKey && publicCert
      ? { privateKey: normalizePem(privateKey), publicCert: normalizePem(publicCert) }
      : {}),
  };
}

export function isSamlConfigured() {
  return Boolean(
    process.env.ELITZE_SAML_IDP_ENTITY_ID?.trim()
    && process.env.ELITZE_SAML_IDP_SSO_URL?.trim()
    && process.env.ELITZE_SAML_IDP_CERTIFICATE?.trim(),
  );
}

export function createSaml() {
  if (!isSamlConfigured()) throw new Error("saml_not_configured");
  return new SAML(samlConfig());
}

export function samlMetadata() {
  const saml = createSaml();
  const publicCert = process.env.ELITZE_SAML_SP_CERTIFICATE?.trim();
  return saml.generateServiceProviderMetadata(null, publicCert ? normalizePem(publicCert) : null);
}

export function samlSiteOrigin() {
  return productionConfig.canonicalOrigin;
}
