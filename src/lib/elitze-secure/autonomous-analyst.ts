import { getPgPool } from "@/db";

type FabricRow = {
  id: string;
  connector_id: string;
  event_type: string;
  subject_key: string | null;
  evidence_state: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  observed_at: string;
  source_ref: string | null;
  payload: Record<string, unknown>;
};

export type AnalystFinding = {
  title: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  evidenceState: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  subjectKey: string | null;
  techniqueIds: string[];
  sourceRefs: string[];
  supportingEventIds: string[];
  gaps: string[];
  proposedActions: Array<{
    action: string;
    target: string;
    approvalState: "APPROVAL_REQUIRED" | "NOT_EXECUTED";
  }>;
};

export type AutonomousAnalystResult = {
  runId: string;
  evidenceState: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  eventCount: number;
  findingCount: number;
  findings: AnalystFinding[];
};

const weight: Record<string, number> = { INFO: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function evidenceState(rows: FabricRow[]) {
  if (!rows.length) return "UNMEASURABLE" as const;
  if (rows.some((row) => row.evidence_state === "UNMEASURABLE")) return "UNMEASURABLE" as const;
  if (rows.some((row) => row.evidence_state === "UNKNOWN")) return "UNKNOWN" as const;
  if (rows.some((row) => row.evidence_state === "INFERRED")) return "INFERRED" as const;
  return "OBSERVED" as const;
}

function highestSeverity(rows: FabricRow[]) {
  return rows.reduce<AnalystFinding["severity"]>((current,row) => {
    const next = row.severity ?? "INFO";
    return weight[next] > weight[current] ? next : current;
  },"INFO");
}

function strings(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function groupKey(row: FabricRow) {
  if (row.subject_key) return row.subject_key;
  if (typeof row.payload.cveId === "string") return "cve:" + row.payload.cveId;
  if (typeof row.payload.cve === "string") return "cve:" + row.payload.cve;
  if (typeof row.payload.indicator === "string") return "indicator:" + row.payload.indicator;
  if (typeof row.payload.hostname === "string") return "host:" + row.payload.hostname;
  return row.event_type;
}

function buildFinding(subjectKey: string | null, rows: FabricRow[]): AnalystFinding {
  const state = evidenceState(rows);
  const techniqueIds = Array.from(new Set(rows.flatMap((row) => strings(row.payload,"techniqueIds"))));
  const sourceRefs = rows.map((row) => row.source_ref).filter((value): value is string => Boolean(value));
  const gaps = new Set<string>();

  if (!rows.some((row) => row.payload.cve || row.payload.cveId)) gaps.add("No CVE linkage observed.");
  if (!techniqueIds.length) gaps.add("No ATT&CK technique was directly supplied by source evidence.");
  if (!rows.some((row) => ["velociraptor","osquery","fleetdm"].includes(row.connector_id))) {
    gaps.add("No endpoint triage evidence is present in this evidence window.");
  }

  const confidence = state === "OBSERVED" && rows.length >= 3 ? "HIGH" : rows.length >= 2 ? "MEDIUM" : "LOW";
  const proposedActions: AnalystFinding["proposedActions"] = [];

  if (rows.some((row) => ["suricata","zeek"].includes(row.connector_id))) {
    proposedActions.push({
      action: "Correlate network evidence with endpoint telemetry before containment.",
      target: subjectKey ?? "network-observation",
      approvalState: "APPROVAL_REQUIRED",
    });
  }

  if (rows.some((row) => ["nuclei","greenbone","nvd","cisa-kev"].includes(row.connector_id))) {
    proposedActions.push({
      action: "Validate asset ownership and exploitability, then schedule a controlled retest.",
      target: subjectKey ?? "vulnerability-observation",
      approvalState: "APPROVAL_REQUIRED",
    });
  }

  if (rows.some((row) => ["velociraptor","osquery","fleetdm","wazuh"].includes(row.connector_id))) {
    proposedActions.push({
      action: "Collect additional endpoint evidence and preserve the source reference before changing security state.",
      target: subjectKey ?? "endpoint-observation",
      approvalState: "APPROVAL_REQUIRED",
    });
  }

  if (!proposedActions.length) {
    proposedActions.push({
      action: "Gather the next missing evidence source before changing security state.",
      target: subjectKey ?? "unattributed-observation",
      approvalState: "NOT_EXECUTED",
    });
  }

  return {
    title: "Autonomous Analyst: " + (subjectKey ?? "unattributed security signal"),
    severity: highestSeverity(rows),
    confidence,
    evidenceState: state,
    subjectKey,
    techniqueIds,
    sourceRefs,
    supportingEventIds: rows.map((row) => row.id),
    gaps: Array.from(gaps),
    proposedActions,
  };
}

export async function runAutonomousAnalyst(
  tenantId: string,
  requestedBy: string,
  trigger: "MANUAL" | "SCHEDULED" | "EVENT" = "MANUAL",
): Promise<AutonomousAnalystResult> {
  const db = getPgPool();
  const run = await db.query(
    "INSERT INTO autonomous_analyst_runs " +
    "(tenant_id,requested_by,trigger,status,evidence_state) " +
    "VALUES ($1,$2,$3,'RUNNING','UNMEASURABLE') RETURNING id",
    [tenantId,requestedBy,trigger],
  );
  const runId = String(run.rows[0].id);

  try {
    const events = await db.query<FabricRow>(
      "SELECT id,connector_id,event_type,subject_key,evidence_state,severity,observed_at,source_ref,payload " +
      "FROM security_fabric_events WHERE tenant_id=$1 ORDER BY observed_at DESC LIMIT 250",
      [tenantId],
    );

    if (!events.rows.length) {
      await db.query(
        "UPDATE autonomous_analyst_runs " +
        "SET status='COMPLETED',evidence_state='UNMEASURABLE',completed_at=now(),summary=$2 WHERE id=$1",
        [runId,JSON.stringify({ eventCount:0,findingCount:0,message:"No observed security-fabric events are available for analysis." })],
      );
      return { runId,evidenceState:"UNMEASURABLE",eventCount:0,findingCount:0,findings:[] };
    }

    const groups = new Map<string,FabricRow[]>();
    for (const row of events.rows) {
      const key = groupKey(row);
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key,list);
    }

    const findings = Array.from(groups.entries())
      .map(([subject,rows]) => buildFinding(subject,rows))
      .filter((finding) => finding.severity !== "INFO" || finding.evidenceState !== "OBSERVED")
      .slice(0,50);

    for (const finding of findings) {
      await db.query(
        "INSERT INTO autonomous_analyst_findings " +
        "(run_id,tenant_id,title,severity,confidence,evidence_state,subject_key,technique_ids,source_refs,supporting_event_ids,gaps,proposed_actions,action_state) " +
        "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'APPROVAL_REQUIRED')",
        [
          runId,tenantId,finding.title,finding.severity,finding.confidence,finding.evidenceState,
          finding.subjectKey,finding.techniqueIds,finding.sourceRefs,finding.supportingEventIds,
          finding.gaps,JSON.stringify(finding.proposedActions),
        ],
      );
    }

    const state = evidenceState(events.rows);
    await db.query(
      "UPDATE autonomous_analyst_runs SET status='COMPLETED',evidence_state=$2,completed_at=now(),summary=$3 WHERE id=$1",
      [runId,state,JSON.stringify({ eventCount:events.rows.length,findingCount:findings.length })],
    );

    return { runId,evidenceState:state,eventCount:events.rows.length,findingCount:findings.length,findings };
  } catch (error) {
    await db.query(
      "UPDATE autonomous_analyst_runs SET status='FAILED',completed_at=now(),summary=$2 WHERE id=$1",
      [runId,JSON.stringify({ error:error instanceof Error ? error.message : "analyst_failed" })],
    ).catch(() => undefined);
    throw error;
  }
}
