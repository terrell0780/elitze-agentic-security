import { createHash, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

export interface AuditEvent<T = unknown> { id: string; tenantId: string; sequence: number; type: string; occurredAt: string; payload: T; previousHash: string | null; hash: string; }
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(",")}}`;
}
function hashEvent(base: Omit<AuditEvent, "hash">): string { return createHash("sha256").update(stableStringify(base)).digest("hex"); }
export class AuditLedger {
  async append<T>(tenantId: string, type: string, payload: T): Promise<AuditEvent<T>> {
    const normalizedTenant = tenantId.trim(); if (!normalizedTenant) throw new Error("tenant_id_required_for_audit"); if (normalizedTenant.length > 200) throw new Error("tenant_id_too_long"); if (!type.trim() || type.length > 100) throw new Error("audit_type_invalid");
    const id = randomUUID(); const occurredAt = new Date().toISOString();
    return getDb().transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${normalizedTenant}, 0))`);
      const previous = await tx.execute(sql`SELECT sequence, hash FROM audit_ledger_events WHERE tenant_id = ${normalizedTenant} ORDER BY sequence DESC LIMIT 1 FOR UPDATE`);
      const row = (previous as unknown as { rows: Array<{ sequence: string | number; hash: string }> }).rows[0];
      const sequence = row ? Number(row.sequence) + 1 : 1; const previousHash = row?.hash ?? null;
      const base = { id, tenantId: normalizedTenant, sequence, type, occurredAt, payload, previousHash }; const hash = hashEvent(base);
      await tx.execute(sql`INSERT INTO audit_ledger_events (id, tenant_id, sequence, event_type, occurred_at, payload, previous_hash, hash) VALUES (${id}::uuid, ${normalizedTenant}, ${sequence}, ${type}, ${occurredAt}::timestamptz, ${JSON.stringify(payload)}::jsonb, ${previousHash}, ${hash})`);
      return { ...base, hash };
    });
  }
  async verifyTenant(tenantId: string): Promise<{ valid: boolean; checked: number; error?: string }> {
    const normalizedTenant = tenantId.trim(); if (!normalizedTenant) throw new Error("tenant_id_required_for_audit");
    const result = await getDb().execute(sql`SELECT id, tenant_id, sequence, event_type, occurred_at, payload, previous_hash, hash FROM audit_ledger_events WHERE tenant_id = ${normalizedTenant} ORDER BY sequence ASC`);
    const rows = (result as unknown as { rows: Array<Record<string, unknown>> }).rows; let previousHash: string | null = null;
    for (let index = 0; index < rows.length; index += 1) { const row = rows[index]; const base = { id: String(row.id), tenantId: String(row.tenant_id), sequence: Number(row.sequence), type: String(row.event_type), occurredAt: new Date(String(row.occurred_at)).toISOString(), payload: row.payload, previousHash: row.previous_hash === null ? null : String(row.previous_hash) }; if (base.sequence !== index + 1 || base.previousHash !== previousHash || hashEvent(base) !== String(row.hash)) return { valid: false, checked: index, error: "audit_chain_integrity_failure" }; previousHash = String(row.hash); }
    return { valid: true, checked: rows.length };
  }
}
