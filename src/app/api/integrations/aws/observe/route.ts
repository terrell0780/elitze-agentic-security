import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { observeAws } from "@/lib/elitze-secure/aws-integration";
import { upsertGraphEdge, upsertGraphNode } from "@/lib/elitze-secure/security-graph-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function firstTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim();
}
function allTags(xml: string, tag: string) {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi"))].map((m) => m[1].trim());
}

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { tenantId?: string } | null;
  if (!body?.tenantId) return NextResponse.json({ ok: false, error: "tenantId_required" }, { status: 400 });

  try {
    const observedAt = new Date().toISOString();
    const observed = await observeAws();
    const callerAccount = firstTag(observed.callerIdentityXml, "Account");
    const callerArn = firstTag(observed.callerIdentityXml, "Arn");
    const accountKey = `aws-account:${callerAccount ?? "unknown"}`;
    const accountState = callerAccount ? "OBSERVED" : "UNKNOWN";

    await upsertGraphNode({ tenantId: body.tenantId, nodeType: "DEPLOYMENT_ENVIRONMENT", subjectKey: accountKey, displayName: callerAccount ? `AWS account ${callerAccount}` : "AWS account", source: "aws-api", evidenceState: accountState, sourceRef: "aws:sts:GetCallerIdentity", observedAt, metadata: { callerArn: callerArn ?? "UNKNOWN", region: observed.region } });

    const roleArns = allTags(observed.rolesXml, "Arn");
    for (const roleArn of roleArns) {
      const key = `aws-role:${roleArn}`;
      await upsertGraphNode({ tenantId: body.tenantId, nodeType: "CLOUD_ROLE", subjectKey: key, displayName: roleArn, source: "aws-iam", evidenceState: "OBSERVED", sourceRef: "aws:iam:ListRoles", observedAt });
      if (callerArn) await upsertGraphEdge({ tenantId: body.tenantId, from: key, to: accountKey, relation: "DEPLOYED_IN", evidenceState: "OBSERVED", source: "aws-iam", accessMode: "EXECUTE", sourceRef: "aws:iam:ListRoles", observedAt });
    }

    const policyArns = allTags(observed.policiesXml, "Arn");
    for (const policyArn of policyArns) {
      const key = `aws-policy:${policyArn}`;
      await upsertGraphNode({ tenantId: body.tenantId, nodeType: "POLICY", subjectKey: key, displayName: policyArn, source: "aws-iam", evidenceState: "OBSERVED", sourceRef: "aws:iam:ListPolicies", observedAt });
    }

    let cloudTrail: unknown = "UNAVAILABLE";
    try { cloudTrail = JSON.parse(observed.cloudTrailJson); } catch { cloudTrail = "UNPARSEABLE"; }
    const events = Array.isArray((cloudTrail as any)?.Events) ? (cloudTrail as any).Events : [];
    for (const event of events) {
      const eventId = typeof event.EventId === "string" ? event.EventId : null;
      if (!eventId) continue;
      const key = `aws-cloudtrail:${eventId}`;
      await upsertGraphNode({ tenantId: body.tenantId, nodeType: "RUNTIME_ACTION", subjectKey: key, displayName: String(event.EventName ?? "AWS action"), source: "aws-cloudtrail", evidenceState: "OBSERVED", sourceRef: `aws:cloudtrail:${eventId}`, observedAt: event.EventTime ?? observedAt, metadata: { eventName: event.EventName, eventSource: event.EventSource, username: event.Username ?? null, resources: event.Resources ?? null } });
      await upsertGraphEdge({ tenantId: body.tenantId, from: accountKey, to: key, relation: "RESULTED_IN", evidenceState: "OBSERVED", source: "aws-cloudtrail", accessMode: "EXECUTE", sourceRef: `aws:cloudtrail:${eventId}`, observedAt: event.EventTime ?? observedAt });
    }

    return NextResponse.json({ ok: true, source: "aws", observedAt, region: observed.region, callerAccount: callerAccount ?? "UNKNOWN", roleCount: roleArns.length, policyCount: policyArns.length, cloudTrailEvents: events.length, evidenceState: callerAccount ? "OBSERVED" : "UNKNOWN" });
  } catch (error) {
    console.error("ELITZE AWS observation failed", error);
    return NextResponse.json({ ok: false, error: "aws_observation_failed", evidenceState: "UNAVAILABLE" }, { status: 503 });
  }
}
