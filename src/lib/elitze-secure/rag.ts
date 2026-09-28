import { createHash } from "node:crypto";
import { getPgPool } from "@/db";

const EMBEDDING_DIMENSIONS = 1536;
const MAX_DOCUMENT_CHARS = 1_000_000;
const CHUNK_SIZE = 1_200;
const CHUNK_OVERLAP = 200;

export type RagSource = { id:string; documentId:string; title:string; content:string; sourceType:string; sourceUri:string|null; similarity:number; metadata:Record<string,unknown> };

function embeddingConfig() {
  const url = process.env.ELITZE_EMBEDDING_URL?.trim() || process.env.ELITZE_AI_GATEWAY_URL?.trim();
  if (!url) throw new Error("ELITZE_EMBEDDING_URL or ELITZE_AI_GATEWAY_URL is not configured");
  const token = process.env.ELITZE_EMBEDDING_TOKEN?.trim() || process.env.ELITZE_AI_GATEWAY_TOKEN?.trim() || process.env.AI_GATEWAY_API_KEY?.trim();
  if (!token) throw new Error("ELITZE_EMBEDDING_TOKEN, ELITZE_AI_GATEWAY_TOKEN, or AI_GATEWAY_API_KEY is not configured");
  return { url:url.replace(/\/$/,""), token, model:process.env.ELITZE_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small" };
}
function vectorLiteral(values:number[]) {
  if (values.length !== EMBEDDING_DIMENSIONS || values.some(v=>!Number.isFinite(v))) throw new Error("invalid_embedding_dimensions");
  return "["+values.join(",")+"]";
}
async function embed(inputs:string[]) {
  if (!inputs.length) return [] as number[][];
  const c=embeddingConfig();
  const r=await fetch(c.url+"/embeddings",{method:"POST",headers:{"content-type":"application/json",...(c.token?{authorization:"Bearer "+c.token}: {})},body:JSON.stringify({model:c.model,input:inputs}),signal:AbortSignal.timeout(30000)});
  const p=await r.json().catch(()=>null) as {data?:Array<{embedding?:unknown;index?:number}>}|null;
  if(!r.ok||!Array.isArray(p?.data)) throw new Error("embedding_provider_error");
  const ordered=[...p.data].sort((a,b)=>Number(a.index??0)-Number(b.index??0)).map(x=>x.embedding);
  if(ordered.length!==inputs.length||ordered.some(x=>!Array.isArray(x)||x.length!==EMBEDDING_DIMENSIONS||x.some(v=>typeof v!=="number"||!Number.isFinite(v)))) throw new Error("invalid_embedding_response");
  return ordered as number[][];
}
export function chunkText(input:string){
  const text=input.trim(); if(!text||text.length>MAX_DOCUMENT_CHARS) throw new Error("invalid_document_size");
  const chunks:string[]=[]; let start=0;
  while(start<text.length){ const end=Math.min(text.length,start+CHUNK_SIZE); const chunk=text.slice(start,end).trim(); if(chunk) chunks.push(chunk); if(end===text.length) break; start=Math.max(start+1,end-CHUNK_OVERLAP); }
  return chunks;
}
export async function indexDocument(input:{tenantId:string;contentId:string;title:string;sourceType:string;sourceUri?:string|null;content:string;metadata?:Record<string,unknown>}){
  const chunks=chunkText(input.content); const embeddings=await embed(chunks); const db=getPgPool();
  const contentHash=createHash("sha256").update(input.content).digest("hex"); const metadata=JSON.stringify(input.metadata??{});
  await db.query("BEGIN");
  try {
  const d=await db.query(`INSERT INTO rag_documents (tenant_id,content_id,title,source_type,source_uri,content_hash,metadata,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now()) ON CONFLICT (tenant_id,content_id) DO UPDATE SET title=EXCLUDED.title,source_type=EXCLUDED.source_type,source_uri=EXCLUDED.source_uri,content_hash=EXCLUDED.content_hash,metadata=EXCLUDED.metadata,updated_at=now() RETURNING id`,[input.tenantId,input.contentId,input.title.trim(),input.sourceType.trim(),input.sourceUri??null,contentHash,metadata]);
  const documentId=String(d.rows[0]?.id??""); if(!documentId) throw new Error("document_persistence_failed");
  await db.query("DELETE FROM rag_chunks WHERE document_id=$1",[documentId]);
  for(let i=0;i<chunks.length;i++) await db.query(`INSERT INTO rag_chunks (document_id,tenant_id,chunk_index,content,content_hash,embedding,metadata) VALUES ($1,$2,$3,$4,$5,$6::vector,$7::jsonb)`,[documentId,input.tenantId,i,chunks[i],createHash("sha256").update(chunks[i]).digest("hex"),vectorLiteral(embeddings[i]),metadata]);
  await db.query("COMMIT");
  return {documentId,contentId:input.contentId,chunksIndexed:chunks.length,contentHash};
  } catch (error) {
    await db.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}
export function isRagConfigured(){ return Boolean((process.env.ELITZE_EMBEDDING_URL?.trim() || process.env.ELITZE_AI_GATEWAY_URL?.trim()) && (process.env.ELITZE_EMBEDDING_TOKEN?.trim() || process.env.ELITZE_AI_GATEWAY_TOKEN?.trim() || process.env.AI_GATEWAY_API_KEY?.trim())); }
export async function searchRag(tenantId:string,query:string,limit=8):Promise<RagSource[]>{
  const clean=query.trim(); if(!clean||clean.length>20000) throw new Error("invalid_query");
  const [embedding]=await embed([clean]); const safe=Math.min(Math.max(Math.trunc(limit),1),20);
  const r=await getPgPool().query(`SELECT c.id,c.document_id AS "documentId",d.title,c.content,d.source_type AS "sourceType",d.source_uri AS "sourceUri",1-(c.embedding <=> $1::vector) AS similarity,c.metadata FROM rag_chunks c JOIN rag_documents d ON d.id=c.document_id WHERE c.tenant_id=$2 AND d.tenant_id=$2 ORDER BY c.embedding <=> $1::vector ASC LIMIT $3`,[vectorLiteral(embedding),tenantId,safe]);
  return r.rows as RagSource[];
}
export function formatRetrievedContext(sources:RagSource[]){ return sources.map((s,i)=>"[Source "+(i+1)+"] "+s.title+"\n"+s.content+"\nSource type: "+s.sourceType+(s.sourceUri?"\nSource URI: "+s.sourceUri:"")).join("\n\n"); }
