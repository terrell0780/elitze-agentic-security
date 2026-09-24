import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProductionReadiness } from "@/lib/production-readiness";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(){const user=await getCurrentUser().catch(()=>null);if(!user)return NextResponse.json({ok:false,error:"authentication_required"},{status:401});const readiness=await getProductionReadiness();return NextResponse.json({ok:true,readiness},{status:readiness.releaseBlocked?503:200,headers:{"cache-control":"no-store"}});}
