import { NextResponse } from "next/server";
import { securitySkills } from "@/lib/security-skills";

export function GET() {
  return NextResponse.json({
    ok: true,
    source: "elitze-skill-registry",
    skills: securitySkills,
    policy: "Skill metadata is ELITZE-owned; third-party libraries are not copied into the proprietary repository.",
  });
}
