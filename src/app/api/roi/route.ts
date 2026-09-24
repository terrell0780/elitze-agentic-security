import {getCurrentUser} from "@/lib/auth";
import {getPgPool} from "@/db";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic"; export const runtime="nodejs";
export async function GET(){
 const user=await getCurrentUser().catch(()=>null);
 if(!user)return NextResponse.json({ok:false,error:"authentication_required"},{status:401});
 try{
  const db=getPgPool(),tenantId=user.tenantId;
  const[decisions,events,paths,redTeam,evidence]=await Promise.all([
   db.query("SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE decision='deny')::int AS denied FROM security_decisions WHERE tenant_id=$1",[tenantId]),
   db.query("SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE severity IN ('critical','high'))::int AS high_impact FROM enforcement_events WHERE tenant_id=$1",[tenantId]),
   db.query("SELECT COUNT(*)::int AS resolved FROM attack_paths WHERE tenant_id=$1 AND status IN ('resolved','closed')",[tenantId]),
   db.query("SELECT COUNT(*) FILTER(WHERE status IN ('completed','complete','succeeded'))::int AS completed FROM red_team_runs WHERE tenant_id=$1",[tenantId]),
   db.query("SELECT COUNT(*)::int AS total FROM evidence_records WHERE tenant_id=$1",[tenantId])
  ]);
  const d=decisions.rows[0]??{},e=events.rows[0]??{},p=paths.rows[0]??{},r=redTeam.rows[0]??{},v=evidence.rows[0]??{};
  return NextResponse.json({ok:true,source:"tenant-scoped PostgreSQL records",observed:{securityDecisions:Number(d.total??0),deniedDecisions:Number(d.denied??0),highImpactEvents:Number(e.high_impact??0),resolvedAttackPaths:Number(p.resolved??0),completedRedTeamRuns:Number(r.completed??0),evidenceRecords:Number(v.total??0),enforcementEvents:Number(e.total??0)},measurementPolicy:"Observed signals come only from authenticated tenant records. Financial value requires customer-approved assumptions and is never inferred from activity counts."},{headers:{"cache-control":"no-store"}});
 }catch(error){console.error("ELITZE tenant ROI load failed",error);return NextResponse.json({ok:false,error:"ROI data plane unavailable."},{status:503})}
}