export type DetectionEvidence = {
  id: string;
  connector_id: string;
  event_type: string;
  subject_key: string | null;
  evidence_state: string;
  severity: string | null;
  observed_at: string;
  source_ref: string | null;
  payload: Record<string, unknown> | null;
};

export type ThreatDetection = {
  detectionId: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: "MEDIUM" | "HIGH";
  evidenceState: "OBSERVED";
  ruleId: string;
  description: string;
  subject: string;
  firstObservedAt: string;
  lastObservedAt: string;
  sourceRefs: string[];
  eventIds: string[];
  techniqueIds: string[];
  nextStep: string;
};

export const THREAT_DETECTION_RULES = [
  {
    id: "ELITZE-TD-001",
    name: "High-impact source alert",
    purpose: "Elevates a source-authored HIGH or CRITICAL alert for analyst review.",
    evidence: "An authenticated-tenant event explicitly marked OBSERVED and HIGH/CRITICAL.",
  },
  {
    id: "ELITZE-TD-002",
    name: "Authentication failure cluster",
    purpose: "Correlates repeated observed authentication failures for the same subject within 30 minutes.",
    evidence: "At least 3 source-observed authentication failure events. Single events do not trigger the cluster rule.",
  },
  {
    id: "ELITZE-TD-003",
    name: "Explicit credential or data-exfiltration signal",
    purpose: "Flags an observed event explicitly describing credential exposure or data exfiltration.",
    evidence: "The event type or source-authored indicator explicitly names credential exposure or exfiltration.",
  },
  {
    id: "ELITZE-TD-004",
    name: "Sensitive tool or policy denial",
    purpose: "Surfaces observed denials at an MCP/tool/policy execution boundary for security review.",
    evidence: "The event type or recorded decision explicitly indicates a denial; ELITZE does not treat a denial itself as a successful attack.",
  },
] as const;

const severityWeight: Record<string, number> = { INFO: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
const attackIdPattern = /^T\d{4}(?:\.\d{3})?$/;

function payloadString(payload: Record<string, unknown>, ...keys: string[]) {
  return keys.map((key) => typeof payload[key] === "string" ? String(payload[key]) : "").join(" ").toLowerCase();
}

function sourceTechniqueIds(events: DetectionEvidence[]) {
  return [...new Set(events.flatMap((event) => {
    const values = event.payload?.techniqueIds;
    const list = Array.isArray(values) ? values : [event.payload?.techniqueId];
    return list.filter((value): value is string => typeof value === "string" && attackIdPattern.test(value.trim())).map((value) => value.trim());
  }))];
}

function observed(events: DetectionEvidence[]) {
  return events.filter((event) =>
    event.evidence_state === "OBSERVED"
    && Boolean(event.id)
    && Number.isFinite(Date.parse(event.observed_at))
    && Boolean(event.connector_id),
  );
}

function strongestSeverity(events: DetectionEvidence[], fallback: ThreatDetection["severity"]): ThreatDetection["severity"] {
  const current = events.reduce<ThreatDetection["severity"]>((value, event) => {
    const raw = (event.severity ?? "").toUpperCase();
    const severity: ThreatDetection["severity"] =
      raw === "CRITICAL" || raw === "HIGH" || raw === "MEDIUM" || raw === "LOW"
        ? raw
        : "LOW";
    return (severityWeight[severity] ?? 0) > (severityWeight[value] ?? 0) ? severity : value;
  }, fallback);
  if (current === "CRITICAL" || current === "HIGH" || current === "MEDIUM" || current === "LOW") return current;
  return fallback;
}

function buildDetection(
  ruleId: string,
  title: string,
  description: string,
  events: DetectionEvidence[],
  nextStep: string,
  overrideSeverity?: ThreatDetection["severity"],
  defaultSeverity: ThreatDetection["severity"] = "MEDIUM",
): ThreatDetection {
  const ordered = [...events].sort((a, b) => Date.parse(a.observed_at) - Date.parse(b.observed_at));
  const sourceRefs = [...new Set(ordered.map((event) => event.source_ref || event.id).filter(Boolean))];
  const severity = overrideSeverity ?? strongestSeverity(ordered, defaultSeverity);
  const subject = [...new Set(ordered.map((event) => event.subject_key?.trim()).filter((value): value is string => Boolean(value)))].join(", ")
    || [...new Set(ordered.map((event) => event.connector_id))].join(", ");
  return {
    detectionId: ruleId + ":" + ordered.map((event) => event.id).join(",").slice(0, 160),
    title,
    severity,
    confidence: ordered.length >= 3 ? "HIGH" : "MEDIUM",
    evidenceState: "OBSERVED",
    ruleId,
    description,
    subject,
    firstObservedAt: ordered[0].observed_at,
    lastObservedAt: ordered[ordered.length - 1].observed_at,
    sourceRefs,
    eventIds: ordered.map((event) => event.id),
    techniqueIds: ruleId === "ELITZE-TD-002"
      ? [...new Set([...sourceTechniqueIds(ordered), "T1110"])]
      : sourceTechniqueIds(ordered),
    nextStep,
  };
}

export function detectThreats(input: DetectionEvidence[]) {
  const events = observed(input);
  const detections: ThreatDetection[] = [];
  const highImpact = events.filter((event) => ["HIGH", "CRITICAL"].includes((event.severity ?? "").toUpperCase()));
  for (const event of highImpact) {
    detections.push(buildDetection(
      "ELITZE-TD-001",
      "High-impact source alert",
      "A connected source marked this event as high or critical. ELITZE preserves that source severity; this is not an independent validation of the underlying claim.",
      [event],
      "Review the original source record and correlate with independent telemetry before containment.",
      (event.severity ?? "").toUpperCase() === "CRITICAL" ? "CRITICAL" : "HIGH",
    ));
  }

  const authFailures = events.filter((event) => {
    const type = event.event_type.toLowerCase();
    const payload = event.payload ?? {};
    const evidenceText = payloadString(payload, "category", "action", "outcome", "result", "alertName", "description");
    return /(auth|login|credential|sign.?in)/.test(type + " " + evidenceText)
      && /(fail|denied|reject|invalid|blocked|lockout)/.test(type + " " + evidenceText);
  });
  const groups = new Map<string, DetectionEvidence[]>();
  for (const event of authFailures) {
    const payload = event.payload ?? {};
    const key = event.subject_key?.trim()
      || (typeof payload.sourceIp === "string" ? payload.sourceIp : "")
      || (typeof payload.src_ip === "string" ? payload.src_ip : "")
      || event.connector_id;
    const group = groups.get(key) ?? [];
    group.push(event);
    groups.set(key, group);
  }
  for (const [subject, group] of groups) {
    const ordered = [...group].sort((a, b) => Date.parse(a.observed_at) - Date.parse(b.observed_at));
    let start = 0;
    for (let end = 0; end < ordered.length; end += 1) {
      while (Date.parse(ordered[end].observed_at) - Date.parse(ordered[start].observed_at) > 30 * 60_000) start += 1;
      const window = ordered.slice(start, end + 1);
      if (window.length >= 3) {
        detections.push(buildDetection(
          "ELITZE-TD-002",
          "Authentication failure cluster",
          "At least three observed authentication failures for the same source-bound subject occurred within a 30-minute window.",
          window,
          "Correlate identity-provider and endpoint records; review rate limits and account lockout policy. Do not block an identity from this rule alone.",
          "HIGH",
        ));
        break;
      }
    }
  }

  const exfiltration = events.filter((event) => {
    const type = event.event_type.toLowerCase();
    const payload = event.payload ?? {};
    const evidenceText = payloadString(payload, "category", "action", "result", "alertName", "indicator", "description", "ruleName");
    return /(credential_exposure|secret_exposed|data_exfiltration|exfiltration|credential.?leak)/.test(type + " " + evidenceText);
  });
  if (exfiltration.length) {
    const clusters = new Map<string, DetectionEvidence[]>();
    for (const event of exfiltration) {
      const key = event.subject_key?.trim() || event.connector_id;
      const group = clusters.get(key) ?? [];
      group.push(event);
      clusters.set(key, group);
    }
    for (const [subject, group] of clusters) {
      detections.push(buildDetection(
        "ELITZE-TD-003",
        "Explicit credential or exfiltration signal",
        "A connected source explicitly named credential exposure or data exfiltration. This signal requires source-level investigation; no exfiltration is inferred from generic network traffic.",
        group,
        "Preserve the source event and associated object; verify data access, approved destination, and incident scope before response.",
        "CRITICAL",
      ));
    }
  }

  const denials = events.filter((event) => {
    const type = event.event_type.toLowerCase();
    const payload = event.payload ?? {};
    const evidenceText = payloadString(payload, "decision", "action", "outcome", "result", "status");
    const isExecutionBoundary = /(mcp|tool|policy|execution|authorization)/.test(type);
    const isDenied = /(deny|denied|blocked|rejected|not_authorized|forbidden)/.test(type + " " + evidenceText);
    return isExecutionBoundary && isDenied;
  });
  if (denials.length) {
    const latestByKey = new Map<string, DetectionEvidence[]>();
    for (const event of denials) {
      const key = event.subject_key?.trim() || event.connector_id;
      const group = latestByKey.get(key) ?? [];
      group.push(event);
      latestByKey.set(key, group);
    }
    for (const group of latestByKey.values()) {
      detections.push(buildDetection(
        "ELITZE-TD-004",
        "Sensitive tool or policy denial",
        "A source-observed policy or execution boundary denied an action. A denial may indicate a control worked; it is not evidence that the action succeeded.",
        group,
        "Inspect the policy decision and attempted capability; preserve the denial as control evidence and investigate only if surrounding telemetry warrants it.",
      ));
    }
  }

  return {
    rules: THREAT_DETECTION_RULES,
    evidenceState: events.length ? "OBSERVED" as const : "UNMEASURABLE" as const,
    inputEventCount: input.length,
    observedEventCount: events.length,
    ignoredNonObservedCount: input.length - events.length,
    detections,
    detectionCount: detections.length,
    sourceRefs: [...new Set(detections.flatMap((detection) => detection.sourceRefs))],
  };
}
