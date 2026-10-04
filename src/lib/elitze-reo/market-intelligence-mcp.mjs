import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const server=new McpServer({name:"elitze-reo-market-intelligence",version:"1.0.0"});
const domain=z.string().min(1).max(253).regex(/^[a-zA-Z0-9.-]+$/);
const month=z.string().regex(/^\\d{4}-\\d{2}$/);

server.registerTool("semrush_domain_overview",{
  title:"ELITZE REO Semrush Domain Overview",
  description:"Retrieve tenant-authorized Semrush domain-rank intelligence. Results remain third-party estimates and are never treated as ELITZE telemetry or security evidence.",
  inputSchema:z.object({domain,database:z.string().min(2).default("us")}),
},async({domain,database})=>{
  const key=process.env.SEMRUSH_API_KEY;
  if(!key)return {isError:true,content:[{type:"text",text:"UNAVAILABLE: SEMRUSH_API_KEY is not configured."}]};
  const url=new URL("https://api.semrush.com/");
  url.searchParams.set("key",key);url.searchParams.set("type","domain_rank");url.searchParams.set("domain",domain);url.searchParams.set("database",database);url.searchParams.set("export_columns","Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac,Sh,Sv");
  const r=await fetch(url);const body=await r.text();
  if(!r.ok)return {isError:true,content:[{type:"text",text:"Semrush HTTP "+r.status+": "+body}]};
  return {content:[{type:"text",text:body}]};
});

server.registerTool("similarweb_keywords",{
  title:"ELITZE REO Similarweb Website Keywords",
  description:"Retrieve Similarweb keyword intelligence for an authorized domain. Results are third-party estimates and are not security telemetry.",
  inputSchema:z.object({domain,country:z.string().length(2).default("us"),month:month.optional(),limit:z.number().int().min(1).max(1000).default(100)}),
},async({domain,country,month:queryMonth,limit})=>{
  const key=process.env.SIMILARWEB_API_KEY;
  if(!key)return {isError:true,content:[{type:"text",text:"UNAVAILABLE: SIMILARWEB_API_KEY is not configured."}]};
  const url=new URL("https://api.similarweb.com/v4/website-analysis/keywords");
  url.searchParams.set("api_key",key);url.searchParams.set("URL",domain);url.searchParams.set("country",country);url.searchParams.set("traffic_source","All");url.searchParams.set("web_source","Total");url.searchParams.set("branded_type","All");url.searchParams.set("limit",String(limit));
  if(queryMonth){url.searchParams.set("start_date",queryMonth);url.searchParams.set("end_date",queryMonth);}
  const r=await fetch(url);const body=await r.text();
  if(!r.ok)return {isError:true,content:[{type:"text",text:"Similarweb HTTP "+r.status+": "+body}]};
  return {content:[{type:"text",text:body}]};
});

await server.connect(new StdioServerTransport());
console.error("ELITZE REO Market Intelligence MCP server running on stdio");
