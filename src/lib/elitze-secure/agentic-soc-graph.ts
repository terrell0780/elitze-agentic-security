import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { getPgPool } from "@/db";
import { detectThreats, type DetectionEvidence } from "@/lib/elitze-secure/threat-detection";
import { getTenantNimConnection, reviewObservedFindings, type NvidiaNimConnection, type NimReview } from "@/lib/elitze-secure/nvidia-nim";
import { buildFinding, groupKey, type AnalystFinding, type FabricRow } from "@/lib/elitze-secure/autonomous-analyst";

type Trigger = "MANUAL" | "SCHEDULED" | "EVENT";
type ModelStatus = "NOT_CONFIGURED" | "CONFIGURED" | "CONNECTED" | "ERROR";

export type AgenticSocResult = {
  runId: string;
  evidenceState: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
  eventCount: number;
  observedEventCount: number;
  nonObservedEventCount: number;
  findingCount: number;
  findings: AnalystFinding[];
  modelStatus: ModelStatus;
  modelName: string | null;
  recursiveReviewPasses: number;
  modelReview: {
    supportedFindingIds: string[];
    evidenceGaps: string[];
    analystNotes: string[];
    summary: string;
  } | null;
};

const MAX_RECURSIVE_REVIEW_PASSES = 2;

function eventEvidence(row: FabricRow): DetectionEvidence {
  return {
    id: row.id,
    connector_id: row.connector_id,
    event_type: row.event_type,
    subject_key: row.subject_key,
    evidence_state: row.evidence_state,
    severity: row.severity,
    observed_at: row.observed_at,
    source_ref: row.source_ref,
    payload: row.payload,
  };
}

function findingsFromObservedEvidence(events: FabricRow[]): AnalystFinding[] {
  const groups = new Map<string, FabricRow[]>();
  for (const row of events) {
    const key = groupKey(row);
    const rows = groups.get(key) ?? [];
    rows.push(row);
    groups.set(key, rows);
  }

  const correlated = [...groups.entries()]
    .map(([subject, rows]) => buildFinding(subject.startsWith("event:") ? null : subject, rows))
    .filter((finding) => finding.severity !== "INFO")
    .slice(0, 50);

  const detections = detectThreats(events.map(eventEvidence));
  const ruleFindings: AnalystFinding[] = detections.detections.map((detection) => ({
    title: detection.ruleId + " — " + detection.title,
    severity: detection.severity,
    confidence: detection.confidence,
    evidenceState: "OBSERVED",
    subjectKey: detection.subject,
    techniqueIds: detection.techniqueIds,
    sourceRefs: detection.sourceRefs,
    supportingEventIds: detection.eventIds,
    gaps: [
      ...(detection.techniqueIds.length ? [] : ["No ATT&CK technique was provided by source evidence or a deterministic rule mapping."]),
      "Rule output is a source-backed triage signal; validate the underlying source record before response.",
    ],
    proposedActions: [{
      action: detection.nextStep,
      target: detection.subject || "observed-security-signal",
      approvalState: "APPROVAL_REQUIRED",
    }],
  }));

  const seen = new Set<string>();
  return [...ruleFindings, ...correlated].filter((finding) => {
    const key = finding.title + "|" + [...finding.supportingEventIds].sort().join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 50);
}

function advisoryFindingInput(findings: AnalystFinding[]) {
  return findings.map((finding, index) => ({
    id: "finding-" + String(index + 1).padStart(3, "0"),
    title: finding.title,
    severity: finding.severity,
    evidenceState: finding.evidenceState,
    supportingEventIds: finding.supportingEventIds,
    techniqueIds: finding.techniqueIds,
    gaps: finding.gaps,
  }));
}

const AgenticSocState = Annotation.Root({
  tenantId: Annotation<string>(),
  requestedBy: Annotation<string>(),
  trigger: Annotation<Trigger>(),
  runId: Annotation<string>(),
  events: Annotation<FabricRow[]>({ reducer: (_left, right) => right, default: () => [] }),
  totalEventCount: Annotation<number>({ reducer: (_left, right) => right, default: () => 0 }),
  nonObservedEventCount: Annotation<number>({ reducer: (_left, right) => right, default: () => 0 }),
  findings: Annotation<AnalystFinding[]>({ reducer: (_left, right) => right, default: () => [] }),
  nimConnection: Annotation<NvidiaNimConnection | null>({ reducer: (_left, right) => right, default: () => null }),
  modelStatus: Annotation<ModelStatus>({ reducer: (_left, right) => right, default: () => "NOT_CONFIGURED" }),
  modelReview: Annotation<NimReview | null>({ reducer: (_left, right) => right, default: () => null }),
  recursiveReviewPasses: Annotation<number>({ reducer: (_left, right) => right, default: () => 0 }),
  reviewContext: Annotation<string>({ reducer: (_left, right) => right, default: () => "initial evidence review" }),
  finalResult: Annotation<AgenticSocResult | null>({ reducer: (_left, right) => right, default: () => null }),
});

async function loadObservedEvidence(state: typeof AgenticSocState.State) {
  const db = getPgPool();
  const [observedRows, counts] = await Promise.all([
    db.query<FabricRow>(
      `SELECT id,connector_id,event_type,subject_key,evidence_state,severity,observed_at,source_ref,payload
       FROM security_fabric_events
       WHERE tenant_id=$1 AND evidence_state='OBSERVED'
         AND observed_at > now() - interval '30 days'
       ORDER BY observed_at DESC
       LIMIT 250`,
      [state.tenantId],
    ),
    db.query(
      `SELECT count(*)::int AS total,
         count(*) FILTER (WHERE evidence_state='OBSERVED' AND observed_at > now() - interval '30 days')::int AS observed
       FROM security_fabric_events
       WHERE tenant_id=$1 AND observed_at > now() - interval '30 days'`,
      [state.tenantId],
    ),
  ]);

  let nimConnection: NvidiaNimConnection | null = null;
  let modelStatus: ModelStatus = "NOT_CONFIGURED";
  try {
    nimConnection = await getTenantNimConnection(state.tenantId);
    if (nimConnection) modelStatus = "CONFIGURED";
  } catch {
    modelStatus = "ERROR";
  }

  const totalEventCount = Number(counts.rows[0]?.total ?? 0);
  const observedEventCount = Number(counts.rows[0]?.observed ?? 0);
  return {
    events: observedRows.rows,
    totalEventCount,
    nonObservedEventCount: Math.max(0, totalEventCount - observedEventCount),
    nimConnection,
    modelStatus,
  };
}

async function deterministicDetection(state: typeof AgenticSocState.State) {
  return { findings: findingsFromObservedEvidence(state.events) };
}

async function triageWithNim(state: typeof AgenticSocState.State) {
  if (!state.nimConnection || !state.findings.length || state.modelStatus === "ERROR") {
    return {
      modelStatus: state.modelStatus === "CONFIGURED" ? "CONFIGURED" as const : state.modelStatus,
      recursiveReviewPasses: state.recursiveReviewPasses,
      modelReview: state.modelReview,
    };
  }
  try {
    const review = await reviewObservedFindings({
      connection: state.nimConnection,
      findings: advisoryFindingInput(state.findings),
      eventCount: state.events.length,
      priorNotes: [
        ...(state.modelReview?.analystNotes ?? []),
        ...(state.modelReview?.evidenceGaps ?? []),
        state.reviewContext,
      ],
    });
    return {
      modelStatus: "CONNECTED" as const,
      modelReview: {
        supportedFindingIds: review.supportedFindingIds,
        evidenceGaps: [...new Set([...(state.modelReview?.evidenceGaps ?? []), ...review.evidenceGaps])].slice(0, 20),
        analystNotes: [...new Set([...(state.modelReview?.analystNotes ?? []), ...review.analystNotes])].slice(0, 20),
        summary: review.summary || state.modelReview?.summary || "",
      },
      recursiveReviewPasses: state.recursiveReviewPasses + 1,
    };
  } catch {
    return {
      modelStatus: "ERROR" as const,
      recursiveReviewPasses: MAX_RECURSIVE_REVIEW_PASSES,
      modelReview: state.modelReview,
    };
  }
}

function recursiveConsistencyReview(state: typeof AgenticSocState.State) {
  const allowlist = new Set(advisoryFindingInput(state.findings).map((finding) => finding.id));
  const current = state.modelReview;
  if (!current) {
    return { reviewContext: "recursive validation: no model review was returned; rely on source-backed deterministic analysis." };
  }
  return {
    reviewContext: "recursive consistency pass: use only the same tenant-observed evidence and finding allowlist; remove any unsupported references; report gaps rather than adding facts.",
    modelReview: {
      ...current,
      supportedFindingIds: current.supportedFindingIds.filter((id) => allowlist.has(id)),
      evidenceGaps: current.evidenceGaps.slice(0, 20),
      analystNotes: current.analystNotes.slice(0, 20),
    },
  };
}

async function persistResult(state: typeof AgenticSocState.State) {
  const db = getPgPool();
  const observedState = state.events.length > 0
    ? "OBSERVED" as const
    : state.totalEventCount > 0
      ? "UNKNOWN" as const
      : "UNMEASURABLE" as const;

  for (const finding of state.findings) {
    await db.query(
      `INSERT INTO autonomous_analyst_findings
       (run_id,tenant_id,title,severity,confidence,evidence_state,subject_key,technique_ids,source_refs,supporting_event_ids,gaps,proposed_actions,action_state)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'APPROVAL_REQUIRED')`,
      [
        state.runId,
        state.tenantId,
        finding.title,
        finding.severity,
        finding.confidence,
        finding.evidenceState,
        finding.subjectKey,
        finding.techniqueIds,
        finding.sourceRefs,
        finding.supportingEventIds,
        finding.gaps,
        JSON.stringify(finding.proposedActions),
      ],
    );
  }

  const modelReview = state.modelReview ? {
    supportedFindingIds: state.modelReview.supportedFindingIds,
    evidenceGaps: state.modelReview.evidenceGaps,
    analystNotes: state.modelReview.analystNotes,
    summary: state.modelReview.summary,
  } : null;
  const summary = {
    eventCount: state.events.length,
    totalEventCount: state.totalEventCount,
    nonObservedEventCount: state.nonObservedEventCount,
    findingCount: state.findings.length,
    engine: "LangGraph bounded evidence workflow",
    modelProvider: state.nimConnection ? "NVIDIA_NIM" : null,
    modelName: state.nimConnection?.model ?? null,
    modelStatus: state.modelStatus,
    recursiveReviewPasses: state.recursiveReviewPasses,
    modelReview,
    limitation: state.events.length
      ? "Observed source events were analyzed. No finding does not mean no compromise."
      : "No observed source events were available; posture is not inferred from missing telemetry.",
  };
  await db.query(
    "UPDATE autonomous_analyst_runs SET status='COMPLETED',evidence_state=$2,completed_at=now(),summary=$3 WHERE id=$1",
    [state.runId, observedState, JSON.stringify(summary)],
  );

  const finalResult: AgenticSocResult = {
    runId: state.runId,
    evidenceState: observedState,
    eventCount: state.events.length,
    observedEventCount: state.events.length,
    nonObservedEventCount: state.nonObservedEventCount,
    findingCount: state.findings.length,
    findings: state.findings,
    modelStatus: state.modelStatus,
    modelName: state.nimConnection?.model ?? null,
    recursiveReviewPasses: state.recursiveReviewPasses,
    modelReview,
  };
  return { finalResult };
}

const graph = new StateGraph(AgenticSocState)
  .addNode("loadObservedEvidence", loadObservedEvidence)
  .addNode("deterministicDetection", deterministicDetection)
  .addNode("triageWithNim", triageWithNim)
  .addNode("recursiveConsistencyReview", recursiveConsistencyReview)
  .addNode("persistResult", persistResult)
  .addEdge(START, "loadObservedEvidence")
  .addEdge("loadObservedEvidence", "deterministicDetection")
  .addEdge("deterministicDetection", "triageWithNim")
  .addConditionalEdges(
    "triageWithNim",
    (state) => state.modelStatus === "CONNECTED" && state.recursiveReviewPasses < MAX_RECURSIVE_REVIEW_PASSES
      ? "recursive"
      : "persist",
    { recursive: "recursiveConsistencyReview", persist: "persistResult" },
  )
  .addEdge("recursiveConsistencyReview", "triageWithNim")
  .addEdge("persistResult", END)
  .compile();

export async function runAgenticSocGraph(
  tenantId: string,
  requestedBy: string,
  trigger: Trigger = "MANUAL",
): Promise<AgenticSocResult> {
  const db = getPgPool();
  const run = await db.query(
    "INSERT INTO autonomous_analyst_runs (tenant_id,requested_by,trigger,status,evidence_state) VALUES ($1,$2,$3,'RUNNING','UNMEASURABLE') RETURNING id",
    [tenantId, requestedBy, trigger],
  );
  const runId = String(run.rows[0].id);

  try {
    const output = await graph.invoke({
      tenantId,
      requestedBy,
      trigger,
      runId,
      reviewContext: "initial review: only tenant-scoped OBSERVED events are evidence; absent evidence is not a clean result.",
    });
    if (!output.finalResult) throw new Error("agentic_soc_graph_no_result");
    return output.finalResult;
  } catch (error) {
    await db.query(
      "UPDATE autonomous_analyst_runs SET status='FAILED',completed_at=now(),summary=$2 WHERE id=$1",
      [runId, JSON.stringify({
        errorCode: error instanceof Error ? error.message.slice(0, 120) : "agentic_soc_graph_failed",
        engine: "LangGraph bounded evidence workflow",
      })],
    ).catch(() => undefined);
    throw error;
  }
}

export async function testTenantNimConnection(tenantId: string) {
  const connection = await getTenantNimConnection(tenantId);
  if (!connection) return { ok: false as const, status: "NOT_CONFIGURED" as const, modelIds: [] as string[] };
  const { probeNvidiaNim } = await import("@/lib/elitze-secure/nvidia-nim");
  const probe = await probeNvidiaNim(connection);
  await getPgPool().query(
    `UPDATE ai_connections
     SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb, updated_at=now()
     WHERE id=$2 AND tenant_id=$3 AND enabled=true`,
    [JSON.stringify({
      lastProbeStatus: probe.status,
      lastProbeAt: probe.checkedAt,
      availableModels: probe.modelIds,
      selectedModel: connection.model,
      lastProbeErrorCode: probe.errorCode ?? null,
    }), connection.id, tenantId],
  );
  return { ...probe, modelName: connection.model, stateRecorded: true as const };
}
