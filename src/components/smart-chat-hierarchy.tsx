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

type Identity = {
  id: string;
  name: string;
  kind: string;
  active: boolean;
  created_at: string;
};

type Reachability = {
  id: string;
  agent_id: string;
  resource_type: string;
  resource_id: string;
  resource_name: string | null;
  access_mode: string;
  evidence_state: string;
  source: string;
  observed_at: string;
};

type Action = {
  id: string;
  agent_id: string;
  action: string;
  decision: string;
  approval_required: boolean;
  result_status: string | null;
  evidence_state: string;
  requested_at: string;
  completed_at: string | null;
  retest_status: string | null;
};

type ControlPlaneSnapshot = {
  identities?: Identity[];
  reachability?: Reachability[];
  actions?: Action[];
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
  if (tier === 2 || tier === 3) return "text-violet-300 border-violet-500/30 bg-violet-500/10";
  return "text-cyan-300 border-cyan-500/30 bg-cyan-500/10";
}

function actionLabel(action: Action) {
  if (action.result_status === "EXECUTED") return "Execution recorded";
  if (action.result_status === "DENIED" || action.decision === "DENY") return "Action denied";
  if (action.approval_required) return "Approval boundary recorded";
  if (action.retest_status) return `Retest: ${action.retest_status}`;
  return action.evidence_state || "Evidence state unavailable";
}

export default function SmartChatHierarchy() {
  const [snapshot, setSnapshot] = useState<ControlPlaneSnapshot | null>(null);
  const [state, setState] = useState<"loading" | "live" | "unavailable">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/control-plane", { cache: "no-store" });
      const payload = (await response.json()) as ControlPlaneSnapshot & { ok?: boolean };
      if (!response.ok || payload.ok === false) throw new Error("control_plane_unavailable");
      setSnapshot(payload);
      setState("live");
    } catch {
      setSnapshot(null);
      setState("unavailable");
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const identities = snapshot?.identities ?? [];
  const reachability = snapshot?.reachability ?? [];
  const actions = snapshot?.actions ?? [];

  return (
    <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-5 py-4">
        <Layers className="h-4 w-4 text-[var(--accent)]" />
        <h2 className="text-sm font-semibold">ELITZE Agent Operations — Governed Runtime</h2>
        <span className="ml-auto text-[10px] text-slate-500">
          {state === "live" ? `${identities.length} identities · ${reachability.length} reach observations · ${actions.length} action records` : state === "loading" ? "loading" : "data unavailable"}
        </span>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-slate-400">
          Governed role definitions are static architecture. Runtime identity, reachability and action state come only from the authenticated tenant control plane.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hierarchy.map((role) => {
            const Icon = role.icon;
            return (
              <article key={role.name} className="rounded-xl border border-[var(--border)] bg-black/30 p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-violet-300" />
                  <span className="text-sm font-semibold text-white">{role.name}</span>
                  <span className={`ml-auto rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tierClass(role.tier)}`}>Tier {role.tier}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {role.skills.map((skill) => <span key={skill} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-slate-300">{skill}</span>)}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                  <Activity className="h-3 w-3" />
                  Architecture role definition
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white"><User className="h-4 w-4 text-[var(--accent)]" />Observed agent identities</div>
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-auto">
              {identities.slice(0, 20).map((identity) => (
                <li key={identity.id} className="rounded bg-black/40 px-2.5 py-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${identity.active ? "bg-emerald-400/80" : "bg-slate-600"}`} />
                    <span className="font-medium text-white">{identity.name}</span>
                    <span className="ml-auto text-[10px] text-slate-600">{identity.kind}</span>
                  </div>
                </li>
              ))}
              {state === "live" && identities.length === 0 && <li className="py-6 text-center text-xs text-slate-600">No agent identities recorded for this tenant.</li>}
              {state === "unavailable" && <li className="py-6 text-center text-xs text-amber-300">Control-plane data unavailable.</li>}
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white"><Database className="h-4 w-4 text-[var(--accent)]" />Governed runtime actions</div>
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-auto">
              {actions.slice(0, 20).map((action) => (
                <li key={action.id} className="rounded bg-black/40 px-2.5 py-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${action.result_status === "DENIED" || action.decision === "DENY" ? "bg-amber-400" : action.result_status === "EXECUTED" ? "bg-emerald-400" : "bg-slate-500"}`} />
                    <span className="truncate font-medium text-white">{action.action}</span>
                    <span className="ml-auto text-[10px] text-slate-600">{action.decision}</span>
                  </div>
                  <div className="mt-1 pl-3.5 text-[10px] text-slate-500">{actionLabel(action)}</div>
                </li>
              ))}
              {state === "live" && actions.length === 0 && <li className="py-6 text-center text-xs text-slate-600">No runtime action records for this tenant.</li>}
              {state === "unavailable" && <li className="py-6 text-center text-xs text-amber-300">Control-plane data unavailable.</li>}
            </ul>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          <CheckCircle2 className="h-3 w-3" />
          No synthetic identities, contacts, actions or runtime events are rendered as live telemetry.
        </div>
      </div>
    </section>
  );
}
