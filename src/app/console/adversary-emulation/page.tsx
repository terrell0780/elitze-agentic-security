"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, FlaskConical, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";

type Technique = {id:string;name:string;description:string;tactics:string[];platforms:string[];url:string;modified:string|null;subTechnique:boolean};
type TechniqueResult = {ok:boolean;matchedCount?:number;techniques?:Technique[];error?:string;evidenceState?:string};
type PentestPayload = {ok:boolean;runnerConfigured?:boolean;requests?:Array<Record<string,unknown>>;redTeamRuns?:Array<Record<string,unknown>>;findings?:Array<Record<string,unknown>>;events?:Array<Record<string,unknown>>;error?:string};
type SubmitResult = {ok:boolean;kind?:string;runId?:string|number;runnerJobId?:string|null;status?:string;message?:string;error?:string};

function toLocalDateInput(date:Date){
  const local = new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}

export default function AdversaryEmulationConsole() {
  const router = useRouter();
  const [query,setQuery]=useState("");
  const [catalog,setCatalog]=useState<TechniqueResult|null>(null);
  const [selected,setSelected]=useState<Technique|null>(null);
  const [target,setTarget]=useState("https://www.elitze.info");
  const [scope,setScope]=useState("public-surface");
  const [profile,setProfile]=useState("release-assurance");
  const [authorizationRef,setAuthorizationRef]=useState("");
  const [expiry,setExpiry]=useState("");
  const [authorized,setAuthorized]=useState(false);
  const [state,setState]=useState<PentestPayload|null>(null);
  const [result,setResult]=useState<SubmitResult|null>(null);
  const [busy,setBusy]=useState<"load"|"search"|"submit"|null>(null);
  const [error,setError]=useState<string|null>(null);

  const loadState=useCallback(async()=>{
    setBusy("load");setError(null);
    try{
      const response=await fetch("/api/security/pentest",{cache:"no-store"});
      if(response.status===401){router.replace("/login?next=%2Fconsole%2Fadversary-emulation");return;}
      const data=await response.json() as PentestPayload;
      if(!response.ok||!data.ok)throw new Error(data.error??"validation_status_unavailable");
      setState(data);
    }catch(e){setError(e instanceof Error?e.message:"validation_status_unavailable");}
    finally{setBusy(null);}
  },[router]);

  useEffect(()=>{void loadState();},[loadState]);

  const search=useCallback(async()=>{
    setBusy("search");setError(null);
    try{
      const params=new URLSearchParams({limit:"30",q:query.trim()});
      const response=await fetch("/api/threat-intel/attack?"+params.toString(),{cache:"no-store"});
      if(response.status===401){router.replace("/login?next=%2Fconsole%2Fadversary-emulation");return;}
      const data=await response.json() as TechniqueResult;
      if(!response.ok||!data.ok)throw new Error(data.error??"mitre_attack_source_unavailable");
      setCatalog(data);
    }catch(e){setCatalog({ok:false,error:e instanceof Error?e.message:"mitre_attack_source_unavailable",evidenceState:"UNMEASURABLE"});setError(e instanceof Error?e.message:"mitre_attack_source_unavailable");}
    finally{setBusy(null);}
  },[query,router]);

  useEffect(()=>{void search();},[search]);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setError(null);setResult(null);
    if(!authorized){setError("Rules of Engagement confirmation is required.");return;}
    if(!selected){setError("Select a current ATT&CK technique reference before creating the validation request.");return;}
    if(Date.parse(expiry)<=Date.now()){setError("Rules of Engagement expiry must be in the future.");return;}
    setBusy("submit");
    try{
      const response=await fetch("/api/security/pentest",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          kind:"RED_TEAM",
          target,
          scope,
          profile,
          authorizationRef:authorizationRef.trim(),
          roeExpiresAt:new Date(expiry).toISOString(),
          techniqueId:selected.id,
          techniqueName:selected.name,
        }),
      });
      const data=await response.json() as SubmitResult;
      if(!response.ok||!data.ok)throw new Error(data.error??"adversary_emulation_request_failed");
      setResult(data);
      await loadState();
    }catch(e){setError(e instanceof Error?e.message:"adversary_emulation_request_failed");}
    finally{setBusy(null);}
  }

  const runs=state?.redTeamRuns??[];
  const currentRun=result?.runId? runs.find((run)=>String(run.id)===String(result.runId)):undefined;

  return(
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1550px] flex-wrap items-center justify-between gap-3 px-4 sm:px-7">
          <Link href="/console" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5"/></span><span><b className="block text-sm tracking-[.12em]">ELITZE</b><span className="block text-[8px] uppercase tracking-[.22em] text-[var(--muted)]">Adversary emulation</span></span></Link>
          <nav className="flex flex-wrap items-center gap-2 text-xs"><Link href="/console/threat-detection" className="rounded-lg border border-[var(--border)] px-3 py-2">Threat detection</Link><button onClick={()=>void loadState()} disabled={busy!==null} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2"><RefreshCw className={"h-3.5 w-3.5 "+(busy?"animate-spin":"")}/>Refresh</button></nav>
        </div>
      </header>
      <div className="mx-auto max-w-[1550px] px-4 py-7 sm:px-7">
        <section className="rounded-[28px] border border-cyan-300/15 bg-[#06111d] p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-3xl"><p className="text-[9px] font-bold uppercase tracking-[.24em] text-cyan-200">Purple team / ATT&CK-informed validation</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Emulate with authorization.<br/><span className="text-cyan-300">Prove what actually ran.</span></h1><p className="mt-4 text-sm leading-7 text-slate-300">Select current MITRE ATT&CK technique metadata, record explicit Rules of Engagement, and dispatch to ELITZE&apos;s supported security runner. Technique selection is metadata: only a compatible executor can truthfully confirm emulation of that specific behavior.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="text-[9px] uppercase tracking-[.18em] text-slate-400">Execution runner</div><div className="mt-2 text-lg font-bold">{state?.runnerConfigured?"CONNECTED":"RUNNER_NOT_CONFIGURED"}</div><p className="mt-2 max-w-64 text-[10px] leading-5 text-slate-400">A queued record is not a completed scan or a successful emulation.</p></div></div>
        </section>
        {error&&<div role="alert" className="mt-4 flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-sm text-amber-100"><AlertTriangle className="h-4 w-4 shrink-0"/>{error}</div>}
        {result&&<section role="status" className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-[var(--accent)]"/>Request recorded</div><div className="mt-3 grid gap-2 text-xs sm:grid-cols-3"><div>Status: <b>{result.status??"UNKNOWN"}</b></div><div>Run ID: <b>{String(result.runId??"UNKNOWN")}</b></div><div>Runner job: <b>{result.runnerJobId??"None dispatched"}</b></div></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">{result.message??"The system returned a request record. Review the current persisted run below."}</p><p className="mt-2 text-xs font-semibold">ATT&CK plan reference: {selected?.id} — {selected?.name}. Do not report this technique as executed unless the returned runner evidence explicitly proves it.</p></section>}
        <section className="mt-5 grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
          <article className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-[var(--accent)]"/><h2 className="text-lg font-semibold">Official ATT&CK library</h2></div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Retrieved from MITRE&apos;s Enterprise STIX dataset at request time. If the source is unavailable, the catalogue remains unavailable instead of substituting a local demo dataset.</p>
            <form className="mt-4 flex gap-2" onSubmit={(e)=>{e.preventDefault();void search();}}><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search e.g. command and scripting" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm"/><button disabled={busy!==null} className="rounded-xl bg-[var(--accent)] px-4 py-3 text-xs font-bold text-slate-950">Search</button></form>
            <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--muted)]"><span>{catalog?.ok?String(catalog.matchedCount??catalog.techniques?.length??0)+" matches":"UNMEASURABLE"}</span>{catalog?.ok&&<a href="https://attack.mitre.org/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[var(--accent)]">MITRE ATT&CK <ExternalLink className="h-3 w-3"/></a>}</div>
            <div className="mt-3 max-h-[520px] space-y-2 overflow-auto pr-1">
              {(catalog?.techniques??[]).map((technique)=><button key={technique.id} type="button" onClick={()=>setSelected(technique)} className={"w-full rounded-xl border p-3 text-left "+(selected?.id===technique.id?"border-cyan-300/50 bg-cyan-300/[.06]":"border-[var(--border)] bg-[var(--panel-strong)]")}><div className="flex items-start justify-between gap-3"><span className="text-sm font-semibold">{technique.name}</span><span className="font-mono text-[10px] text-[var(--accent)]">{technique.id}</span></div><p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">{technique.description||"No description in source dataset."}</p><div className="mt-2 flex flex-wrap gap-1">{technique.tactics.map((item)=><span key={item} className="rounded border border-[var(--border)] px-2 py-1 text-[9px] text-[var(--muted)]">{item}</span>)}</div></button>)}
              {catalog&&!catalog.ok&&<div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-xs text-[var(--muted)]">{catalog.error??"MITRE source unavailable"} — catalogue not generated locally.</div>}
            </div>
          </article>
          <div className="space-y-4">
            <form onSubmit={submit} className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-6">
              <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-300"/><h2 className="text-lg font-semibold">Authorized validation request</h2></div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Use only targets you are authorized to test. This form submits the configured supported runner profile; selecting a technique does not transform a scanner into an ATT&CK technique executor.</p>
              {selected?<div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/[.04] p-3 text-xs"><b>{selected.id} — {selected.name}</b><div className="mt-1 text-[10px] text-[var(--muted)]">{selected.tactics.join(", ")||"Tactic not listed"}</div></div>:<div className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-3 text-xs text-[var(--muted)]">Select an ATT&CK technique from the official library.</div>}
              <label className="mt-4 block text-xs font-semibold">Authorized HTTPS target<input value={target} onChange={(e)=>setTarget(e.target.value)} type="url" required pattern="https://.+" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm"/></label>
              <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Scope<select value={scope} onChange={(e)=>setScope(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm">{[["public-surface","Public surface"],["authenticated-application","Authenticated application"],["agent-toolchain","Agent toolchain"],["api","API"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-xs font-semibold">Runner profile<select value={profile} onChange={(e)=>setProfile(e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm">{[["release-assurance","Release assurance"],["api-security","API security"],["agent-security","Agent security"],["mcp-security","MCP security"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label></div>
              <label className="mt-4 block text-xs font-semibold">Authorization / change-ticket reference<input value={authorizationRef} onChange={(e)=>setAuthorizationRef(e.target.value)} required maxLength={240} placeholder="Your approved ticket or Rules of Engagement reference" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm"/></label>
              <label className="mt-4 block text-xs font-semibold">Rules of Engagement expiry<input value={expiry} onChange={(e)=>setExpiry(e.target.value)} required type="datetime-local" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm"/></label>
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--border)] p-3 text-xs leading-5"><input type="checkbox" checked={authorized} onChange={(e)=>setAuthorized(e.target.checked)} className="mt-1"/><span>I confirm I have authority to test this target, the selected scope/profile is approved, and the supplied expiry is the active Rules of Engagement boundary.</span></label>
              <button type="submit" disabled={busy!==null||!selected||!authorized||!authorizationRef.trim()} className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-40">{busy==="submit"?"Recording / dispatching…":"Submit authorized validation request"}</button>
            </form>
            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Recent red-team / emulation runs</h2><span className="text-xs text-[var(--muted)]">{runs.length} records</span></div>{runs.length===0?<p className="mt-3 rounded-xl border border-dashed border-[var(--border)] p-4 text-xs leading-5 text-[var(--muted)]">No runs are available for this tenant. No runs are fabricated for display.</p>:<div className="mt-4 space-y-2">{runs.map((run,i)=><div key={String(run.id??i)} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><b>{String(run.campaign??"Authorized validation")}</b><span className="font-mono text-[10px]">{String(run.status??"UNKNOWN")}</span></div><div className="mt-2 break-words text-[10px] text-[var(--muted)]">{String(run.target??"Target not recorded")} · evidence {String(run.evidenceState??"UNKNOWN")}</div><div className="mt-1 text-[10px] text-[var(--muted)]">Run {String(run.id??"UNKNOWN")} · {run.updatedAt?new Date(String(run.updatedAt)).toLocaleString():"timestamp unavailable"}</div></div>)}</div>}</article>
          </div>
        </section>
      </div>
    </main>
  );
}
