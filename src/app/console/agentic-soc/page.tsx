"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, AlertTriangle, Bot, CircleCheck, CircleDot, RefreshCw, ShieldCheck, Workflow, XCircle } from "lucide-react";

type Status = {
  ok: boolean;
  orchestration?: string;
  recursiveReviewLimit?: number;
  modelProvider?: {name:string;configured:boolean;status:string;model:string|null;baseUrl:string|null;secretStoredEncrypted:boolean;note:string};
  evidence?: {state:string;observedEventCount:number;nonObservedEventCount:number;latestObservedAt:string|null;windowDays:number};
  latestRun?: {id:string;status:string;evidenceState:string;startedAt:string;completedAt:string|null;summary:Record<string,unknown>|string}|null;
  error?: string;
};
type RunResult = {
  ok:boolean;
  runId?:string;
  evidenceState?:string;
  eventCount?:number;
  observedEventCount?:number;
  nonObservedEventCount?:number;
  findingCount?:number;
  findings?:Array<{title:string;severity:string;confidence:string;evidenceState:string;subjectKey:string|null;techniqueIds:string[];supportingEventIds:string[];gaps:string[];proposedActions:Array<{action:string;target:string;approvalState:string}>}>;
  modelStatus?:string;
  modelName?:string|null;
  recursiveReviewPasses?:number;
  modelReview?:{supportedFindingIds:string[];evidenceGaps:string[];analystNotes:string[];summary:string}|null;
  status?:string;
  modelIds?:string[];
  errorCode?:string;
  error?:string;
};

function pretty(value: unknown) {
  if (typeof value === "string") {
    try { return JSON.stringify(JSON.parse(value),null,2); } catch { return value; }
  }
  return JSON.stringify(value,null,2) ?? "UNMEASURABLE";
}

export default function AgenticSocConsole() {
  const router = useRouter();
  const [status,setStatus] = useState<Status|null>(null);
  const [latest,setLatest] = useState<RunResult|null>(null);
  const [busy,setBusy] = useState<"load"|"run"|"probe"|null>(null);
  const [error,setError] = useState<string|null>(null);

  const load = useCallback(async () => {
    setBusy("load"); setError(null);
    try {
      const response = await fetch("/api/console/agentic-soc",{cache:"no-store"});
      if (response.status===401) { router.replace("/login?next=%2Fconsole%2Fagentic-soc"); return; }
      const data = await response.json() as Status;
      if (!response.ok || !data.ok) throw new Error(data.error ?? "agentic_soc_unavailable");
      setStatus(data);
    } catch (cause) {
      setError(cause instanceof Error?cause.message:"agentic_soc_unavailable");
    } finally { setBusy(null); }
  },[router]);

  useEffect(()=>{void load();},[load]);

  async function submit(action:"run"|"probe-nim") {
    setBusy(action==="run"?"run":"probe"); setError(null);
    try {
      const response = await fetch("/api/console/agentic-soc",{
        method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,trigger:"MANUAL"}),
      });
      const data = await response.json() as RunResult;
      if (!response.ok || !data.ok) throw new Error(data.errorCode ?? data.error ?? (action==="run"?"agentic_soc_run_failed":"nim_probe_failed"));
      setLatest(data);
      await load();
    } catch(cause) {
      setError(cause instanceof Error?cause.message:"agentic_soc_action_failed");
    } finally { setBusy(null); }
  }

  const observed = status?.evidence?.state==="OBSERVED";
  const modelStatus = latest?.modelStatus ?? status?.modelProvider?.status ?? "UNMEASURABLE";
  const findings = latest?.findings ?? [];

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 sm:px-7">
          <Link href="/console" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5"/></span><span><b className="block text-sm tracking-[.12em]">ELITZE</b><span className="block text-[8px] uppercase tracking-[.22em] text-[var(--muted)]">Agentic SOC</span></span></Link>
          <nav className="flex flex-wrap gap-2 text-xs"><Link href="/console/analyst" className="rounded-lg border border-[var(--border)] px-3 py-2">Analyst</Link><Link href="/console/threat-detection" className="rounded-lg border border-[var(--border)] px-3 py-2">Threat detection</Link><Link href="/console/integrations" className="rounded-lg border border-[var(--border)] px-3 py-2">Integrations</Link><button onClick={()=>void load()} disabled={busy!==null} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2"><RefreshCw className={"h-3.5 w-3.5 "+(busy?"animate-spin":"")}/>Refresh</button></nav>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[#06111d] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(34,211,238,.13),transparent_45%)]"/>
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-cyan-200"><Workflow className="h-3.5 w-3.5"/>LangGraph · bounded state machine</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">The agent reasons.<br/><span className="text-cyan-300">Policy remains the boundary.</span></h1><p className="mt-4 text-sm leading-7 text-slate-300">Loads actual tenant events, applies deterministic source-bound detection, optionally calls the configured NVIDIA NIM model, performs bounded recursive consistency review and persists the run. Model output cannot launch tools or change execution authorization.</p></div>
            <div className="flex flex-col gap-2"><button onClick={()=>void submit("run")} disabled={busy!==null} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy==="run"?"Running LangGraph…":"Run security analyst"}</button><button onClick={()=>void submit("probe-nim")} disabled={busy!==null} className="rounded-xl border border-white/15 bg-white/[.04] px-4 py-3 text-sm font-semibold text-slate-100 disabled:opacity-50">{busy==="probe"?"Probing NIM…":"Probe NVIDIA NIM"}</button></div>
          </div>
        </section>
        {error&&<div role="alert" className="mt-4 flex items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-sm text-amber-100"><AlertTriangle className="h-4 w-4"/>{error}</div>}
        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Workflow",status?.orchestration??"UNMEASURABLE",Workflow],
            ["Model",status?.modelProvider?.model??"NOT_CONFIGURED",Bot],
            ["Model state",modelStatus,modelStatus==="CONNECTED"?CircleCheck:modelStatus==="ERROR"?XCircle:CircleDot],
            ["Observed events",status?String(status.evidence?.observedEventCount??0):"UNMEASURABLE",Activity],
          ].map(([name,value,Icon])=>{const Glyph=Icon as typeof Workflow;return <article key={String(name)} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4"><div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted)]"><span>{String(name)}</span><Glyph className="h-4 w-4 text-[var(--accent)]"/></div><div className="mt-3 break-words text-lg font-black tracking-tight">{String(value)}</div></article>})}
        </section>
        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <h2 className="text-base font-semibold">Evidence boundary</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{status?.modelProvider?.note??"Model status is not yet measurable."}</p>
            <dl className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"><dt className="text-[var(--muted)]">Evidence state</dt><dd className="font-semibold">{status?.evidence?.state??"UNMEASURABLE"}</dd></div>
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"><dt className="text-[var(--muted)]">Observed events</dt><dd>{status?.evidence?.observedEventCount??"UNMEASURABLE"}</dd></div>
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"><dt className="text-[var(--muted)]">Non-observed rows excluded</dt><dd>{status?.evidence?.nonObservedEventCount??"UNMEASURABLE"}</dd></div>
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"><dt className="text-[var(--muted)]">Latest observed event</dt><dd>{status?.evidence?.latestObservedAt?new Date(status.evidence.latestObservedAt).toLocaleString():"Not recorded"}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt className="text-[var(--muted)]">Recursive model passes</dt><dd>{latest?.recursiveReviewPasses??status?.recursiveReviewLimit??"UNMEASURABLE"}</dd></div>
            </dl>
            {!observed&&<p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[.04] p-3 text-xs leading-5 text-amber-100">UNMEASURABLE — missing telemetry is not treated as a clean posture.</p>}
            <Link href="/api/console/obsidian-export" className="mt-4 inline-flex rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold">Export observed evidence to Obsidian Markdown</Link>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <h2 className="text-base font-semibold">Latest persisted run</h2>
            {latest?<pre className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-[10px] leading-5">{pretty(latest)}</pre>:status?.latestRun?<pre className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-[10px] leading-5">{pretty(status.latestRun.summary)}</pre>:<div className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">No persisted run available yet. Run the analyst to evaluate current observed data.</div>}
          </article>
        </section>
        {findings.length>0&&<section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><h2 className="text-lg font-semibold">Current run findings</h2><div className="mt-4 grid gap-3 lg:grid-cols-2">{findings.map((finding,index)=><article key={finding.title+index} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-bold">{finding.title}</h3><span className="text-[9px] font-bold uppercase text-[var(--accent)]">{finding.severity} · {finding.evidenceState}</span></div><p className="mt-2 text-xs text-[var(--muted)]">Subject: {finding.subjectKey??"UNKNOWN"} · confidence: {finding.confidence}</p><p className="mt-3 text-xs leading-5 text-[var(--muted-strong)]">{finding.gaps.join(" ")||"No additional evidence gap recorded."}</p><div className="mt-3 flex flex-wrap gap-1.5">{finding.techniqueIds.map(id=><a key={id} className="rounded border border-[var(--border)] px-2 py-1 text-[9px] text-cyan-200" href={"https://attack.mitre.org/techniques/"+id.replace(".","/")+"/"} target="_blank" rel="noreferrer">{id}</a>)}</div><div className="mt-3 space-y-2">{finding.proposedActions.map((action)=><div key={action.action} className="rounded-lg border border-[var(--border)] p-3 text-xs"><b>{action.approvalState}</b><div className="mt-1 text-[var(--muted)]">{action.action}</div></div>)}</div></article>)}</div></section>}
        <section className="mt-4 grid gap-4 md:grid-cols-3">{[{title:"Threat Detection",href:"/console/threat-detection"},{title:"Integration setup",href:"/console/integrations"},{title:"Adversary Emulation",href:"/console/adversary-emulation"}].map(item=><Link key={item.href} href={item.href} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm font-semibold hover:border-[var(--accent-border)]">{item.title}<span className="ml-2 text-[var(--accent)]">↗</span></Link>)}</section>
      </div>
    </main>
  );
}
