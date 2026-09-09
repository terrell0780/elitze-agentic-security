import { NextRequest } from "next/server";
import { z } from "zod";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { createApproval, decideApproval, expireStaleApprovals, listPendingApprovals } from "@/lib/elitze-secure/approval-workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  tenantId: z.string().min(1),
  requestedBy: z.string().min(1),
  agentId: z.string().optional(),
  action: z.string().min(1),
  target: z.string().min(1),
  risk: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  rationale: z.string().min(1),
  evidenceIds: z.array(z.string()).default([]),
  ttlMinutes: z.number().int().min(5).max(1440).optional(),
});

const decisionSchema = z.object({
  tenantId: z.string().min(1),
  approvalId: z.string().min(1),
  decidedBy: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().min(1),
});

function unauthorized() {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
}

export async function GET(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) return unauthorized();
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  if (!tenantId) return Response.json({ ok: false, error: "tenantId required" }, { status: 400, headers: { "cache-control": "no-store" } });
  await expireStaleApprovals(tenantId);
  const approvals = await listPendingApprovals(tenantId);
  return Response.json({ ok: true, tenantId, approvals }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) return unauthorized();
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ ok: false, error: "invalid approval request", issues: parsed.error.issues }, { status: 400, headers: { "cache-control": "no-store" } });
  const approval = await createApproval(parsed.data);
  return Response.json({ ok: true, approval }, { status: 201, headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) return unauthorized();
  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ ok: false, error: "invalid approval decision", issues: parsed.error.issues }, { status: 400, headers: { "cache-control": "no-store" } });
  const approval = await decideApproval(parsed.data);
  if (!approval) return Response.json({ ok: false, error: "approval not found or already decided" }, { status: 409, headers: { "cache-control": "no-store" } });
  return Response.json({ ok: true, approval }, { headers: { "cache-control": "no-store" } });
}
