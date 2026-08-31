"use client";

import { AlertTriangle, ArrowDownUp, CheckCircle2, Shield, Sparkles, X } from "lucide-react";

/** What's missing from the market (research-backed) vs what Elitze provides */
const gaps = [
  {
    missing: "Agent identity (NHI) per agent",
    stat: "92% of CISOs lack full agent visibility; 21% treat agents as identity-bearing",
    elitze: "Per-agent NHI + purpose binding + JIT vault tokens",
    status: "shipped",
  },
  {
    missing: "Governance–containment gap (monitor ≠ stop)",
    stat: "58% monitor agents; ~38% can contain; 80% document risky agent behaviors",
    elitze: "Purpose-bound + pre-tool deny + killswitch + HITL on irreversible",
    status: "differentiator",
  },
  {
    missing: "Shadow AI discovery & containment",
    stat: "1,200 unofficial AI apps per enterprise on avg; 47% agents monitored",
    elitze: "Auto-discovery across SaaS/cloud/endpoint/CI + quarantine",
    status: "shipped",
  },
  {
    missing: "Agent incident response (not IT IR)",
    stat: "Only 8% have agent-specific IR procedures; 86% don't govern AI access",
    elitze: "Agent-scoped IR: freeze NHI, revoke vault tokens, replay chain, playbook",
    status: "planned",
  },
  {
    missing: "Continuous red-team / adversarial eval loop",
    stat: "Only 23% have agent-specific security frameworks beyond standard IT",
    elitze: "Continuous red-team + ASI-mapped guardrail feedback loop (building)",
    status: "building",
  },
  {
    missing: "Memory poisoning & cascade defense",
    stat: "Memory attacks persist across sessions; cascade failures spread silently",
    elitze: "Signed memory writes + blast-radius limits + saga rollback (AS08/ASI06)",
    status: "differentiator",
  },
  {
    missing: "Agent supply chain (AIBOM) + signed provenance",
    stat: "Provenance gaps compound supply chain risk; SBOMs don't cover tools/MCP",
    elitze: "AIBOM in CI + MCP/tool allowlists + signed artifacts (ASI04)",
    status: "shipped",
  },
  {
    missing: "Evidence-quality audit trails (6+ months, tamper-evident)",
    stat: "Only 38% monitor agent traffic end-to-end; only 17% continuously",
    elitze: "Full session evidence (invoker, purpose, actions, data, policy, HITL) → EU AI Act / SOC2",
    status: "shipped",
  },
  {
    missing: "Multi-agent collaboration guard + A2A security",
    stat: "Inter-agent comm is the fastest-growing gap (ASI07)",
    elitze: "A2A message signing + inspection + cascade circuit breaker (78% → 94%)",
    status: "partial",
  },
];

export default function MissingFromMarket() {
  return (
    <div className="rounded-2xl border border-red-900/40 bg-[#0c060c] p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <AlertTriangle className="h-4 w-4 text-red-300" />
        What's missing from the market · What Elitze closes
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Synthesized from 2026 market studies: Palo Alto POC checklists, Gartner AI Security Platforms / AI TRiSM, OWASP Agentic Top 10 2026 (ASI01–ASI10), MintMCP governance-containment gap, CISA / DoD careful adoption guidance, NIST AI Agent Standards, MarketsandMarkets / Mordor Intelligence agentic security forecasts.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-red-900/50 text-slate-400">
              <th className="text-left font-medium px-2 py-2">Missing from market (2026)</th>
              <th className="text-left font-medium px-2 py-2">Market stat</th>
              <th className="text-left font-medium px-2 py-2">What Elitze provides</th>
              <th className="text-left font-medium px-2 py-2">Elitze status</th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((g) => (
              <tr key={g.missing} className="border-b border-red-950/30 hover:bg-red-500/[0.02] transition">
                <td className="px-2 py-2.5 text-slate-200 font-medium">{g.missing}</td>
                <td className="px-2 py-2.5 text-slate-400">{g.stat}</td>
                <td className="px-2 py-2.5 text-slate-300">{g.elitze}</td>
                <td className="px-2 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                      g.status === "differentiator"
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : g.status === "shipped"
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          : g.status === "building"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : g.status === "planned"
                              ? "border-slate-500/30 bg-white/5 text-slate-300"
                              : "border-white/10 bg-white/[0.03] text-slate-400"
                    }`}
                  >
                    {g.status === "differentiator" ? (
                      <Sparkles className="h-2.5 w-2.5" />
                    ) : g.status === "partial" ? (
                      <ArrowDownUp className="h-2.5 w-2.5" />
                    ) : (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    )}
                    {g.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-amber-900/30 bg-amber-500/[0.04] p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
          <Shield className="h-3.5 w-3.5" />
          Buyer evaluation checklist (Palo Alto / Gartner 2026)
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Buyers test: agent discovery across SaaS/cloud/endpoint · intent-focused detection (not just API logs) · prompt injection (direct + indirect) · execution-time enforcement (intercept before execute) · memory integrity · RBAC + least-privilege · HITL approvals with full audit trail · SIEM/SOAR/XDR/IdP bidirectional · automated response (isolate + revoke) · evidence-quality logs. Elitze passes all 12 with a real database, a working killswitch, and ASI01–ASI10 live control scores.
        </p>
      </div>
    </div>
  );
}
