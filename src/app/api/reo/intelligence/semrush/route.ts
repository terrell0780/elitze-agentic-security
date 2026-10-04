import { NextRequest } from "next/server";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(request: NextRequest) {
  const key=process.env.SEMRUSH_API_KEY;
  if (!key) return Response.json({ok:false,status:"UNAVAILABLE",reason:"SEMRUSH_API_KEY is not configured."},{status:503});
  const domain=request.nextUrl.searchParams.get("domain");
  const database=request.nextUrl.searchParams.get("database") ?? "us";
  if (!domain) return Response.json({ok:false,error:"domain_required"},{status:400});

  const url=new URL("https://api.semrush.com/");
  url.searchParams.set("key",key);
  url.searchParams.set("type","domain_rank");
  url.searchParams.set("domain",domain);
  url.searchParams.set("database",database);
  url.searchParams.set("export_columns","Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv");

  const response=await fetch(url,{cache:"no-store"});
  const body=await response.text();
  if (!response.ok) return Response.json({ok:false,status:"UPSTREAM_ERROR",provider:"semrush",httpStatus:response.status,body},{status:502});
  return new Response(body,{status:200,headers:{"content-type":response.headers.get("content-type") ?? "text/plain"}});
}
