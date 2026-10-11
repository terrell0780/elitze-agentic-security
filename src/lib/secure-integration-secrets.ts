import crypto from "node:crypto";

function integrationKey() {
  const raw = process.env.ELITZE_INTEGRATION_ENCRYPTION_KEY?.trim() ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error("integration_encryption_key_invalid");
  }
  return Buffer.from(raw, "hex");
}

export function encryptIntegrationSecret(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", integrationKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptIntegrationSecret(encoded: string) {
  const [ivText, tagText, ciphertextText] = encoded.split(".");
  if (!ivText || !tagText || !ciphertextText) {
    throw new Error("integration_secret_invalid");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    integrationKey(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function sha256(value: Uint8Array | string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function validateExternalHttpsUrl(input: string) {
  const value = input.trim();
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") {
    throw new Error("external_url_must_use_https");
  }
  if (!parsed.hostname || parsed.username || parsed.password) {
    throw new Error("external_url_invalid");
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  ) {
    throw new Error("external_url_private_host_blocked");
  }
  return parsed;
}
