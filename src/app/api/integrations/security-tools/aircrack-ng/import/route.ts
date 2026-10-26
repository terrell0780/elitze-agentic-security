import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { parseWifiSurveyCsv } from "@/lib/elitze-secure/wifi-survey-import";
import { recordGraphEvidence, upsertGraphNode } from "@/lib/elitze-secure/security-graph-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }
  const body = await request.json().catch(() => null) as { tenantId?: unknown; surveyId?: unknown; csv?: unknown } | null;
  if (!body || typeof body.tenantId !== "string" || !uuidPattern.test(body.tenantId)) {
    return NextResponse.json({ ok: false, error: "valid_tenant_id_required" }, { status: 400, headers: privateHeaders });
  }
  if (typeof body.csv !== "string") {
    return NextResponse.json({ ok: false, error: "wifi_survey_csv_required" }, { status: 400, headers: privateHeaders });
  }
  const surveyId = typeof body.surveyId === "string" ? body.surveyId.trim() : new Date().toISOString().replace(/[:.]/g, "-");
  if (!/^[A-Za-z0-9._:-]{1,100}$/.test(surveyId)) {
    return NextResponse.json({ ok: false, error: "invalid_survey_id" }, { status: 400, headers: privateHeaders });
  }

  let accessPoints;
  try {
    accessPoints = parseWifiSurveyCsv(body.csv);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "wifi_survey_csv_invalid" }, { status: 400, headers: privateHeaders });
  }

  const observedAt = new Date().toISOString();
  try {
    for (const ap of accessPoints) {
      const node = await upsertGraphNode({
        tenantId: body.tenantId,
        nodeType: "DEPLOYMENT_ENVIRONMENT",
        subjectKey: `wifi-access-point:${ap.bssid}`,
        displayName: ap.essid ? `${ap.essid} (${ap.bssid})` : ap.bssid,
        source: "wifi-survey-csv-import",
        evidenceState: "OBSERVED",
        sourceRef: `wifi-survey:${surveyId}:${ap.bssid}`,
        observedAt,
        metadata: {
          surveyId,
          bssid: ap.bssid,
          essid: ap.essid,
          channel: ap.channel,
          privacy: ap.privacy,
          cipher: ap.cipher,
          authentication: ap.authentication,
          power: ap.power,
          beaconCount: ap.beaconCount,
          rawCsvStored: false,
          clientStationRecordsStored: false,
          recoveredKeysStored: false,
        },
      });
      await recordGraphEvidence({
        tenantId: body.tenantId,
        nodeId: String(node.id),
        evidenceKind: "OBSERVATION",
        source: "wifi-survey-csv-import",
        sourceRef: `wifi-survey:${surveyId}:${ap.bssid}`,
        observedAt,
        payload: {
          surveyId,
          bssid: ap.bssid,
          essid: ap.essid,
          channel: ap.channel,
          privacy: ap.privacy,
          cipher: ap.cipher,
          authentication: ap.authentication,
          power: ap.power,
          beaconCount: ap.beaconCount,
          rawCsvStored: false,
          clientStationRecordsStored: false,
          recoveredKeysStored: false,
        },
      });
    }
  } catch (error) {
    console.error("ELITZE Wi-Fi survey evidence import failed", error);
    return NextResponse.json({ ok: false, error: "wifi_survey_evidence_persist_failed" }, { status: 503, headers: privateHeaders });
  }

  return NextResponse.json({
    ok: true,
    source: "wifi-survey-csv-import",
    evidenceState: "OBSERVED",
    surveyId,
    accessPointsObserved: accessPoints.length,
    rawCsvStored: false,
    clientStationRecordsStored: false,
    recoveredKeysStored: false,
    observedAt,
  }, { headers: privateHeaders });
}
