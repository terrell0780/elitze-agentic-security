import {getCurrentUser} from "@/lib/auth";
import {getDb} from "@/db";
import {agentIntegrations,elitzeGlobalViewFindings,useCases} from "@/db/schema";
import {asc,eq} from "drizzle-orm";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 const user=await getCurrentUser().catch(()=>null);
 if(!user)return NextResponse.json({ok:false,error:"authentication_required"},{status:401});
 try{
  const db=getDb(); const category=new URL(request.url).searchParams.get("category");
  const cases=category?await db.select().from(useCases).where(eq(useCases.category,category)).orderBy(asc(useCases.sortOrder)):await db.select().from(useCases).orderBy(asc(useCases.sortOrder));
  const integrations=await db.select().from(agentIntegrations).orderBy(asc(agentIntegrations.id));
  const findings=await db.select().from(elitzeGlobalViewFindings).where(eq(elitzeGlobalViewFindings.tenantId,user.tenantId)).orderBy(asc(elitzeGlobalViewFindings.id));
  return NextResponse.json({ok:true,useCases:cases,integrations,findings,industries:["Financial services","Healthcare","Government","SaaS and technology","Retail and commerce","Telecommunications","Manufacturing","Security operations"],source:"catalog metadata + tenant-scoped PostgreSQL findings"});
 }catch(error){console.error("ELITZE use-case load failed",error);return NextResponse.json({ok:false,error:"use_cases_unavailable"},{status:503})}
}
