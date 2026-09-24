import {getCurrentUser} from "@/lib/auth";
import {getDb} from "@/db";
import {crmActions,crmContacts} from "@/db/schema";
import {desc,eq} from "drizzle-orm";
import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic"; export const runtime="nodejs";
export async function GET(_request:NextRequest){
 const user=await getCurrentUser().catch(()=>null);
 if(!user)return NextResponse.json({ok:false,error:"authentication_required"},{status:401});
 try{
  const db=getDb();
  const[contacts,actions]=await Promise.all([
   db.select().from(crmContacts).where(eq(crmContacts.tenantId,user.tenantId)).orderBy(desc(crmContacts.id)),
   db.select().from(crmActions).where(eq(crmActions.tenantId,user.tenantId)).orderBy(desc(crmActions.createdAt)).limit(100)
  ]);
  return NextResponse.json({ok:true,contacts,actions,source:"tenant-scoped PostgreSQL records"});
 }catch(error){console.error("ELITZE CRM load failed",error);return NextResponse.json({ok:false,error:"crm_unavailable"},{status:503})}
}