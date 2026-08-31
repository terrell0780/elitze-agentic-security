"use client";

import {
  Bot,
  CheckCircle2,
  Eye,
  Globe,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  Search,
  User,
  Shield,
  Fingerprint,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Agent = { id: number; name: string; slug: string; tier: number; parentSlug: string | null; framework: string; reasoningType: string; mythosSkills: string[]; maxDepth: number; hasLangGraph: boolean; hasBiniClaws: boolean; };
type Contact = { id: number; name: string; role: string; organization: string; emailDomain: string | null; associatedAgents: string[]; tags: string[]; riskTier: string; }; 

export default function SmartChatHierarchy() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/crm", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setContacts(json.contacts);
        setAgents(json.agents);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Agent cards mapped visually
  const agentCards = [
    { name: "Judge / Judgment", icon: Shield, tier: 1, color: "red", skills: ["Judgment", "Policy arbitration", "Killswitch decision"] },
    { name: "Agent Reach", icon: Search, tier: 2, color: "rose", skills: ["Search", "Discovery", "Crawl", "Extract"] },
    { name: "Gods Eye", icon: Eye, tier: 2, color: "amber", skills: ["Recon", "Fingerprint", "CVE correlation", "Visual analysis"] },
    { name: "Lindy AI", icon: Bot, tier: 3, color: "violet", skills: ["Workflow", "Approval flow", "Computer use"] },
    { name: "Recursive Agent", icon: Zap, tier: 4, color: "cyan", skills: ["Self-modify", "Self-test", "Red-team self", "Plan refine"] },
    { name: "Singularity", icon: Sparkles, tier: 1, color: "red", skills: ["Singular reasoning", "Universal transfer", "Cross-domain synthesis"] },
    { name: "Universal AI", icon: Globe, tier: 1, color: "rose", skills: ["Unification", "Ontology", "Cross-language", "Multi-modal merge"] },
    { name: "Graphics Security", icon: Layers, tier: 4, color: "amber", skills: ["Visual graph", "Topology animation", "Blast-radius visualization"] },
    { name: "Maximum Agent", icon: ArrowRight, tier: 4, color: "cyan", skills: ["Throughput optimization", "Latency reduction", "Batch processing", "Parallel execution"] },
  ];

  return (
    <div className="rounded-2xl border border-red-900/40 bg-[#0c060c]">
      <div className="flex items-center gap-2 border-b border-red-950/50 px-5 py-4">
        <Layers className="h-4 w-4 text-red-300" />
        <h3 className="text-sm font-semibold text-white">Smart Chat Hierarchy — Agent Skills + CRM</h3>
        <span className="ml-auto text-[10px] text-slate-500">9 agents · 4 tiers · recursive + singular + universal + mythos + maxed</span>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-slate-400">
          The agent architecture follows a four-tier hierarchy rooted in <strong>Judge Elitze</strong> (tier 1, singular reasoning). Every agent uses <strong>LangGraph</strong> (agent framework) and <strong>Bini Claws</strong> (runtime sandbox / containment layer). 
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          <strong>Bini Claws</strong> = the containment engine that wraps each agent: per-task sandbox with kernel-enforced isolation (seccomp + namespace + network allowlist). Every agent runs inside a Bini Claws capsule; killswitch propagates globally in &lt;300ms. <strong>Mythos skills</strong> = domain-specific superpowers (visual topology, self-modification, universal synthesis) mapped to the agent tier.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {agentCards.map((a) => (
            <div
              key={a.name}
              className="group rounded-xl border border-red-900/40 bg-black/30 p-4 transition hover:border-red-500/40 hover:bg-red-500/[0.05]"
            >
              <div className="flex items-center gap-2">
                <a.icon className={`h-5 w-5 text-rose-400`} />
                <span className="text-sm font-semibold text-white">{a.name}</span>
                <span className={`ml-auto rounded-full border px-1.5 py-0.5 text-[9px] uppercase ${a.tier === 1 ? "text-red-300 border-red-500/30 bg-red-500/10" : a.tier === 2 ? "text-rose-300 border-rose-500/30 bg-rose-500/10" : a.tier === 3 ? "text-violet-300 border-violet-500/30 bg-violet-500/10" : "text-cyan-300 border-cyan-500/30 bg-cyan-500/10"}`}>
                  T{a.tier}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="rounded border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 text-[9px] text-red-200">LangGraph</span>
                <span className="rounded border border-amber-400/20 bg-amber-400/10 px-1.5 py-0.5 text-[9px] text-amber-200">Bini Claws</span>
                {a.skills.map((s) => (
                  <span key={s} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-slate-300">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CRM preview */}
        <div className="mt-6 rounded-xl border border-red-900/40 bg-[#06030a] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <User className="h-4 w-4 text-red-300" />
            Security CRM — Contacts + Actions
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Contacts ({contacts.length})</div>
              <ul className="max-h-36 overflow-auto space-y-1.5 scrollbar-thin">
                {contacts.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${c.riskTier === "critical" ? "bg-rose-400" : c.riskTier === "high" ? "bg-amber-400" : "bg-emerald-400"}`} />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-slate-500">· {c.organization}</span>
                    <span className="ml-auto text-[10px] text-red-400">{c.role}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Actions ({contacts.length > 0 ? 4 : 0})</div>
              <ul className="max-h-36 overflow-auto space-y-1.5 scrollbar-thin">
                {[
                  { a: "Audit request — Frontier Desk agent", s: "pending", r: "high" },
                  { a: "KILLSWITCH drill — Gov demo tenant", s: "pending", r: "critical" },
                  { a: "HITL approval — Financial action", s: "approved", r: "high" },
                  { a: "Discovery claim — Agent Reach", s: "approved", r: "medium" },
                ].map((row, i) => (
                  <li key={i} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300">
                    <CheckCircle2 className={`h-3 w-3 ${row.s === "approved" ? "text-emerald-400" : "text-amber-400"}`} />
                    <span>{row.a}</span>
                    <span className={`ml-auto text-[10px] ${row.s === "approved" ? "text-emerald-400" : row.r === "critical" ? "text-rose-300" : "text-amber-300"}`}>{row.s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">All contacts manage agent access, approvals, and killswitch drills through Elitze. CRM integrates with agent graph for identity-to-action mapping.</div>
        </div>
      </div>
    </div>
  );
}
