import { createHash } from "node:crypto";
import { getPgPool } from "@/db";

const SNAPSHOT_VERSION = "2026-10-02";

const SNAPSHOT_TABLES = [
  "agents",
  "security_identities",
  "agent_identities",
  "mcp_tool_inventory",
  "security_graph_nodes",
  "security_graph_edges",
  "security_policies",
  "security_decisions",
  "mcp_gateway_decisions",
  "security_test_requests",
  "red_team_runs",
  "vulnerabilities",
  "audit_ledger_events",
  "security_fabric_sources",
] as const;

type SnapshotState = {
  snapshotDate: string;
  counts: Record<string, number>;
  latest: {
    pentestRequestAt: string | null;
    pentestStatus: string | null;
    redTeamRunAt: string | null;
    redTeamStatus: string | null;
    auditSequence: number | null;
    auditHash: string | null;
    auditObservedAt: string | null;
  };
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const object = value as Record<string, unknown>;
  return "{" + Object.keys(object).sort().map((key) => JSON.stringify(key) + ":" + stableStringify(object[key])).join(",") + "}";
}

function digest(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

async function tableExists(tableName: string): Promise<boolean> {
  const result = await getPgPool().query(
    "SELECT to_regclass($1) IS NOT NULL AS present",
    [tableName],
  );
  return Boolean(result.rows[0]?.present);
}

async function countTable(tableName: string, tenantId: string): Promise<number> {
  if (!(await tableExists(tableName))) return 0;
  const result = await getPgPool().query(
    "SELECT COUNT(*)::int AS count FROM " + tableName + " WHERE tenant_id=$1",
    [tenantId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function latestTableRow(
  tableName: string,
  tenantId: string,
  timestampColumn: string,
  fields: string,
): Promise<Record<string, unknown> | null> {
  if (!(await tableExists(tableName))) return null;
  const result = await getPgPool().query(
    "SELECT " + fields + " FROM " + tableName +
      " WHERE tenant_id=$1 ORDER BY " + timestampColumn + " DESC NULLS LAST LIMIT 1",
    [tenantId],
  );
  return (result.rows[0] as Record<string, unknown> | undefined) ?? null;
}

export async function createDailySecuritySnapshot(tenantId: string, now = new Date()) {
  const normalizedTenant = tenantId.trim();
  if (!normalizedTenant) throw new Error("tenant_id_required_for_snapshot");

  const pool = getPgPool();
  const snapshotDate = now.toISOString().slice(0, 10);

  const countsEntries = await Promise.all(
    SNAPSHOT_TABLES.map(async (tableName) => [
      tableName,
      await countTable(tableName, normalizedTenant),
    ] as const),
  );

  const [pentest, redTeam, audit] = await Promise.all([
    latestTableRow("security_test_requests", normalizedTenant, "created_at", "created_at,status"),
    latestTableRow("red_team_runs", normalizedTenant, "started_at", "started_at,status"),
    latestTableRow("audit_ledger_events", normalizedTenant, "occurred_at", "sequence,hash,occurred_at"),
  ]);

  const state: SnapshotState = {
    snapshotDate,
    counts: Object.fromEntries(countsEntries),
    latest: {
      pentestRequestAt: pentest?.created_at ? new Date(String(pentest.created_at)).toISOString() : null,
      pentestStatus: pentest?.status ? String(pentest.status) : null,
      redTeamRunAt: redTeam?.started_at ? new Date(String(redTeam.started_at)).toISOString() : null,
      redTeamStatus: redTeam?.status ? String(redTeam.status) : null,
      auditSequence: audit?.sequence == null ? null : Number(audit.sequence),
      auditHash: audit?.hash ? String(audit.hash) : null,
      auditObservedAt: audit?.occurred_at ? new Date(String(audit.occurred_at)).toISOString() : null,
    },
  };

  const contentHash = digest(state);
  const previous = await pool.query(
    "SELECT content_hash FROM security_daily_snapshots WHERE tenant_id=$1 ORDER BY snapshot_date DESC LIMIT 1",
    [normalizedTenant],
  );

  const previousHash = previous.rows[0]?.content_hash
    ? String(previous.rows[0].content_hash)
    : null;

  const inserted = await pool.query(
    `INSERT INTO security_daily_snapshots
      (tenant_id,snapshot_date,generated_at,snapshot_version,evidence_state,state,content_hash,previous_hash)
     VALUES ($1,$2,$3,$4,'OBSERVED',$5::jsonb,$6,$7)
     ON CONFLICT (tenant_id,snapshot_date) DO NOTHING
     RETURNING id,snapshot_date,generated_at,snapshot_version,evidence_state,state,content_hash,previous_hash`,
    [
      normalizedTenant,
      snapshotDate,
      now.toISOString(),
      SNAPSHOT_VERSION,
      JSON.stringify(state),
      contentHash,
      previousHash,
    ],
  );

  if (inserted.rows[0]) return inserted.rows[0];

  const existing = await pool.query(
    `SELECT id,snapshot_date,generated_at,snapshot_version,evidence_state,state,content_hash,previous_hash
       FROM security_daily_snapshots
      WHERE tenant_id=$1 AND snapshot_date=$2
      LIMIT 1`,
    [normalizedTenant, snapshotDate],
  );

  if (!existing.rows[0]) throw new Error("daily_snapshot_persistence_failed");
  return existing.rows[0];
}

export async function getLatestDailySecuritySnapshot(tenantId: string) {
  const normalizedTenant = tenantId.trim();
  if (!normalizedTenant) throw new Error("tenant_id_required_for_snapshot");

  const result = await getPgPool().query(
    `SELECT id,snapshot_date AS "snapshotDate",generated_at AS "generatedAt",
            snapshot_version AS "snapshotVersion",evidence_state AS "evidenceState",
            state,content_hash AS "contentHash",previous_hash AS "previousHash"
       FROM security_daily_snapshots
      WHERE tenant_id=$1
      ORDER BY snapshot_date DESC
      LIMIT 1`,
    [normalizedTenant],
  );
  return result.rows[0] ?? null;
}

export async function listDailySecuritySnapshots(tenantId: string, limit = 30) {
  const normalizedTenant = tenantId.trim();
  if (!normalizedTenant) throw new Error("tenant_id_required_for_snapshot");

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 90);
  const result = await getPgPool().query(
    `SELECT id,snapshot_date AS "snapshotDate",generated_at AS "generatedAt",
            snapshot_version AS "snapshotVersion",evidence_state AS "evidenceState",
            state,content_hash AS "contentHash",previous_hash AS "previousHash"
       FROM security_daily_snapshots
      WHERE tenant_id=$1
      ORDER BY snapshot_date DESC
      LIMIT $2`,
    [normalizedTenant, safeLimit],
  );
  return result.rows;
}
