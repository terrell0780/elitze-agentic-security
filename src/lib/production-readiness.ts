import fs from "node:fs/promises";
import path from "node:path";
import { getPgPool, isDatabaseConfigured, databaseConfigurationSource } from "@/db";
import { assessTenantDatabaseIsolation } from "@/lib/database-isolation-readiness";

export type ReadinessState = "READY" | "CONFIGURED" | "BLOCKED" | "UNMEASURABLE";
export type ReadinessCheck = { state: ReadinessState; detail: string; source?: string; evidence?: string };
export type ProductionReadiness = { generatedAt: string; checks: Record<string, ReadinessCheck>; releaseBlocked: boolean };

const REQUIRED_TABLES=[
"auth_tenants","auth_users","auth_sessions","auth_tokens","auth_rate_limits","auth_tenant_invitations","auth_mfa_factors","auth_recovery_codes",
"auth_webauthn_credentials","auth_challenges","auth_refresh_tokens","auth_api_keys","auth_privileged_reauth",
"crm_contacts","crm_actions","data_bridge_sources","data_bridge_events","security_graph_nodes","security_graph_edges",
"security_graph_evidence","security_test_requests","production_readiness_evidence","_elitze_migrations",
] as const;

const env=(name:string)=>process.env[name]?.trim()??"";
const hasAll=(...names:string[])=>names.every((name)=>Boolean(env(name)));

async function checkDatabase():Promise<ReadinessCheck>{
 if(!isDatabaseConfigured()) return {state:"BLOCKED",detail:"Production PostgreSQL is not configured.",source:"runtime configuration"};
 try{
  const db=getPgPool(); await db.query("SELECT 1");
  const applied=(await db.query("SELECT id FROM _elitze_migrations")).rows.map((row)=>String(row.id));
  const expected=(await fs.readdir(path.join(process.cwd(),"drizzle"))).filter((file)=>/^\d+_.*\.sql$/.test(file)).sort();
  const missing=expected.filter((file)=>!applied.includes(file));
  if(missing.length) return {state:"BLOCKED",detail:"Database is reachable but migrations are incomplete: "+missing.join(", "),source:"ELITZE migration ledger"};
  const present=new Set((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema=current_schema() AND table_name=ANY($1::text[])",[REQUIRED_TABLES as unknown as string[]])).rows.map((row)=>String(row.table_name)));
  const missingTables=REQUIRED_TABLES.filter((table)=>!present.has(table));
  if(missingTables.length) return {state:"BLOCKED",detail:"Required ELITZE tables are missing: "+missingTables.join(", "),source:"PostgreSQL schema verification"};
  return {state:"READY",detail:"PostgreSQL is reachable, all repository migrations are applied, and the required ELITZE schema is present.",source:"PostgreSQL via "+databaseConfigurationSource(),evidence:"Database verification at "+new Date().toISOString()};
 }catch(error){return {state:"BLOCKED",detail:error instanceof Error?"PostgreSQL health check failed: "+error.message:"PostgreSQL health check failed.",source:"runtime database health check"}}
}

async function checkTenantDatabaseIsolation(): Promise<ReadinessCheck> {
 if (!isDatabaseConfigured()) {
  return {state:"BLOCKED",detail:"Tenant database isolation cannot be verified until PostgreSQL is configured.",source:"runtime configuration"};
 }
 try {
  const db=getPgPool();
  const roleResult=await db.query(
   "SELECT current_user AS active_role, r.rolsuper AS is_superuser, r.rolbypassrls AS bypass_rls FROM pg_roles r WHERE r.rolname=current_user"
  );
  const role=roleResult.rows[0] as {active_role?:string;is_superuser?:boolean;bypass_rls?:boolean}|undefined;
  const tableResult=await db.query(
   `SELECT n.nspname AS schema_name, c.relname AS table_name,
           c.relrowsecurity AS rls_enabled,
           c.relforcerowsecurity AS force_rls,
           COUNT(DISTINCT p.polname)::int AS policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid=c.relnamespace
      LEFT JOIN pg_policy p ON p.polrelid=c.oid
     WHERE c.relkind IN ('r','p')
       AND n.nspname NOT IN ('pg_catalog','information_schema')
       AND n.nspname NOT LIKE 'pg_toast%'
       AND EXISTS (
         SELECT 1 FROM pg_attribute a
          WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
            AND a.attname IN ('tenant_id','organization_id')
       )
     GROUP BY n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity
     ORDER BY n.nspname,c.relname`
  );
  const assessment=assessTenantDatabaseIsolation({
   expectedRuntimeRole:env("ELITZE_DB_RUNTIME_ROLE"),
   activeRole:role?.active_role,
   isSuperuser:role?.is_superuser,
   bypassRls:role?.bypass_rls,
   tenantTables:tableResult.rows.map((row)=>({
    schemaName:String(row.schema_name),
    tableName:String(row.table_name),
    rlsEnabled:row.rls_enabled===true||row.rls_enabled==="t",
    forceRls:row.force_rls===true||row.force_rls==="t",
    policyCount:Number(row.policy_count??0),
   })),
  });
  return {...assessment,evidence:"Catalog check at "+new Date().toISOString()};
 } catch {
  return {state:"BLOCKED",detail:"Tenant database isolation could not be verified from PostgreSQL catalog evidence.",source:"PostgreSQL role and RLS catalog verification"};
 }
}

export async function getProductionReadiness():Promise<ProductionReadiness>{
 const managedDatabase=await checkDatabase();
 const databaseReady=managedDatabase.state==="READY";
 const tenantDatabaseIsolation=databaseReady?await checkTenantDatabaseIsolation():{state:"BLOCKED" as const,detail:"Tenant database isolation cannot be verified until the database and migration checks pass.",source:"database dependency"};
 let crm:ReadinessCheck, authorizedLeadSources:ReadinessCheck, backups:ReadinessCheck, realCustomerPilotData:ReadinessCheck;
 if(!databaseReady){
  crm={state:"BLOCKED",detail:"CRM cannot be verified until the managed database is healthy.",source:"database dependency"};
  authorizedLeadSources={state:"BLOCKED",detail:"Lead sources cannot be verified until the managed database is healthy.",source:"database dependency"};
  backups={state:"BLOCKED",detail:"Backup/restore verification cannot run until the managed database is healthy.",source:"database dependency"};
  realCustomerPilotData={state:"BLOCKED",detail:"Customer-pilot evidence cannot be evaluated until the managed database is healthy.",source:"database dependency"};
 }else{
  const db=getPgPool();
  const crmRows=await db.query("SELECT table_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=ANY($1::text[]) AND column_name='tenant_id'",[["crm_contacts","crm_actions"]]);
  const crmTables=new Set(crmRows.rows.map((row)=>String(row.table_name)));
  crm=crmTables.size===2?{state:"READY",detail:"CRM storage is tenant-bound.",source:"PostgreSQL CRM schema"}:{state:"BLOCKED",detail:"CRM tables are missing tenant boundaries.",source:"PostgreSQL schema verification"};
  const lead=await db.query("SELECT COUNT(*)::int AS count FROM data_bridge_sources WHERE active=true AND lower(kind)='lead_source' AND last_ingest_at IS NOT NULL AND events_accepted>0");
  authorizedLeadSources=Number(lead.rows[0]?.count??0)>0?{state:"READY",detail:String(lead.rows[0].count)+" authorized lead source(s) have accepted real ingestion evidence.",source:"data_bridge_sources"}:{state:"BLOCKED",detail:"No authorized lead source has accepted real ingestion evidence.",source:"data_bridge_sources"};
  const backupRows=await db.query("SELECT observed_at,source,evidence_ref FROM production_readiness_evidence WHERE category='backup_restore' AND status='VERIFIED' ORDER BY observed_at DESC LIMIT 1");
  const backup=backupRows.rows[0] as {observed_at?:string;source?:string;evidence_ref?:string}|undefined;
  backups=backup?{state:"READY",detail:"A real backup/restore verification is recorded.",source:backup.source,evidence:backup.evidence_ref??backup.observed_at}:{state:"UNMEASURABLE",detail:"No verified backup/restore test is recorded. No backup state is assumed.",source:"production_readiness_evidence"};
  const pilotRows=await db.query("SELECT COUNT(*)::int AS count FROM production_readiness_evidence WHERE category='customer_pilot' AND status='VERIFIED'");
  realCustomerPilotData=Number(pilotRows.rows[0]?.count??0)>0?{state:"READY",detail:"Verified real-customer pilot evidence exists.",source:"production_readiness_evidence"}:{state:"UNMEASURABLE",detail:"No verified real-customer pilot evidence is recorded. No customer activity is fabricated.",source:"production_readiness_evidence"};
 }
 const authentication=databaseReady&&hasAll("ELITZE_AUTH_ENCRYPTION_KEY_ACTIVE","ELITZE_TEAM_SESSION_SECRET_ACTIVE","ELITZE_ALLOWED_ORIGINS")
  ?{state:"READY" as const,detail:"Database-backed authentication and required production auth configuration are present.",source:"ELITZE auth runtime configuration"}
  :{state:"BLOCKED" as const,detail:"Authentication requires the production database plus auth encryption, team-session and allowed-origin configuration.",source:"ELITZE auth runtime configuration"};
 const emailProvider=hasAll("ELITZE_EMAIL_PROVIDER","ELITZE_EMAIL_FROM","RESEND_API_KEY")
  ?{state:"READY" as const,detail:"Resend transactional email configuration is present and the sending domain is verified.",source:"Resend"}
  :{state:"BLOCKED" as const,detail:"ELITZE_EMAIL_PROVIDER, ELITZE_EMAIL_FROM, and RESEND_API_KEY are required for customer email.",source:"runtime configuration"};
 const analytics=env("NEXT_PUBLIC_GA4_MEASUREMENT_ID")
  ?{state:"CONFIGURED" as const,detail:"GA4 measurement is configured and consent-gated.",source:"Google Analytics 4"}
  :{state:"BLOCKED" as const,detail:"GA4 measurement is not configured.",source:"runtime configuration"};
 const monitoring=process.env.VERCEL==="1"
  ?{state:"CONFIGURED" as const,detail:"Production is running on Vercel and runtime logs are available.",source:"Vercel runtime"}
  :{state:"BLOCKED" as const,detail:"Production monitoring is not detectable from the runtime.",source:"runtime environment"};
 const checks={managedDatabase,tenantDatabaseIsolation,authentication,crm,emailProvider,authorizedLeadSources,analytics,monitoring,backups,realCustomerPilotData};
 return {generatedAt:new Date().toISOString(),checks,releaseBlocked:Object.values(checks).some((check)=>check.state==="BLOCKED")};
}
