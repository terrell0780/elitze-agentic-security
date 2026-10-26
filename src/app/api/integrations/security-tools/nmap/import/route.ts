import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { parseNmapXml } from "@/lib/elitze-secure/security-tool-integrations";
import { recordGraphEvidence, upsertGraphNode } from "@/lib/elitze-secure/security-graph-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }

  const body = await request.json().catch(() => null) as { tenantId?: unknown; scanId?: unknown; xml?: unknown } | null;
  if (!body || typeof body.tenantId !== "string" || !uuidPattern.test(body.tenantId)) {
    return NextResponse.json({ ok: false, error: "valid_tenant_id_required" }, { status: 400, headers: privateHeaders });
  }
  if (typeof body.xml !== "string") {
    return NextResponse.json({ ok: false, error: "nmap_xml_required" }, { status: 400, headers: privateHeaders });
  }

  const scanId = typeof body.scanId === "string" ? body.scanId.trim() : new Date().toISOString().replace(/[:.]/g, "-");
  if (!/^[A-Za-z0-9._:-]{1,100}$/.test(scanId)) {
    return NextResponse.json({ ok: false, error: "invalid_scan_id" }, { status: 400, headers: privateHeaders });
  }

  let hosts;
  try {
    hosts = parseNmapXml(body.xml);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "nmap_xml_invalid",
    }, { status: 400, headers: privateHeaders });
  }

  const observedAt = new Date().toISOString();
  let openPortsObserved = 0;
  try {
    for (const host of hosts) {
      openPortsObserved += host.openPorts.length;
      const subjectKey = `nmap-host:${host.address}`;
      const node = await upsertGraphNode({
        tenantId: body.tenantId,
        nodeType: "DEPLOYMENT_ENVIRONMENT",
        subjectKey,
        displayName: host.hostnames[0] ? `${host.hostnames[0]} (${host.address})` : host.address,
        source: "nmap-xml-import",
        evidenceState: "OBSERVED",
        sourceRef: `nmap:${scanId}:${host.address}`,
        observedAt,
        metadata: {
          address: host.address,
          addressType: host.addressType,
          status: host.status,
          hostnames: host.hostnames,
          openPortCount: host.openPorts.length,
          openPorts: host.openPorts,
          scanId,
          rawXmlStored: false,
        },
      });
      await recordGraphEvidence({
        tenantId: body.tenantId,
        nodeId: String(node.id),
        evidenceKind: "OBSERVATION",
        source: "nmap-xml-import",
        sourceRef: `nmap:${scanId}:${host.address}`,
        observedAt,
        payload: {
          scanId,
          address: host.address,
          addressType: host.addressType,
          openPortCount: host.openPorts.length,
          openPorts: host.openPorts,
          rawXmlStored: false,
        },
      });
    }
  } catch (error) {
    console.error("ELITZE Nmap evidence import failed", error);
    return NextResponse.json({ ok: false, error: "nmap_evidence_persist_failed" }, { status: 503, headers: privateHeaders });
  }

  return NextResponse.json({
    ok: true,
    source: "nmap-xml-import",
    evidenceState: "OBSERVED",
    scanId,
    hostsObserved: hosts.length,
    openPortsObserved,
    rawXmlStored: false,
    observedAt,
  }, { headers: privateHeaders });
}
