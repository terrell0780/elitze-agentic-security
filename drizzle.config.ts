import fs from "node:fs";
import { defineConfig } from "drizzle-kit";

function databaseConnectionString() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const secretFile = process.env.DATABASE_URL_FILE?.trim();
  if (!secretFile) throw new Error("DATABASE_URL is required to run Drizzle migrations");
  if (!secretFile.startsWith("/run/secrets/")) {
    throw new Error("DATABASE_URL_FILE must point to a Docker secret under /run/secrets");
  }
  const value = fs.readFileSync(secretFile, "utf8").trim();
  if (!value) throw new Error("DATABASE_URL_FILE is empty");
  return value;
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseConnectionString() },
});
