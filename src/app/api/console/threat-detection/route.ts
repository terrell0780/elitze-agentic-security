import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";
import { detectThreats, type DetectionEvidence } from "@/lib/elitze-secure/threat-detection";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const db = getPgPool();
    const [eventRows, sourceRows] = await Promise.all([
      db.query<DetectionEvidence>(
        `SELECT id,connector_id,event_type,subject_key,evidence_state,severity,observed_at,source_ref,payload
         FROM security_fabric_events
         WHERE tenant_id=$1 AND observed_at > now() - interval '7 days'
         ORDER BY observed_at DESC
         LIMIT 500`,
        [user.tenantId],
      ),
      db.query(
        `SELECT connector_id,health_state,integration_state,last_observed_at
         FROM security_fabric_sources
         WHERE tenant_id=$1
         ORDER BY connector_id`,
        [user.tenantId],
      ),
    ]);

    const result = detectThreats(eventRows.rows);
    const nonObservedCount = eventRows.rows.length - result.observedEventCount;
    const geoObservations = eventRows.rows
      .filter((event) => event.evidence_state === "OBSERVED")
      .flatMap((event) => {
        const payload = event.payload ?? {};
        const latitude = typeof payload.latitude === "number" && Number.isFinite(payload.latitude) ? payload.latitude : null;
        const longitude = typeof payload.longitude === "number" && Number.isFinite(payload.longitude) ? payload.longitude : null;
        if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return [];
        return [{
          id: event.id,
          latitude,
          longitude,
          label: event.subject_key || event.event_type,
          connectorId: event.connector_id,
          severity: event.severity ?? "INFO",
          observedAt: event.observed_at,
          sourceRef: event.source_ref,
          evidenceState: "OBSERVED" as const,
        }];
      });

    return NextResponse.json({
      ok: true,
      source: "tenant-scoped security_fabric_events",
      computedAt: new Date().toISOString(),
      windowDays: 7,
      evidenceState: result.observedEventCount
        ? "OBSERVED"
        : nonObservedCount
          ? "UNKNOWN"
          : "UNMEASURABLE",
      observedEventCount: result.observedEventCount,
      nonObservedEventCount: nonObservedCount,
      ignoredNonObservedCount: nonObservedCount,
      detectionCount: result.detectionCount,
      detections: result.detections,
      rules: result.rules,
      sources: sourceRows.rows,
      geoObservations,
      measurementPolicy: "Only authenticated-tenant records explicitly marked OBSERVED are evaluated. Missing or non-observed telemetry never means no threat.",
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE threat detection failed", error);
    return NextResponse.json({
      ok: false,
      error: "threat_detection_unavailable",
      evidenceState: "UNMEASURABLE",
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
