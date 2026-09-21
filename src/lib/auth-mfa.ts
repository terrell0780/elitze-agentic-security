import crypto from "node:crypto";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function encryptionKey() {
  const raw = process.env.ELITZE_AUTH_ENCRYPTION_KEY?.trim() ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) throw new Error("auth_encryption_key_invalid");
  return Buffer.from(raw, "hex");
}

function base32Decode(value: string) {
  const normalized = value.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = "";
  for (const char of normalized) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) throw new Error("invalid_base32");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  return Buffer.from(bytes);
}

function base32Encode(value: Buffer) {
  let bits = "";
  for (const byte of value) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let offset = 0; offset < bits.length; offset += 5) {
    const chunk = bits.slice(offset, offset + 5).padEnd(5, "0");
    output += base32Alphabet[Number.parseInt(chunk, 2)];
  }
  return output;
}

export function encryptAuthSecret(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptAuthSecret(encoded: string) {
  const [ivText, tagText, ciphertextText] = encoded.split(".");
  if (!ivText || !tagText || !ciphertextText) throw new Error("auth_secret_invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

export function totpCode(secret: string, timeMs = Date.now()) {
  const counter = Math.floor(timeMs / 1000 / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", base32Decode(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

export function verifyTotp(secret: string, supplied: string, timeMs = Date.now()) {
  const normalized = supplied.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const center = Math.floor(timeMs / 1000 / 30) * 30_000;
  for (const delta of [-30_000, 0, 30_000]) {
    const expected = totpCode(secret, center + delta);
    const left = Buffer.from(normalized);
    const right = Buffer.from(expected);
    if (crypto.timingSafeEqual(left, right)) return true;
  }
  return false;
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(8).toString("hex").match(/.{1,4}/g)?.join("-") ?? "",
  );
}

export function hashRecoveryCode(code: string) {
  return crypto.createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}
