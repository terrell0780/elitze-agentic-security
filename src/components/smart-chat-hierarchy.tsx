"use client";

import { Bot, CheckCircle2, Eye, Globe, Layers, Sparkles, Zap, Shield, ArrowRight, Search, User, Activity, ShieldAlert, Database } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Agent = { id: number; name: string; slug: string; framework: string; status: string; purpose: string; riskScore: number };
type Contact = { id: number; name: string; role: string; organization: string; associatedAgents: string[]; tags: string[]; riskTier: string };
type Action = { id: number; contactId: number; agentSlug: string | null; actionType: string; status: string; createdAt: string; result: string | null };

const hierarchy = [
  { name: "Judge / Judgment", icon: Shield, tier: 1, skills: ["Judgment", "Policy arbitration", "Killswitch decision"] },
  { name: "Agent Reach", icon: Search, tier: 2, skills: ["Search", "Discovery", "Crawl", "Extract"] },
  { name: "Gods Eye", icon: Eye, tier: 2, skills: ["Recon", "Fingerprint", "CVE correlation", "Visual analysis"] },
  { name: "Lindy AI", icon: Bot, tier: 3, skills: ["Workflow", "Approval flow", "Computer use"] },
  { name: "Recursive Agent", icon: Zap, tier: 4, skills: ["Self-test", "Red-team self", "Plan refine"] },
  { name: "Singularity", icon: Sparkles, tier: 1, skills: ["Singular reasoning", "Cross-domain synthesis"] },
  { name: "Universal AI", icon: Globe, tier: 1, skills: ["Unification", "Ontology", "Cross-language", "Multi-modal merge"] },
  { name: "Graphics Security", icon: Layers, tier: 4, skills: ["Visual graph", "Topology", "Blast-radius visualization"] },
  { name: "Maximum Agent", icon: ArrowRight, tier: 4, skills: ["Throughput optimization", "Latency reduction", "Parallel execution"] },
];

function tierClass(tier: number) {
  return tier === 1 ? "text-red-300 border-red-500/30 bg-red-500/10" :
    tier === 2 ? "text-rose-300 border-rose-500/30 bg-rose-500/10" :
    tier === 3 ? "text-violet-300 border-violet-500/30 bg-violet-500/10" :
    "text-cyan-300 border-cyan-500/30 bg-cyan-500/10";
}

export default function SmartChatHierarchy() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [state, setState] = useState<"loading" | "live" | "unavailable">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch("/api/crm", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error("crm_unavailable");
      setContacts(json.contacts ?? []);
      setActions(json.actions ?? []);
      setAgents(json.agents ?? []);
      setState("live");
    } catch {
      setState("unavailable");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="mt-8 rounded-2xl border border-red-900/40 bg-[#0c060c]">
      <div className="flex items-center gap-2 border-b border-red-950/50 px-5 py-4">
        <Layers className="h-4 w-4 text-red-300" />
        <h2 className="text-sm font-semibold text-white">ELITZE Agent Operations — Hierarchy + CRM</h2>
        <span className="ml-auto text-[10px] text-slate-500">{agents.length} live agents · 9 canonical roles · {state === "live" ? "data connected" : state === "loading" ? "loading" : "data unavailable"}</span>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-slate-400">Canonical ELITZE agent roles are governed through identity, policy, approval and evidence boundaries. Live runtime records are shown separately from the declared hierarchy.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hierarchy.map((a) => {
            const Icon = a.icon;
            return <article key={a.name} className="rounded-xl border border-red-900/40 bg-black/30 p-4">
              <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-rose-400" /><span className="text-sm font-semibold text-white">{a.name}</span><span className={"ml-auto rounded-full border px-1.5 py-0.5 text-[9px] uppercase " + tierClass(a.tier)}>T{a.tier}</span></div>
              <div className="mt-2 flex flex-wrap gap-1">{a.skills.map((s) => <span key={s} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-slate-300">{s}</span>)}</div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500"><Activity className="h-3 w-3" />{agents.some((x) => x.name === a.name) ? "Live record present" : "No live runtime record"}</div>
            </article>;
          })}
        </div>
        <div className="mt-6 rounded-xl border border-red-900/40 bg-[#06030a] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white"><User className="h-4 w-4 text-red-300" />Security CRM — Contacts + Governed Actions</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div><div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Contacts ({contacts.length})</div><ul className="max-h-44 space-y-1.5 overflow-auto">
              {contacts.slice(0, 10).map((c) => <li key={c.id} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300"><span className={"h-1.5 w-1.5 rounded-full " + (c.riskTier === "critical" ? "bg-rose-400" : c.riskTier === "high" ? "bg-amber-400" : "bg-emerald-400")} /><span className="font-medium">{c.name}</span><span className="truncate text-slate-500">· {c.organization}</span></li>)}
              {state === "live" && contacts.length === 0 && <li className="py-6 text-center text-xs text-slate-600">No CRM contacts recorded.</li>}
              {state === "unavailable" && <li className="py-6 text-center text-xs text-amber-300">CRM unavailable or requires authenticated access.</li>}
            </ul></div>
            <div><div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Actions ({actions.length})</div><ul className="max-h-44 space-y-1.5 overflow-auto">
              {actions.slice(0, 10).map((row) => <li key={row.id} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300">{row.status === "approved" || row.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <ShieldAlert className="h-3 w-3 text-amber-400" />}<span className="truncate">{row.actionType}</span><span className="ml-auto text-[10px] text-slate-500">{row.status}</span></li>)}
              {state === "live" && actions.length === 0 && <li className="py-6 text-center text-xs text-slate-600">No governed actions recorded.</li>}
            </ul></div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500"><Database className="h-3 w-3" />CRM state is API-backed. No synthetic contacts or actions are rendered as live data.</div>
        </div>
      </div>
    </section>
  );
}
