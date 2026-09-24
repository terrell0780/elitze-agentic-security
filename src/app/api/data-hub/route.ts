import {getCurrentUser} from "@/lib/auth";
import {getDb} from "@/db";
import {dataSources,insights} from "@/db/schema";
import {and,desc,eq} from "drizzle-orm";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic"; export const runtime="nodejs";
export async function GET(request:Request){
 const user=await getCurrentUser().catch(()=>null);
 if(!user)return NextResponse.json({ok:false,error:"authentication_required"},{status:401});
 try{
  const db=getDb(); const kind=new URL(request.url).searchParams.get("kind");
  const sources=await db.select().from(dataSources).where(eq(dataSources.tenantId,user.tenantId)).orderBy(desc(dataSources.id));
  const filter=kind?and(eq(insights.tenantId,user.tenantId),eq(insights.kind,kind)):eq(insights.tenantId,user.tenantId);
  const rows=await db.select().from(insights).where(filter).orderBy(desc(insights.createdAt));
  return NextResponse.json({ok:true,sources,insights:rows,source:"tenant-scoped PostgreSQL records"});
 }catch(error){console.error("ELITZE data hub load failed",error);return NextResponse.json({ok:false,error:"data_hub_unavailable"},{status:503})}
}