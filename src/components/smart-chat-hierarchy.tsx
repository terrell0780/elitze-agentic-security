"use client";

import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  Eye,
  Globe,
  Layers,
  Search,
  Shield,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Agent = {
  id: number;
  name: string;
  slug: string;
  framework: string;
  status: string;
  purpose: string;
  riskScore: number;
};

type Contact = {
  id: number;
  name: string;
  role: string;
  organization: string;
  associatedAgents: string[];
  tags: string[];
  riskTier: string;
};

type Action = {
  id: number;
  contactId: number;
  agentSlug: string | null;
  actionType: string;
  status: string;
  createdAt: string;
  result: string | null;
};

const hierarchy = [
  { name: "Judgment", icon: Shield, tier: 1, skills: ["Policy arbitration", "Risk decision", "Containment decision"] },
  { name: "Discovery", icon: Search, tier: 2, skills: ["Search", "Asset discovery", "Crawl", "Extraction"] },
  { name: "Recon", icon: Eye, tier: 2, skills: ["Fingerprint", "CVE correlation", "Visual analysis", "Attack surface"] },
  { name: "Workflow", icon: Bot, tier: 3, skills: ["Approval flow", "Task routing", "Controlled execution"] },
  { name: "Validation", icon: Zap, tier: 4, skills: ["Self-test", "Red-team validation", "Plan refinement"] },
  { name: "Synthesis", icon: Sparkles, tier: 1, skills: ["Cross-domain reasoning", "Evidence synthesis"] },
  { name: "Unification", icon: Globe, tier: 1, skills: ["Ontology", "Cross-language", "Multi-modal merge"] },
  { name: "Security Graph", icon: Layers, tier: 4, skills: ["Topology", "Blast radius", "Attack-path visualization"] },
  { name: "Execution", icon: ArrowRight, tier: 4, skills: ["Parallel work", "Throughput", "Latency control"] },
];

function tierClass(tier: number) {
  if (tier === 1) return "text-[var(--accent)] border-[var(--accent-border)] bg-[var(--accent-soft)]";
  if (tier === 2) return "text-violet-300 border-violet-500/30 bg-violet-500/10";
  if (tier === 3) return "text-violet-300 border-violet-500/30 bg-violet-500/10";
  return "text-cyan-300 border-cyan-500/30 bg-cyan-500/10";
}

function actionLabel(action: Action) {
  if (action.status === "approved" || action.status === "completed") return "Governed action completed";
  if (action.status === "pending") return "Awaiting approval";
  if (action.status === "blocked" || action.status === "denied") return "Action blocked";
  return action.status || "Unknown status";
}

export default function SmartChatHierarchy() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [state, setState] = useState<"loading" | "live" | "unavailable">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/crm", { cache: "no-store" });
      const payload = (await response.json()) as {
        ok?: boolean;
        contacts?: Contact[];
        actions?: Action[];
        agents?: Agent[];
      };
      if (!response.ok || !payload.ok) throw new Error("crm_unavailable");

      setContacts(payload.contacts ?? []);
      setActions(payload.actions ?? []);
      setAgents(payload.agents ?? []);
      setState("live");
    } catch {
      setState("unavailable");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stateLabel = state === "live" ? "data connected" : state === "loading" ? "loading" : "data unavailable";

  return (
    <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-red-950/50 px-5 py-4">
        <Layers className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-sm font-semibold text-white">ELITZE Agent Operations — Hierarchy + CRM</h2>
        <span className="ml-auto text-[10px] text-slate-500">{agents.length} live agents · {hierarchy.length} governed roles · {stateLabel}</span>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-slate-400">
          Agent capabilities are presented as governed roles. Runtime state comes only from the connected CRM API; empty and unavailable states are not replaced with synthetic activity.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hierarchy.map((role) => {
            const Icon = role.icon;
            const live = agents.some((agent) => agent.name === role.name);

            return (
              <article key={role.name} className="rounded-xl border border-[var(--border)] bg-black/30 p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-violet-300" />
                  <span className="text-sm font-semibold text-white">{role.name}</span>
                  <span className={`ml-auto rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tierClass(role.tier)}`}>
                    Tier {role.tier}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {role.skills.map((skill) => (
                    <span key={skill} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-slate-300">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                  {live ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Activity className="h-3 w-3" />}
                  {live ? "Live record present" : "No live runtime record"}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <User className="h-4 w-4 text-[var(--accent)]" />
            Security CRM — Contacts + Governed Actions
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Contacts ({contacts.length})</div>
              <ul className="max-h-44 space-y-1.5 overflow-auto">
                {contacts.slice(0, 10).map((contact) => (
                  <li key={contact.id} className="rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                      <span className="font-medium text-white">{contact.name}</span>
                      <span className="ml-auto text-[10px] text-slate-600">{contact.riskTier}</span>
                    </div>
                    <div className="mt-1 pl-3.5 text-[10px] text-slate-500">{contact.role} · {contact.organization}</div>
                  </li>
                ))}
                {state === "live" && contacts.length === 0 && <li className="py-6 text-center text-xs text-slate-600">No CRM contacts recorded.</li>}
                {state === "unavailable" && <li className="py-6 text-center text-xs text-amber-300">CRM unavailable or requires authenticated access.</li>}
              </ul>
            </div>

            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Actions ({actions.length})</div>
              <ul className="max-h-44 space-y-1.5 overflow-auto">
                {actions.slice(0, 10).map((action) => (
                  <li key={action.id} className="rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${action.status === "blocked" || action.status === "denied" ? "bg-amber-400" : action.status === "pending" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <span className="font-medium text-white">{action.actionType}</span>
                      <span className="ml-auto text-[10px] text-slate-600">{action.status}</span>
                    </div>
                    <div className="mt-1 pl-3.5 text-[10px] text-slate-500">{actionLabel(action)}</div>
                  </li>
                ))}
                {state === "live" && actions.length === 0 && <li className="py-6 text-center text-xs text-slate-600">No governed actions recorded.</li>}
                {state === "unavailable" && <li className="py-6 text-center text-xs text-amber-300">No action feed available.</li>}
              </ul>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
            <Database className="h-3 w-3" />
            CRM state is API-backed. No synthetic contacts or actions are rendered as live data.
          </div>
        </div>
      </div>
    </section>
  );
}
