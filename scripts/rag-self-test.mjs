import fs from "node:fs";
const files=["drizzle/0026_rag_vector_search.sql","drizzle/0027_rag_tenant_rls.sql","src/lib/elitze-secure/rag.ts","src/app/api/rag/documents/route.ts","src/app/api/rag/search/route.ts"];
for(const f of files)if(!fs.existsSync(f))throw new Error("missing_rag_file:"+f);
const m=fs.readFileSync(files[0],"utf8");
for(const x of ["CREATE EXTENSION IF NOT EXISTS vector","rag_documents","rag_chunks","vector(1536)","vector_cosine_ops"])if(!m.includes(x))throw new Error("missing_rag_migration_marker:"+x);
const r=fs.readFileSync(files[2],"utf8");
for(const x of ["ELITZE_EMBEDDING_URL","ELITZE_AI_GATEWAY_URL","tenantId","vector","searchRag","indexDocument","isRagConfigured"])if(!r.includes(x))throw new Error("missing_rag_implementation_marker:"+x);
if(!fs.readFileSync("src/db/schema.ts","utf8").includes('vector("embedding", { dimensions: 1536 })'))throw new Error("missing_drizzle_vector_schema");
const rls=fs.readFileSync("drizzle/0027_rag_tenant_rls.sql","utf8");
for(const marker of ["ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY","ALTER TABLE public.rag_documents FORCE ROW LEVEL SECURITY","CREATE POLICY rag_documents_tenant_isolation","ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY","ALTER TABLE public.rag_chunks FORCE ROW LEVEL SECURITY","CREATE POLICY rag_chunks_tenant_isolation","current_setting('app.tenant_id', true)"])if(!rls.includes(marker))throw new Error("missing_rag_rls_marker:"+marker);
for(const marker of ["getPgPool().connect()","set_config('app.tenant_id', $1, true)","client.query(\"BEGIN\")","client.query(\"COMMIT\")","client.release()"])if(!r.includes(marker))throw new Error("missing_tenant_transaction_marker:"+marker);

const chat=fs.readFileSync("src/app/api/chat/route.ts","utf8");
for(const x of ["searchRag","formatRetrievedContext","retrievalState","TENANT-SCOPED RAG EVIDENCE"])if(!chat.includes(x))throw new Error("missing_chat_rag_integration:"+x);
console.log("ELITZE RAG + vector search self-test: PASS");