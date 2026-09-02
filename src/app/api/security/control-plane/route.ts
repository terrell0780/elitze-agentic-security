import { NextRequest } from "next/server";
import { ELITZE_ENTERPRISE_CONTROLS, controlsForDomain, type SecurityDomain } from "@/lib/elitze-secure/enterprise-control-plane";

const domains: SecurityDomain[] = ["AI","ENDPOINT","IDENTITY","CLOUD","SAAS","NETWORK","DATA","EMAIL","APPLICATION","EXPOSURE","THREAT_INTEL","SECOPS","GRC"];

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") as SecurityDomain | null;
  if (domain && !domains.includes(domain)) return Response.json({ error: "unsupported security domain" }, { status: 400 });
  return Response.json({
    product: "ELITZE Agentic Security",
    domains,
    controls: domain ? controlsForDomain(domain) : ELITZE_ENTERPRISE_CONTROLS,
  });
}
