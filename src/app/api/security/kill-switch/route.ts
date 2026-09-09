import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MAX_BODY_BYTES = 32 * 1024;
const MAX_SCOPE_LENGTH = 200;
const MAX_REASON_LENGTH = 2000;
const MAX_IDEMPOTENCY_LENGTH = 200;
const MAX_ACTOR_LENGTH = 200;
const audit = new AuditLedger();

type ContainmentRow = { id: string; tenant_id: string; scope: string; requested_by: string; reason: string; idempotency_key: string; status: string; executor_status: string; requested_at: string; executed_at: string | null; verified_at: string | null; result: unknown };

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { scope, reason, tenantId, actorId, idempotencyKey } = body as Record<string, unknown>;
  if (typeof tenantId !== "string" || !tenantId.trim() || tenantId.length > 200 || typeof actorId !== "string" || !actorId.trim() || actorId.length > MAX_ACTOR_LENGTH || typeof scope !== "string" || !scope.trim() || scope.length > MAX_SCOPE_LENGTH || typeof reason !== "string" || !reason.trim() || reason.length > MAX_REASON_LENGTH || typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > MAX_IDEMPOTENCY_LENGTH) return NextResponse.json({ error: "tenant_actor_scope_reason_and_idempotency_key_required" }, { status: 400 });

  const id = randomUUID();
  let row: ContainmentRow;
  try {
    const result = await getDb().execute(sql`
      INSERT INTO containment_actions (id, tenant_id, scope, requested_by, reason, idempotency_key)
      VALUES (${id}::uuid, ${tenantId}, ${scope}, ${actorId}, ${reason}, ${idempotencyKey})
      ON CONFLICT (tenant_id, idempotency_key) DO NOTHING
      RETURNING id, tenant_id, scope, requested_by, reason, idempotency_key, status, executor_status, requested_at, executed_at, verified_at, result
    `);
    const inserted = (result as unknown as { rows: ContainmentRow[] }).rows[0];
    if (inserted) row = inserted;
    else {
      const existing = await getDb().execute(sql`SELECT id, tenant_id, scope, requested_by, reason, idempotency_key, status, executor_status, requested_at, executed_at, verified_at, result FROM containment_actions WHERE tenant_id = ${tenantId} AND idempotency_key = ${idempotencyKey}`);
      row = (existing as unknown as { rows: ContainmentRow[] }).rows[0];
      if (!row) throw new Error("containment_record_not_found_after_conflict");
      return NextResponse.json({ status: row.status.toLowerCase(), request_id: row.id, scope: row.scope, requested_at: row.requested_at, idempotent_replay: true }, { status: 200, headers: { "cache-control": "no-store" } });
    }
    await audit.append(tenantId, "security.containment.requested", { requestId: row.id, scope, actorId, reason, idempotencyKey });
  } catch (error) {
    console.error("ELITZE containment persistence failed", error);
    return NextResponse.json({ error: "containment_request_persistence_failed" }, { status: 503 });
  }

  const executorUrl = process.env.ELITZE_CONTAINMENT_EXECUTOR_URL?.trim();
  if (!executorUrl) {
    await getDb().execute(sql`UPDATE containment_actions SET status = 'RECORDED', executor_status = 'NOT_CONFIGURED' WHERE id = ${row.id}::uuid`).catch(() => undefined);
    return NextResponse.json({ status: "recorded", request_id: row.id, scope, requested_at: row.requested_at, executor: "not_configured", error: "containment_executor_not_configured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  try {
    const headers: HeadersInit = { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey };
    const executorKey = process.env.ELITZE_CONTAINMENT_EXECUTOR_KEY?.trim(); if (executorKey) headers.Authorization = `Bearer ${executorKey}`;
    const response = await fetch(executorUrl, { method: "POST", headers, body: JSON.stringify({ requestId: row.id, tenantId, scope, reason, requestedAt: row.requested_at }), cache: "no-store", signal: AbortSignal.timeout(10_000) });
    let executorResult: unknown = null; try { executorResult = await response.json(); } catch { executorResult = null; }
    if (!response.ok) throw new Error(`executor_http_${response.status}`);
    const verified = Boolean(executorResult && typeof executorResult === "object" && (executorResult as Record<string, unknown>).verified === true);
    if (!verified) {
      await getDb().execute(sql`UPDATE containment_actions SET status = 'EXECUTED_UNVERIFIED', executor_status = 'ACCEPTED_UNVERIFIED', result = ${JSON.stringify(executorResult)}::jsonb, executed_at = now() WHERE id = ${row.id}::uuid`);
      await audit.append(tenantId, "security.containment.unverified", { requestId: row.id, scope, executorResult });
      return NextResponse.json({ status: "executed_unverified", request_id: row.id, scope, error: "containment_verification_required" }, { status: 502, headers: { "cache-control": "no-store" } });
    }
    await getDb().execute(sql`UPDATE containment_actions SET status = 'VERIFIED', executor_status = 'VERIFIED', result = ${JSON.stringify(executorResult)}::jsonb, executed_at = now(), verified_at = now() WHERE id = ${row.id}::uuid`);
    await audit.append(tenantId, "security.containment.verified", { requestId: row.id, scope, executorResult });
    return NextResponse.json({ status: "verified", request_id: row.id, scope, requested_at: row.requested_at }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE containment executor failed", error);
    await getDb().execute(sql`UPDATE containment_actions SET status = 'FAILED', executor_status = 'FAILED', result = ${JSON.stringify({ error: String(error) })}::jsonb WHERE id = ${row.id}::uuid`).catch(() => undefined);
    await audit.append(tenantId, "security.containment.failed", { requestId: row.id, scope, error: "executor_failure" }).catch(() => undefined);
    return NextResponse.json({ status: "recorded", request_id: row.id, scope, requested_at: row.requested_at, executor: "failed", error: "containment_executor_failed" }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
