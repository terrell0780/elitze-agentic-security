import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { ingestSecurityFabricEvent } from "@/lib/elitze-secure/security-source-fabric";
import { isSecurityConnectorId } from "@/lib/elitze-secure/security-source-fabric-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function verifyHmac(rawBody: string, signature: string | null) {
  const secret = process.env.ELITZE_INGEST_HMAC_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256",secret).update(rawBody).digest("hex");
  const left = Buffer.from(signature.replace(/^sha256=/i,""));
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left,right);
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const authenticated =
    authorizeInternalRequest(request.headers.get("x-elitze-api-key"),process.env.ELITZE_INTERNAL_API_KEY) ||
    verifyHmac(raw,request.headers.get("x-elitze-signature"));
  if (!authenticated) return NextResponse.json({ ok:false,error:"unauthorized" },{ status:401 });

  let body: {
    tenantId?: string;
    connectorId?: string;
    eventType?: string;
    subjectKey?: string;
    evidenceState?: "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
    severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    observedAt?: string;
    sourceRef?: string;
    payload?: Record<string,unknown>;
    metadata?: Record<string,unknown>;
  };

  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok:false,error:"invalid_json" },{ status:400 });
  }

  if (!body.tenantId || !body.connectorId || !isSecurityConnectorId(body.connectorId) || !body.eventType) {
    return NextResponse.json({ ok:false,error:"tenant_connector_event_required" },{ status:400 });
  }

  try {
    const result = await ingestSecurityFabricEvent(body.tenantId,{
      connectorId:body.connectorId,
      eventType:body.eventType,
      subjectKey:body.subjectKey,
      evidenceState:body.evidenceState,
      severity:body.severity,
      observedAt:body.observedAt,
      sourceRef:body.sourceRef,
      payload:body.payload,
      metadata:body.metadata,
    });
    return NextResponse.json({ ok:true,...result },{ status:202 });
  } catch (error) {
    console.error("ELITZE security fabric ingest failed",error);
    return NextResponse.json({ ok:false,error:"security_fabric_ingest_failed" },{ status:503 });
  }
}
