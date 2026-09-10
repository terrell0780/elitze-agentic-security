import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET(){try{const user=await getCurrentUser();return Response.json({ok:true,user:user?{id:user.id,email:user.email,displayName:user.displayName,role:user.role}:null},{headers:{"cache-control":"private, no-store"}})}catch{return Response.json({ok:false,error:"session_unavailable"},{status:503,headers:{"cache-control":"no-store"}})}}
