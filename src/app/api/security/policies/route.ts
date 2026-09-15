import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { parsePolicyDocument } from "@/lib/elitze-secure/deterministic-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX ?? 10) });
function authorized(request: NextRequest) {
  return authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY);
}
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } }); }

export async function GET(request: NextRequest) {
  if (!authorized(request)) return json({ ok: false, error: "unauthorized" }, 401);
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  if (!tenantId) return json({ ok: false, error: "tenant_id_required" }, 400);
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT id, name, version, definition, active, created_by, expires_at, created_at
       FROM security_policies WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return json({ ok: true, policies: result.rows });
  } finally { client.release(); }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return json({ ok: false, error: "unauthorized" }, 401);
  if (!process.env.DATABASE_URL) return json({ ok: false, error: "database_unconfigured" }, 503);
  const body = await request.json().catch(() => null) as { tenantId?: string; createdBy?: string; policy?: string | Record<string, unknown> } | null;
  if (!body?.tenantId || !body?.createdBy || !body.policy) return json({ ok: false, error: "tenantId_createdBy_policy_required" }, 400);
  let parsed;
  try { parsed = parsePolicyDocument(typeof body.policy === "string" ? body.policy : JSON.stringify(body.policy)); }
  catch (error) { return json({ ok: false, error: error instanceof Error ? error.message : "invalid_policy" }, 400); }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO security_policies (tenant_id, name, version, definition, active, created_by)
       VALUES ($1,$2,$3,$4::jsonb,true,$5)
       ON CONFLICT (tenant_id, name, version) DO UPDATE SET definition = EXCLUDED.definition, active = true, created_by = EXCLUDED.created_by
       RETURNING id, name, version, active, created_at`,
      [body.tenantId, parsed.name, parsed.version ?? "1", JSON.stringify(parsed), body.createdBy],
    );
    return json({ ok: true, policy: result.rows[0] }, 201);
  } finally { client.release(); }
}
