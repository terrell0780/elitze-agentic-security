import { z } from "zod";
import { isDatabaseConfigured } from "@/db";

const ProductionSecretsSchema = z.object({
  ELITZE_AUTH_ENCRYPTION_KEY: z.string().trim().min(32),
  ELITZE_TEAM_SESSION_SECRET: z.string().trim().min(32),
  ELITZE_ALLOWED_ORIGINS: z.string().trim().min(1),
  ELITZE_INTERNAL_API_KEY_ACTIVE: z.string().trim().min(16),
  RESEND_API_KEY: z.string().trim().startsWith("re_"),
  RESEND_FROM: z.string().trim().min(3),
});

export type ProductionSecretsStatus = {
  ok: boolean;
  missing: string[];
  malformed: string[];
  databaseConfigured: boolean;
};

export function validateProductionSecrets(env: NodeJS.ProcessEnv = process.env): ProductionSecretsStatus {
  if (env.NODE_ENV !== "production") {
    return {
      ok: true,
      missing: [],
      malformed: [],
      databaseConfigured: isDatabaseConfigured(),
    };
  }

  const required = Object.keys(ProductionSecretsSchema.shape);
  const missing = required.filter((name) => !env[name]?.trim());

  const malformed: string[] = [];
  const parsed = ProductionSecretsSchema.safeParse(env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.path[0]) malformed.push(String(issue.path[0]));
    }
  }

  return {
    ok: missing.length === 0 && malformed.length === 0 && isDatabaseConfigured(),
    missing: [...new Set(missing)],
    malformed: [...new Set(malformed.filter((name) => !missing.includes(name)))],
    databaseConfigured: isDatabaseConfigured(),
  };
}

export function assertProductionSecrets(env: NodeJS.ProcessEnv = process.env): ProductionSecretsStatus {
  const status = validateProductionSecrets(env);
  if (env.NODE_ENV === "production" && !status.ok) {
    throw new Error(
      "Production configuration validation failed. Configure the required database and secret-manager values before serving protected production traffic.",
    );
  }
  return status;
}
