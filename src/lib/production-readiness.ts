import fs from "node:fs/promises";
import path from "node:path";
import { getPgPool, isDatabaseConfigured, databaseConfigurationSource } from "@/db";

export type ReadinessState = "READY" | "CONFIGURED" | "BLOCKED" | "UNMEASURABLE";
export type ReadinessCheck = { state: ReadinessState; detail: string; source?: string; evidence?: string };
export type ProductionReadiness = { generatedAt: string; checks: Record<string, ReadinessCheck>; releaseBlocked: boolean };

const REQUIRED_TABLES = [
  "auth_tenants", "auth_users", "auth_sessions", "auth_tokens", "auth_rate_limits",
  "auth_mfa_factors", "auth_recovery_codes", "auth_webauthn_credentials",
  "auth_challenges", "auth_refresh_tokens", "auth_api_keys", "auth_privileged_reauth",
  "data_bridge_sources", "data_bridge_events", "security_graph_nodes", "security_graph_edges",
  "security_graph_evidence", "security_test_requests", "production_readiness_evidence",
  "_elitze_migrations",
] as const;

const env = (name: string) => process.env[name]?.trim() ?? "";
const hasAll = (...names: string[]) => names.every((name) => Boolean(env(name)));

type ReadinessEvidence = {
  observed_at?: Date | string | null;
  source?: string | null;
  evidence_ref?: string | null;
};

async function readVerifiedEvidence(category: string): Promise<ReadinessEvidence | null> {
  const result = await getPgPool().query(
    "SELECT observed_at, source, evidence_ref FROM production_readiness_evidence WHERE category=$1 AND status='VERIFIED' ORDER BY observed_at DESC LIMIT 1",
    [category],
  );
  return (result.rows[0] as ReadinessEvidence | undefined) ?? null;
}

function evidenceReference(row: ReadinessEvidence): string | undefined {
  if (row.evidence_ref) return row.evidence_ref;
  if (!row.observed_at) return undefined;
  return row.observed_at instanceof Date ? row.observed_at.toISOString() : String(row.observed_at);
}

async function evidenceCheck(category: string, label: string, missingDetail: string): Promise<ReadinessCheck> {
  try {
    const row = await readVerifiedEvidence(category);
    if (!row) return { state: "UNMEASURABLE", detail: missingDetail, source: "production_readiness_evidence" };
    return {
      state: "READY",
      detail: "A verified " + label + " record is present in the production evidence ledger.",
      source: row.source ?? "production_readiness_evidence",
      evidence: evidenceReference(row),
    };
  } catch (error) {
    console.error("ELITZE readiness evidence lookup failed for " + category, error);
    return {
      state: "UNMEASURABLE",
      detail: "The required " + label + " evidence could not be read; readiness is not assumed.",
      source: "production_readiness_evidence",
    };
  }
}

async function checkDatabase(): Promise<ReadinessCheck> {
  if (!isDatabaseConfigured()) {
    return { state: "BLOCKED", detail: "Production PostgreSQL is not configured.", source: "runtime configuration" };
  }
  try {
    const db = getPgPool();
    await db.query("SELECT 1");
    const applied = (await db.query("SELECT id FROM _elitze_migrations")).rows.map((row) => String(row.id));
    const expected = (await fs.readdir(path.join(process.cwd(), "drizzle")))
      .filter((file) => /^\d+_.*\.sql$/.test(file))
      .sort();
    const missing = expected.filter((file) => !applied.includes(file));
    if (missing.length) {
      return {
        state: "BLOCKED",
        detail: "Database is reachable but migrations are incomplete: " + missing.join(", "),
        source: "ELITZE migration ledger",
      };
    }
    const present = new Set((await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name=ANY($1::text[])",
      [REQUIRED_TABLES as unknown as string[]],
    )).rows.map((row) => String(row.table_name)));
    const missingTables = REQUIRED_TABLES.filter((table) => !present.has(table));
    if (missingTables.length) {
      return {
        state: "BLOCKED",
        detail: "Required ELITZE tables are missing: " + missingTables.join(", "),
        source: "PostgreSQL schema verification",
      };
    }
    return {
      state: "READY",
      detail: "PostgreSQL is reachable, all repository migrations are applied, and the required ELITZE schema is present.",
      source: "PostgreSQL via " + databaseConfigurationSource(),
      evidence: "Database verification at " + new Date().toISOString(),
    };
  } catch (error) {
    console.error("ELITZE production database verification failed", error);
    return {
      state: "BLOCKED",
      detail: "PostgreSQL health or migration verification failed.",
      source: "runtime database health check",
    };
  }
}

export async function getProductionReadiness(): Promise<ProductionReadiness> {
  const managedDatabase = await checkDatabase();
  const databaseReady = managedDatabase.state === "READY";
  const authenticationConfigured = databaseReady && hasAll(
    "ELITZE_AUTH_ENCRYPTION_KEY_ACTIVE",
    "ELITZE_TEAM_SESSION_SECRET_ACTIVE",
    "ELITZE_ALLOWED_ORIGINS",
    "ELITZE_INTERNAL_API_KEY_ACTIVE",
  );
  const authentication: ReadinessCheck = !authenticationConfigured
    ? {
        state: "BLOCKED",
        detail: "Authentication requires a verified database plus auth-encryption, team-session, and allowed-origin configuration.",
        source: "ELITZE authentication runtime configuration",
      }
    : await evidenceCheck(
        "authentication_e2e",
        "production authentication verification",
        "No verified production authentication E2E evidence is recorded.",
      );

  const emailConfigured = hasAll("ELITZE_EMAIL_PROVIDER", "ELITZE_EMAIL_FROM", "RESEND_API_KEY");
  const emailProvider: ReadinessCheck = !emailConfigured
    ? {
        state: "BLOCKED",
        detail: "ELITZE_EMAIL_PROVIDER, ELITZE_EMAIL_FROM, and RESEND_API_KEY are required for transactional email.",
        source: "runtime configuration",
      }
    : await evidenceCheck(
        "transactional_email_delivery",
        "transactional email delivery test",
        "Provider credentials are configured, but no verified transactional email delivery test is recorded.",
      );

  const monitoring: ReadinessCheck = databaseReady
    ? await evidenceCheck(
        "runtime_monitoring",
        "runtime monitoring verification",
        "No verified runtime monitoring evidence is recorded.",
      )
    : {
        state: "UNMEASURABLE",
        detail: "Runtime monitoring cannot be verified until the database and evidence ledger are available.",
        source: "database dependency",
      };

  let runnerHandshake: ReadinessCheck;
  const runnerConfigured = Boolean(env("ELITZE_SECURITY_RUNNER_URL") || env("ELITZE_RUNNER_URL")) &&
    Boolean(env("ELITZE_SECURITY_RUNNER_HMAC_SECRET") || env("ELITZE_RUNNER_HMAC_SECRET"));
  const recordedRunnerHandshake = databaseReady ? await evidenceCheck(
    "runner_handshake",
    "authenticated runner handshake",
    "No verified production runner handshake is recorded.",
  ) : null;
  if (recordedRunnerHandshake?.state === "READY") {
    runnerHandshake = recordedRunnerHandshake;
  } else if (runnerConfigured) {
    runnerHandshake = {
      state: "UNMEASURABLE",
      detail: "Runner configuration is present but a verified production handshake is not recorded.",
      source: "runner configuration and production evidence ledger",
    };
  } else {
    runnerHandshake = {
      state: "BLOCKED",
      detail: "ELITZE_SECURITY_RUNNER_URL (or ELITZE_RUNNER_URL) and an HMAC secret must be configured before the runner can be verified.",
      source: "runtime configuration",
    };
  }

  const [tenantIsolation, securityValidation, backups] = databaseReady
    ? await Promise.all([
        evidenceCheck("tenant_isolation", "tenant-isolation verification", "No verified tenant-isolation evidence is recorded."),
        evidenceCheck("security_validation", "authorized security validation", "No verified authorized security validation is recorded."),
        evidenceCheck("backup_restore", "backup and restore test", "No verified backup/restore test is recorded."),
      ])
    : [
        { state: "UNMEASURABLE" as const, detail: "Tenant isolation cannot be verified until the database is healthy.", source: "database dependency" },
        { state: "UNMEASURABLE" as const, detail: "Security validation cannot be verified until the database is healthy.", source: "database dependency" },
        { state: "UNMEASURABLE" as const, detail: "Backup/restore cannot be verified until the database is healthy.", source: "database dependency" },
      ];

  const checks = {
    managedDatabase,
    authentication,
    emailProvider,
    monitoring,
    runnerHandshake,
    tenantIsolation,
    securityValidation,
    backups,
  };
  const releaseBlockingKeys = [
    "managedDatabase",
    "authentication",
    "emailProvider",
    "runnerHandshake",
    "tenantIsolation",
    "securityValidation",
    "monitoring",
    "backups",
  ] as const;
  const releaseBlocked = releaseBlockingKeys.some((key) => {
    const state = checks[key].state;
    return state === "BLOCKED" || state === "UNMEASURABLE";
  });

  return { generatedAt: new Date().toISOString(), checks, releaseBlocked };
}
