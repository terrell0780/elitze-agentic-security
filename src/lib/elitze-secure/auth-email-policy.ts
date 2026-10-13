export type AuthEmailPolicyEnvironment = Readonly<Record<string, string | undefined>>;

function normalizedLoopbackHost(host: string | undefined) {
  return (host ?? "").trim().toLowerCase().replace(/^\[|\]$/g, "");
}

export function isDisposableAuthE2EEnvironment(
  env: AuthEmailPolicyEnvironment = process.env,
): boolean {
  const host = normalizedLoopbackHost(env.PGHOST);
  const database = (env.PGDATABASE ?? "").trim();

  return env.ELITZE_AUTH_E2E_DISPOSABLE_DB === "true"
    && ["127.0.0.1", "localhost", "::1"].includes(host)
    && /(^|[_-])(ci|test|e2e)([_-]|$)/i.test(database);
}

/**
 * RFC-reserved .invalid addresses are deliberately usable only by the isolated
 * disposable auth E2E database. They must never authenticate or create durable
 * accounts in a hosted preview/production environment.
 */
export function isReservedNonDeliverableEmail(
  email: string,
  env: AuthEmailPolicyEnvironment = process.env,
): boolean {
  const normalized = email.trim().toLowerCase();
  const separator = normalized.lastIndexOf("@");
  if (separator <= 0 || separator === normalized.length - 1) return false;

  const domain = normalized.slice(separator + 1);
  return domain.endsWith(".invalid") && !isDisposableAuthE2EEnvironment(env);
}
