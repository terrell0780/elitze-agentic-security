"use client";

import { Activity, ArrowRight, Bot, CheckCircle2, Database, Eye, Globe, Layers, Search, Shield, Sparkles, User, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Agent = { id:number; name:string; slug:string; framework:string; status:string; purpose:string; riskScore:number };
type Contact = { id:number; name:string; role:string; organization:string; associatedAgents:string[]; tags:string[]; riskTier:string };
type Action = { id:number; contactId:number; agentSlug:string|null; actionType:string; status:string; createdAt:string; result:string|null };

const hierarchy = [
  ["Judge / Judgment", Shield, 1, ["Judgment","Policy arbitration","Killswitch decision"]],
  ["Agent Reach", Search, 2, ["Search","Discovery","Crawl","Extract"]],
  ["Gods Eye", Eye, 2, ["Recon","Fingerprint","CVE correlation","Visual analysis"]],
  ["Lindy AI", Bot, 3, ["Workflow","Approval flow","Computer use"]],
  ["Recursive Agent", Zap, 4, ["Self-test","Red-team self","Plan refine"]],
  ["Singularity", Sparkles, 1, ["Singular reasoning","Cross-domain synthesis"]],
  ["Universal AI", Globe, 1, ["Unification","Ontology","Cross-language","Multi-modal merge"]],
  ["Graphics Security", Layers, 4, ["Visual graph","Topology","Blast-radius visualization"]],
  ["Maximum Agent", ArrowRight, 4, ["Throughput optimization","Latency reduction","Parallel execution"]],
] as const;

export default function SmartChatHierarchy() {
  const [contacts,setContacts]=useState<Contact[]>([]);
  const [actions,setActions]=useState<Action[]>([]);
  const [agents,setAgents]=useState<Agent[]>([]);
  const [state,setState]=useState<"loading"|"live"|"unavailable">("loading");

  const load=useCallback(async()=>{
    setState("loading");
    try {
      const res=await fetch("/api/crm",{cache:"no-store"});
      const json=(await res.json()) as {ok?:boolean;contacts?:Contact[];actions?:Action[];agents?:Agent[]};
      if(!res.ok || !json.ok) throw new Error("crm_unavailable");
      setContacts(json.contacts ?? []); setActions(json.actions ?? []); setAgents(json.agents ?? []); setState("live");
    } catch {
      setContacts([]); setActions([]); setAgents([]); setState("unavailable");
    }
  },[]);

  useEffect(()=>{void load()},[load]);

  return <section className="mt-8 rounded-2xl border border-cyan-900/40 bg-[#071016]">
    <header className="flex items-center gap-2 border-b border-cyan-950/50 px-5 py-4">
      <Layers className="h-4 w-4 text-cyan-300"/>
      <h2 className="text-sm font-semibold text-white">ELITZE Agent Operations — Hierarchy + CRM</h2>
      <span className="ml-auto text-[10px] text-slate-500">{agents.length} live agents · 9 canonical roles · {state==="live"?"data connected":state==="loading"?"loading":"data unavailable"}</span>
    </header>
    <div className="p-5">
      <p className="text-sm leading-relaxed text-slate-400">Canonical ELITZE agent roles are governed through identity, policy, approval, and evidence boundaries. Runtime records are shown only when returned by the connected API.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hierarchy.map(([name,Icon,tier,skills])=>{
          const live=agents.some(a=>a.name===name);
          return <article key={name} className="rounded-xl border border-cyan-900/40 bg-black/30 p-4">
            <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-cyan-300"/><span className="text-sm font-semibold text-white">{name}</span><span className="ml-auto rounded-full border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-300">T{tier}</span></div>
            <div className="mt-2 flex flex-wrap gap-1">{skills.map(skill=><span key={skill} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-slate-300">{skill}</span>)}</div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500"><Activity className="h-3 w-3"/>{live?"Live record present":"No live record"}</div>
          </article>;
        })}
      </div>
      <div className="mt-6 rounded-xl border border-cyan-900/40 bg-[#050b0f] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white"><User className="h-4 w-4 text-cyan-300"/>Security CRM — Contacts + Governed Actions</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div><div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Contacts ({contacts.length})</div><ul className="max-h-44 space-y-1.5 overflow-auto">
            {contacts.slice(0,10).map(c=><li key={c.id} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300"/><span className="font-medium">{c.name}</span><span className="text-slate-500">· {c.organization}</span><span className="ml-auto text-[10px] text-slate-400">{c.role}</span></li>)}
            {state==="live"&&contacts.length===0&&<li className="py-6 text-center text-xs text-slate-600">No CRM contacts recorded.</li>}
            {state==="unavailable"&&<li className="py-6 text-center text-xs text-amber-300">CRM unavailable or requires authenticated access.</li>}
          </ul></div>
          <div><div className="mb-2 text-[10px] uppercase tracking-widest text-slate-500">Actions ({actions.length})</div><ul className="max-h-44 space-y-1.5 overflow-auto">
            {actions.slice(0,10).map(a=><li key={a.id} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1.5 text-xs text-slate-300"><CheckCircle2 className={`h-3 w-3 ${a.status==="approved"?"text-emerald-300":"text-amber-300"}`}/><span>{a.actionType}</span><span className="ml-auto text-[10px] text-slate-400">{a.status}</span></li>)}
            {state==="live"&&actions.length===0&&<li className="py-6 text-center text-xs text-slate-600">No governed actions recorded.</li>}
            {state==="unavailable"&&<li className="py-6 text-center text-xs text-slate-600">No action data available.</li>}
          </ul></div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500"><Database className="h-3 w-3"/>CRM state is API-backed. No synthetic contacts or actions are rendered as live data.</div>
      </div>
    </div>
  </section>;
}
