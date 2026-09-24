import {getCurrentUser} from "@/lib/auth";
import {getDb} from "@/db";
import {crmActions,crmContacts} from "@/db/schema";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {NextRequest,NextResponse} from "next/server";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const contactSchema=z.object({
 name:z.string().trim().min(1).max(200),
 role:z.string().trim().min(1).max(120),
 organization:z.string().trim().min(1).max(160),
 emailDomain:z.string().trim().max(120).optional(),
 associatedAgents:z.array(z.string().trim().max(160)).max(100).optional(),
 associatedIntegrations:z.array(z.string().trim().max(160)).max(100).optional(),
 tags:z.array(z.string().trim().max(80)).max(100).optional(),
 riskTier:z.enum(["low","medium","high","critical"]).default("low"),
 notes:z.string().trim().max(10000).optional(),
});

const actionSchema=z.object({
 contactId:z.number().int().positive(),
 agentSlug:z.string().trim().max(160).optional(),
 actionType:z.string().trim().min(1).max(80),
 status:z.enum(["pending","completed","failed","cancelled"]).default("pending"),
 result:z.string().trim().max(10000).optional(),
});

export async function GET(_request:NextRequest){
 const user=await getCurrentUser().catch(()=>null);
 if(!user)return NextResponse.json({ok:false,error:"authentication_required"},{status:401});
 try{
  const db=getDb();
  const[contacts,actions]=await Promise.all([
   db.select().from(crmContacts).where(eq(crmContacts.tenantId,user.tenantId)).orderBy(desc(crmContacts.id)),
   db.select().from(crmActions).where(eq(crmActions.tenantId,user.tenantId)).orderBy(desc(crmActions.createdAt)).limit(100),
  ]);
  return NextResponse.json({ok:true,contacts,actions,source:"tenant-scoped PostgreSQL records"});
 }catch(error){
  console.error("ELITZE CRM load failed",error);
  return NextResponse.json({ok:false,error:"crm_unavailable"},{status:503});
 }
}

export async function POST(request:NextRequest){
 const user=await getCurrentUser().catch(()=>null);
 if(!user)return NextResponse.json({ok:false,error:"authentication_required"},{status:401});
 const body=await request.json().catch(()=>null);
 const contact=contactSchema.safeParse(body);
 const action=actionSchema.safeParse(body);
 try{
  const db=getDb();
  if(contact.success){
   const [row]=await db.insert(crmContacts).values({
    tenantId:user.tenantId,
    name:contact.data.name,
    role:contact.data.role,
    organization:contact.data.organization,
    emailDomain:contact.data.emailDomain||null,
    associatedAgents:contact.data.associatedAgents??[],
    associatedIntegrations:contact.data.associatedIntegrations??[],
    tags:contact.data.tags??[],
    riskTier:contact.data.riskTier,
    notes:contact.data.notes||null,
   }).returning();
   return NextResponse.json({ok:true,contact:row,source:"tenant-scoped PostgreSQL records"},{status:201});
  }
  if(action.success){
   const exists=await db.select({id:crmContacts.id}).from(crmContacts).where(and(eq(crmContacts.id,action.data.contactId),eq(crmContacts.tenantId,user.tenantId))).limit(1);
   if(!exists.length)return NextResponse.json({ok:false,error:"contact_not_found"},{status:404});
   const [row]=await db.insert(crmActions).values({
    tenantId:user.tenantId,
    contactId:action.data.contactId,
    agentSlug:action.data.agentSlug||null,
    actionType:action.data.actionType,
    status:action.data.status,
    result:action.data.result||null,
   }).returning();
   return NextResponse.json({ok:true,action:row,source:"tenant-scoped PostgreSQL records"},{status:201});
  }
  return NextResponse.json({ok:false,error:"invalid_crm_payload"},{status:400});
 }catch(error){
  console.error("ELITZE CRM write failed",error);
  return NextResponse.json({ok:false,error:"crm_unavailable"},{status:503});
 }
}
