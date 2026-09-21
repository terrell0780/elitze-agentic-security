import crypto from "node:crypto";

export function generateApiKey() {
  const secret = crypto.randomBytes(32).toString("base64url");
  const raw = `elz_${secret}`;
  return { raw, prefix: raw.slice(0, 12), hash: crypto.createHash("sha256").update(raw).digest("hex") };
}

export function hashApiKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
