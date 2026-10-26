export type TenantTableSecurityMetadata = {
  schemaName: string;
  tableName: string;
  rlsEnabled: boolean;
  forceRls: boolean;
  policyCount: number;
};

export type TenantDatabaseIsolationAssessment = {
  state: "READY" | "BLOCKED" | "UNMEASURABLE";
  detail: string;
  source: string;
};

type AssessmentInput = {
  expectedRuntimeRole?: string;
  activeRole?: string;
  isSuperuser?: boolean;
  bypassRls?: boolean;
  tenantTables: TenantTableSecurityMetadata[];
};

const isEnabled = (value: unknown) => value === true || value === "t" || value === 1;

export function assessTenantDatabaseIsolation(
  input: AssessmentInput,
): TenantDatabaseIsolationAssessment {
  const expectedRole = input.expectedRuntimeRole?.trim();
  const activeRole = input.activeRole?.trim();

  if (!expectedRole) {
    return {
      state: "BLOCKED",
      detail:
        "ELITZE_DB_RUNTIME_ROLE is not configured. A named, verifiable least-privilege database role is required before tenant isolation can be accepted.",
      source: "runtime configuration",
    };
  }

  if (!activeRole || activeRole !== expectedRole) {
    return {
      state: "BLOCKED",
      detail:
        "The database session role does not match ELITZE_DB_RUNTIME_ROLE. Runtime identity could not be verified.",
      source: "PostgreSQL current_user",
    };
  }

  if (isEnabled(input.isSuperuser) || isEnabled(input.bypassRls)) {
    return {
      state: "BLOCKED",
      detail:
        "The active database role is superuser or has BYPASSRLS. Tenant isolation cannot be accepted under this role.",
      source: "PostgreSQL pg_roles",
    };
  }

  if (input.tenantTables.length === 0) {
    return {
      state: "BLOCKED",
      detail:
        "No tenant-keyed database tables were discovered. Tenant isolation evidence is insufficient.",
      source: "PostgreSQL catalog",
    };
  }

  const gaps = input.tenantTables
    .filter(
      (table) =>
        !isEnabled(table.rlsEnabled) ||
        !isEnabled(table.forceRls) ||
        !Number.isFinite(table.policyCount) ||
        table.policyCount < 1,
    )
    .map((table) => {
      const missing: string[] = [];
      if (!isEnabled(table.rlsEnabled)) missing.push("RLS disabled");
      if (!isEnabled(table.forceRls)) missing.push("FORCE RLS disabled");
      if (!Number.isFinite(table.policyCount) || table.policyCount < 1) {
        missing.push("no RLS policy");
      }
      return `${table.schemaName}.${table.tableName} (${missing.join(", ")})`;
    });

  if (gaps.length > 0) {
    const examples = gaps.slice(0, 8).join("; ");
    const remainder = gaps.length > 8 ? `; and ${gaps.length - 8} more` : "";
    return {
      state: "BLOCKED",
      detail:
        `${gaps.length} of ${input.tenantTables.length} tenant-keyed table(s) lack required RLS structure: ${examples}${remainder}. Policy semantics and cross-tenant negative tests must also be reviewed before go-live.`,
      source: "PostgreSQL RLS catalog verification",
    };
  }

  return {
    state: "READY",
    detail:
      `The active role is explicitly configured and non-superuser/NOBYPASSRLS; ${input.tenantTables.length} tenant-keyed table(s) have RLS, FORCE RLS, and at least one policy. This structural check does not prove policy semantics or replace negative cross-tenant tests.`,
    source: "PostgreSQL role and RLS catalog verification",
  };
}
