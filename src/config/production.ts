import { z } from "zod";

const DEFAULT_CANONICAL_ORIGIN = "https://elitze.info";
const DEFAULT_ALLOWED_ORIGINS = [
  "https://elitze.info",
  "https://www.elitze.info",
] as const;

const originSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const url = new URL(value);
    const isLoopback =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1";

    return (
      (url.protocol === "https:" || (url.protocol === "http:" && isLoopback)) &&
      url.pathname === "/" &&
      url.search === "" &&
      url.hash === "" &&
      !url.username &&
      !url.password
    );
  }, "Value must be an origin URL. Production origins must use HTTPS.");

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value?.trim()) return [...DEFAULT_ALLOWED_ORIGINS];

  const raw = value.trim();

  if (raw.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("ELITZE_ALLOWED_ORIGINS must contain valid JSON when configured as an array.");
    }
    return z.array(originSchema).min(1).parse(parsed);
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => originSchema.parse(origin));
}

const configuredCanonicalOrigin = originSchema.parse(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_CANONICAL_ORIGIN,
);

const canonicalOrigin =
  configuredCanonicalOrigin.startsWith("http://127.0.0.1")
  || configuredCanonicalOrigin.startsWith("http://localhost")
  || configuredCanonicalOrigin.startsWith("http://[::1]")
    ? configuredCanonicalOrigin
    : configuredCanonicalOrigin === DEFAULT_CANONICAL_ORIGIN
      ? configuredCanonicalOrigin
      : (() => {
          throw new Error("ELITZE canonical production origin must be https://elitze.info.");
        })();

export const allowedOrigins = Array.from(
  new Set([canonicalOrigin, ...parseAllowedOrigins(process.env.ELITZE_ALLOWED_ORIGINS)]),
);

const staleDomain = ["elitze", "ca"].join(".");
if (canonicalOrigin.toLowerCase().includes(staleDomain) || allowedOrigins.some((origin) => origin.toLowerCase().includes(staleDomain))) {
  throw new Error(`Stale ${staleDomain} production origin is forbidden.`);
}

export const productionConfig = Object.freeze({
  canonicalOrigin,
  allowedOrigins: Object.freeze(allowedOrigins),
});

export type ProductionConfig = typeof productionConfig;
