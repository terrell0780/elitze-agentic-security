import { NextRequest } from "next/server";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(request: NextRequest) {
  const key=process.env.SIMILARWEB_API_KEY;
  if (!key) return Response.json({ok:false,status:"UNAVAILABLE",reason:"SIMILARWEB_API_KEY is not configured."},{status:503});
  const domain=request.nextUrl.searchParams.get("domain");
  if (!domain) return Response.json({ok:false,error:"domain_required"},{status:400});
  const country=request.nextUrl.searchParams.get("country") ?? "us";
  const startDate=request.nextUrl.searchParams.get("startDate");
  const endDate=request.nextUrl.searchParams.get("endDate");
  if ((startDate && !endDate) || (!startDate && endDate) || (startDate && endDate && startDate!==endDate)) {
    return Response.json({ok:false,error:"similarweb_keyword_query_requires_equal_startDate_and_endDate"},{status:400});
  }

  const url=new URL("https://api.similarweb.com/v4/website-analysis/keywords");
  url.searchParams.set("api_key",key);
  url.searchParams.set("URL",domain);
  url.searchParams.set("country",country);
  url.searchParams.set("traffic_source","All");
  url.searchParams.set("web_source","Total");
  url.searchParams.set("branded_type","All");
  url.searchParams.set("limit",request.nextUrl.searchParams.get("limit") ?? "100");
  if (startDate) {
    url.searchParams.set("start_date",startDate);
    url.searchParams.set("end_date",endDate!);
  }

  const response=await fetch(url,{cache:"no-store"});
  const body=await response.text();
  if (!response.ok) return Response.json({ok:false,status:"UPSTREAM_ERROR",provider:"similarweb",httpStatus:response.status,body},{status:502});
  return new Response(body,{status:200,headers:{"content-type":response.headers.get("content-type") ?? "application/json"}});
}
