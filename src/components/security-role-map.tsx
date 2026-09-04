"use client";

import { Cloud, FileCheck2, Fingerprint, ShieldCheck } from "lucide-react";

const roles = [
  {
    name: "Defensive Security",
    icon: ShieldCheck,
    domain: "Enterprise SecOps",
    location: "Enterprise SecOps",
    purpose: "Detection, containment, response, remediation and continuous validation across the security graph.",
  },
  {
    name: "GRC",
    icon: FileCheck2,
    domain: "Command Plane",
    location: "Command Plane → Governance",
    purpose: "Risk, compliance, policy ownership, control mapping, evidence and organizational accountability.",
  },
  {
    name: "Cloud Security Engineer",
    icon: Cloud,
    domain: "Enterprise SecOps",
    location: "Enterprise SecOps → Cloud / Infrastructure",
    purpose: "Cloud posture, workload exposure, infrastructure controls, cloud telemetry and remediation.",
  },
  {
    name: "AI Security Engineer",
    icon: ShieldCheck,
    domain: "AI Security",
    location: "AI Security → Models / Agents / MCP / Tools",
    purpose: "AI workload security, agent behavior, model/provider controls, MCP, tool permissions and runtime validation.",
  },
  {
    name: "Identity & Access Management",
    icon: Fingerprint,
    domain: "AI Security",
    location: "AI Security → Identity & Access",
    purpose: "Human, workload and agent identity, least privilege, privileged access, authentication, authorization and access lifecycle.",
  },
] as const;

export default function SecurityRoleMap() {
  return (
    <section className="mt-8 rounded-2xl border border-red-900/40 bg-[#0c060c]">
      <div className="border-b border-red-950/50 px-5 py-4">
        <h2 className="text-sm font-semibold text-white">ELITZE Security Roles & Ownership</h2>
        <p className="mt-1 text-xs text-slate-500">Operational roles mapped to the ELITZE security architecture.</p>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <article key={role.name} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-red-300" />
                <h3 className="text-sm font-medium text-white">{role.name}</h3>
              </div>
              <div className="mt-3 text-[10px] uppercase tracking-wider text-red-300/80">{role.domain}</div>
              <div className="mt-1 text-xs text-slate-400">{role.location}</div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{role.purpose}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
