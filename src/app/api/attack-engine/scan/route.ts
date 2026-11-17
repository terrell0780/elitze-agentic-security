import { NextResponse } from "next/server";
import { runAttack } from "@/lib/attack-engine/abliteration";
// TODO: replace with your actual Drizzle tenant/service-layer imports
// import { db } from "@/db"; import { scans, findings } from "@/db/schema";

export async function POST(req: Request) {
  // 1. Authenticate tenant (reuse your existing session check)
  // 2. Check tier limits (Free: 1 scan/mo, Team: weekly auto)
  // 3. Resolve authorized target from discovered-agent inventory (ROE scope only)
  const { agentName, mcpUrl } = await req.json();

  const result = await runAttack(mcpUrl, `Enumerate and attack AI agent "${agentName}".`);

  // 4. Persist tenant-scoped per Data Bridge:
  //    validation -> normalization -> idempotent persistence -> audit evidence
  return NextResponse.json({
    ok: true,
    phase: result.phase,
    findingsCount: result.findings.length,
    findings: result.findings,
    evidenceSha256: result.evidenceSha256,
  });
}
