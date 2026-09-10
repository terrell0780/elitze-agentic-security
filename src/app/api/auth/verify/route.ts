import { NextRequest } from "next/server";
import { consumeToken } from "@/lib/auth";
import { getDb } from "@/db";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) { const token=request.nextUrl.searchParams.get("token"); if(!token || token.length>200) return Response.json({error:"invalid_or_expired_token"},{status:400}); try { const record=await consumeToken(token,"email_verification"); if(!record) return Response.json({error:"invalid_or_expired_token"},{status:400}); await getDb().query(`UPDATE auth_users SET status='active',email_verified_at=now(),updated_at=now() WHERE id=$1 AND tenant_id=$2`,[record.userId,record.tenantId]); return Response.json({ok:true}); } catch { return Response.json({error:"verification_unavailable"},{status:503}); } }
