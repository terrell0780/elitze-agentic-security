import { createHash, randomUUID } from "node:crypto";

export interface AuditEvent<T = unknown> {
  id: string;
  tenantId: string;
  type: string;
  occurredAt: string;
  payload: T;
  previousHash: string | null;
  hash: string;
}

export class AuditLedger {
  private previousHash: string | null = null;

  append<T>(tenantId: string, type: string, payload: T): AuditEvent<T> {
    const base = {
      id: randomUUID(),
      tenantId,
      type,
      occurredAt: new Date().toISOString(),
      payload,
      previousHash: this.previousHash
    };
    const hash = createHash("sha256").update(JSON.stringify(base)).digest("hex");
    this.previousHash = hash;
    return { ...base, hash };
  }
}