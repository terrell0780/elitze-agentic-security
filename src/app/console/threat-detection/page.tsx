"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownToLine, Bot, ExternalLink, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import InteractiveSecurityGlobe, { type GlobeObservation } from "@/components/interactive-security-globe";

type Detection = {
  detectionId: string;
  title: string;
  severity: string;
  confidence: string;
  evidenceState: string;
  ruleId: string;
  description: string;
  subject: string;
  firstObservedAt: string;
  lastObservedAt: string;
  sourceRefs: string[];
  eventIds: string[];
  techniqueIds: string[];
  nextStep: string;
};
type Payload = {
  ok: boolean;
  evidenceState?: string;
  observedEventCount?: number;
  nonObservedEventCount?: number;
  detectionCount?: number;
  detections?: Detection[];
  rules?: Array<{id:string;name:string;purpose:string;evidence:string}>;
  sources?: Array<{connector_id:string;health_state:string;integration_state:string;last_observed_at:string|null}>;
  geoObservations?: GlobeObservation[];
  error?: string;
  windowDays?: number;
};

function statusTone(value: string) {
  const severity = value.toUpperCase();
  return severity === "CRITICAL" || severity === "HIGH"
    ? "border-rose-400/25 bg-rose-400/[.06] text-rose-200"
    : severity === "MEDIUM"
      ? "border-amber-300/20 bg-amber-300/[.05] text-amber-100"
      : "border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)]";
}

export default function ThreatDetectionConsole() {
  const router = useRouter();
  const [payload,setPayload] = useState<Payload|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string|null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/console/threat-detection",{cache:"no-store"});
      if (response.status === 401) {
        router.replace("/login?next=%2Fconsole%2Fthreat-detection");
        return;
      }
      const data = await response.json() as Payload;
      if (!response.ok || !data.ok) throw new Error(data.error ?? "threat_detection_unavailable");
      setPayload(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "threat_detection_unavailable");
    } finally {
      setBusy(false);
    }
  },[router]);

  useEffect(() => { void load(); },[load]);

  const observed = payload?.evidenceState === "OBSERVED";
  const detections = payload?.detections ?? [];

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 sm:px-7">
          <Link href="/console" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5"/></span>
            <span><b className="block text-sm tracking-[.12em]">ELITZE</b><span className="block text-[8px] uppercase tracking-[.22em] text-[var(--muted)]">Threat detection</span></span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-xs">
            <Link href="/console/analyst" className="rounded-lg border border-[var(--border)] px-3 py-2">Autonomous analyst</Link>
            <Link href="/console/adversary-emulation" className="rounded-lg border border-[var(--border)] px-3 py-2">Adversary emulation</Link>
            <Link href="/console/agentic-soc" className="rounded-lg bg-[var(--accent)] px-3 py-2 font-bold text-slate-950">LangGraph SOC</Link>
            <button type="button" onClick={() => void load()} disabled={busy} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-50"><RefreshCw className={"h-3.5 w-3.5 "+(busy?"animate-spin":"")}/>Refresh</button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[#06111d] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_8%,rgba(34,211,238,.12),transparent_40%)]"/>
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[9px] font-bold uppercase tracking-[.24em] text-cyan-200">Security operations / source-bound rules</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Threat detection.<br/><span className="text-cyan-300">No invented telemetry.</span></h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Only authenticated tenant events marked OBSERVED enter rule evaluation. Each result retains evidence IDs, source references, timestamps and ATT&CK references where supplied or deterministically mapped.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <div className="text-[9px] uppercase tracking-[.18em] text-slate-400">Evidence state</div>
              <div className="mt-2 text-lg font-bold">{payload?.evidenceState ?? "UNMEASURABLE"}</div>
              <div className="mt-3 text-xs text-slate-400">Window: {payload?.windowDays ?? 7} days</div>
            </div>
          </div>
        </section>

        {error && <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-4 text-sm text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><span>{error}. Security state remains UNMEASURABLE.</span></div>}

        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Observed events",payload ? String(payload.observedEventCount ?? 0) : "UNMEASURABLE", "Source records eligible for matching."],
            ["Non-observed rows",payload ? String(payload.nonObservedEventCount ?? 0) : "UNMEASURABLE","Excluded from detection rules."],
            ["Rule detections",payload ? String(payload.detectionCount ?? 0) : "UNMEASURABLE","Source-backed signals; not an incident verdict."],
            ["Source health records",payload ? String(payload.sources?.length ?? 0) : "UNMEASURABLE","Connector states shown separately."],
          ].map(([title,value,caption])=>(
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">{title}</div>
              <div className="mt-3 text-2xl font-black tracking-tight">{value}</div>
              <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">{caption}</p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <InteractiveSecurityGlobe observations={payload?.geoObservations ?? []}/>
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Detection logic</div>
              <h2 className="mt-1 text-lg font-semibold">Active deterministic rules</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">A rule listing describes implemented logic, not evidence that the corresponding event occurred.</p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {(payload?.rules ?? []).map((rule)=>(
                <article key={rule.id} className="p-4">
                  <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold">{rule.name}</h3><span className="text-[9px] font-mono text-[var(--accent)]">{rule.id}</span></div>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{rule.purpose}</p>
                  <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">Evidence required: {rule.evidence}</p>
                </article>
              ))}
              {!payload && <div className="p-5 text-sm text-[var(--muted)]">Loading rule and source state…</div>}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div><div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Correlated observations</div><h2 className="mt-1 text-xl font-semibold">Detections and source evidence</h2></div>
            <Link href="/api/threat-intel/attack" className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs">MITRE ATT&CK catalogue <ExternalLink className="h-3.5 w-3.5"/></Link>
          </div>
          {!observed && !error && <div className="m-5 rounded-2xl border border-dashed border-amber-300/25 bg-amber-300/[.035] p-5"><div className="flex items-center gap-3 text-sm font-semibold"><ShieldAlert className="h-4 w-4 text-amber-200"/>UNMEASURABLE — no observed detection evidence</div><p className="mt-2 text-xs leading-5 text-[var(--muted)]">A lack of observed detections is not proof of a clean environment. Connect authorized sources and run their source-specific probes.</p></div>}
          {observed && detections.length === 0 && <div className="m-5 rounded-2xl border border-dashed border-[var(--border)] p-5 text-sm"><div className="font-semibold">No rule matches in this evidence window.</div><p className="mt-2 text-xs leading-5 text-[var(--muted)]">The window contains {payload?.observedEventCount ?? 0} observed event(s). This is not a compromise-free or clean-posture assertion.</p></div>}
          <div className="grid gap-3 p-4 lg:grid-cols-2">
            {detections.map((detection)=>(
              <article key={detection.detectionId} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] font-mono text-[var(--muted)]">{detection.ruleId}</span><span className={"rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase "+statusTone(detection.severity)}>{detection.severity}</span></div>
                <h3 className="mt-3 text-base font-semibold">{detection.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{detection.description}</p>
                <div className="mt-3 grid gap-2 text-[10px] text-[var(--muted)] sm:grid-cols-2">
                  <div>Subject: <span className="text-[var(--text)]">{detection.subject || "UNKNOWN"}</span></div>
                  <div>Confidence: <span className="text-[var(--text)]">{detection.confidence}</span></div>
                  <div>First observed: <span className="text-[var(--text)]">{new Date(detection.firstObservedAt).toLocaleString()}</span></div>
                  <div>Last observed: <span className="text-[var(--text)]">{new Date(detection.lastObservedAt).toLocaleString()}</span></div>
                </div>
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--muted)]">Source records</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{detection.eventIds.slice(0,8).map(id=><span key={id} className="rounded border border-[var(--border)] px-2 py-1 font-mono text-[9px]">{id.slice(0,16)}</span>)}</div>
                  {detection.sourceRefs.length>0&&<div className="mt-2 text-[10px] leading-4 text-[var(--muted)]">References: {detection.sourceRefs.slice(0,5).join(", ")}</div>}
                  {detection.techniqueIds.length>0&&<div className="mt-2 text-[10px] text-cyan-200">ATT&CK: {detection.techniqueIds.map(id=><a key={id} className="ml-2 underline" href={"https://attack.mitre.org/techniques/"+id.replace(".","/")+"/"} target="_blank" rel="noreferrer">{id}</a>)}</div>}
                  <div className="mt-3 text-xs leading-5"><span className="font-semibold">Next step: </span>{detection.nextStep}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4 text-[var(--accent)]"/>LangGraph / NVIDIA NIM</div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Run bounded recursive analyst review across the observed evidence window. Model configuration and inference status are displayed separately.</p>
            <Link href="/console/agentic-soc" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-bold text-slate-950">Open Agentic SOC</Link>
          </article>
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><ArrowDownToLine className="h-4 w-4 text-[var(--accent)]"/>Obsidian evidence notes</div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Export source-observed events to Markdown with YAML frontmatter and source references; do not put secrets in portable notes.</p>
            <a href="/api/console/obsidian-export" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold">Download Markdown</a>
          </article>
        </section>
      </div>
    </main>
  );
}
