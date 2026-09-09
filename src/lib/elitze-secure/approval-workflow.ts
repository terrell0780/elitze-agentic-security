import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { securityApprovals } from "@/db/enterprise-workflow-schema";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

export type ApprovalRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface ApprovalRequest {
  tenantId: string;
  requestedBy: string;
  agentId?: string;
  action: string;
  target: string;
  risk: ApprovalRisk;
  rationale: string;
  evidenceIds?: string[];
  ttlMinutes?: number;
}

const audit = new AuditLedger();

export async function createApproval(input: ApprovalRequest) {
  const ttl = Math.min(Math.max(input.ttlMinutes ?? 30, 5), 24 * 60);
  const expiresAt = new Date(Date.now() + ttl * 60_000);
  const approvalId = `APR-${randomUUID()}`;
  const [row] = await getDb()
    .insert(securityApprovals)
    .values({
      approvalId,
      tenantId: input.tenantId,
      requestedBy: input.requestedBy,
      agentId: input.agentId,
      action: input.action,
      target: input.target,
      risk: input.risk,
      rationale: input.rationale,
      evidenceIds: input.evidenceIds ?? [],
      expiresAt,
    })
    .returning();
  audit.append(input.tenantId, "security.approval.created", { approvalId, action: input.action, target: input.target, risk: input.risk });
  return row;
}

export async function listPendingApprovals(tenantId: string) {
  const now = new Date();
  const rows = await getDb()
    .select()
    .from(securityApprovals)
    .where(and(eq(securityApprovals.tenantId, tenantId), eq(securityApprovals.status, "PENDING"), gt(securityApprovals.expiresAt, now)))
    .orderBy(desc(securityApprovals.createdAt));
  return rows;
}

export async function decideApproval(input: { tenantId: string; approvalId: string; decidedBy: string; decision: "APPROVED" | "REJECTED"; reason: string }) {
  const [row] = await getDb()
    .update(securityApprovals)
    .set({
      status: input.decision,
      decidedBy: input.decidedBy,
      decisionReason: input.reason,
      decidedAt: new Date(),
    })
    .where(and(eq(securityApprovals.tenantId, input.tenantId), eq(securityApprovals.approvalId, input.approvalId), eq(securityApprovals.status, "PENDING")))
    .returning();

  if (!row) return null;
  audit.append(input.tenantId, "security.approval.decided", {
    approvalId: input.approvalId,
    decision: input.decision,
    decidedBy: input.decidedBy,
  });
  return row;
}

export async function expireStaleApprovals(tenantId?: string) {
  const now = new Date();
  const where = tenantId
    ? and(eq(securityApprovals.tenantId, tenantId), eq(securityApprovals.status, "PENDING"), lt(securityApprovals.expiresAt, now))
    : and(eq(securityApprovals.status, "PENDING"), lt(securityApprovals.expiresAt, now));
  const rows = await getDb().update(securityApprovals).set({ status: "EXPIRED" }).where(where).returning({ approvalId: securityApprovals.approvalId, tenantId: securityApprovals.tenantId });
  for (const row of rows) audit.append(row.tenantId, "security.approval.expired", { approvalId: row.approvalId });
  return rows;
}
