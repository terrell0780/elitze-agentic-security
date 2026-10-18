import { defineConfig } from "drizzle-kit";

function normalizeConnectionString(value: string): string {
  try {
    const url = new URL(value);
    if (/\.neon\.tech$/i.test(url.hostname)) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // Preserve the source value for Drizzle's own connection diagnostics.
  }
  return value;
}

const databaseUrl =
  process.env.DATABASE_MIGRATION_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim();
const explicitSsl = (() => {
  const raw = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (raw === "disable" || raw === "false" || raw === "0") return false;
  if (raw === "require" || raw === "true" || raw === "1") return true;
  return undefined;
})();

const connectionString = databaseUrl ? normalizeConnectionString(databaseUrl) : (() => {
  const host = process.env.PGHOST?.trim();
  const user = process.env.PGUSER?.trim();
  const password = process.env.PGPASSWORD ?? "";
  const database = process.env.PGDATABASE?.trim();
  const port = Number(process.env.PGPORT ?? 5432);
  if (!host || !user || !password || !database) {
    throw new Error("DATABASE_MIGRATION_URL, DATABASE_URL or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE is required to run Drizzle migrations");
  }
  const ssl = explicitSsl ?? (/\.neon\.tech$/i.test(host) ? true : undefined);
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}${ssl ? "?sslmode=verify-full" : ""}`;
})();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
});
