"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, Bot, ChevronRight, CircleDot, Database,
  Globe2, Layers3, RefreshCw, ShieldCheck, Skull, Target, Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Connector = {
  id:string; name:string; mode:string; purpose:string; integrationState:string;
  health:string; configured:boolean; lastObservedAt:string|null; lastError:string|null;
};

type Dashboard = {
  ok:boolean;
  connectors:Connector[];
  metrics:{activeThreats:number;criticalAssets:number;kev:number;epss:number|null;vpr:number|null;exposure:number|null};
  graph:{nodes:number};
  activeCampaigns:number;
  events:Array<{
    id:string; connector_id:string; event_type:string; subject_key:string|null;
    evidence_state:string; severity:string|null; observed_at:string; source_ref:string|null;
    payload:Record<string,unknown>;
  }>;
};

type Analyst = {
  ok:boolean;
  run:{id:string;status:string;evidenceState:string;startedAt:string;completedAt:string|null}|null;
  findings:Array<{
    id:string;title:string;severity:string;confidence:string;evidenceState:string;
    subjectKey:string|null;techniqueIds:string[];gaps:string[];
    proposedActions:Array<{action:string;target:string;approvalState:string}>;
  }>;
};

function value(value:number|null|undefined) {
  return value === null || value === undefined ? "UNMEASURABLE" : String(value);
}

export default function AutonomousAnalystPage() {
  const router = useRouter();
  const [dashboard,setDashboard] = useState<Dashboard|null>(null);
  const [analyst,setAnalyst] = useState<Analyst|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const [selected,setSelected] = useState<string|null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [dashboardResponse,analystResponse] = await Promise.all([
      fetch("/api/console/security-fabric",{cache:"no-store"}),
      fetch("/api/console/autonomous-analyst",{cache:"no-store"}),
    ]);
    if (dashboardResponse.status === 401 || analystResponse.status === 401) {
      router.replace("/login?next=%2Fconsole%2Fanalyst");
      return;
    }
    if (!dashboardResponse.ok || !analystResponse.ok) {
      setError("The security fabric is unavailable. No synthetic posture is shown.");
      return;
    }
    setDashboard(await dashboardResponse.json() as Dashboard);
    setAnalyst(await analystResponse.json() as Analyst);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch(() => {
        setError("Unable to load the autonomous analyst.");
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const recent = useMemo(() => dashboard?.events ?? [], [dashboard]);
  const connected = dashboard?.connectors.filter((item) => item.health === "CONNECTED").length ?? 0;
  const mapPoints = recent.filter((event) =>
    typeof event.payload.latitude === "number" && typeof event.payload.longitude === "number"
  );

  async function runAnalyst() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/console/autonomous-analyst",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({trigger:"MANUAL"}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "analyst_failed");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "analyst_failed");
    } finally {
      setBusy(false);
    }
  }

  async function probe(id:string) {
    setError(null);
    try {
      const response = await fetch("/api/console/security-fabric",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({action:"probe",connectorId:id}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "probe_failed");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "probe_failed");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header)]/88 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-7">
          <Link href="/console" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span>
              <b className="block text-sm tracking-[.12em]">ELITZE</b>
              <span className="block text-[8px] uppercase tracking-[.24em] text-[var(--muted)]">Autonomous Analyst</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-xs md:flex">
            {["Executive Dashboard","Threat Intel","Assets","CVEs","Agents"].map((item,index) => (
              <Link
                key={item}
                href={index === 0 ? "/console/analyst" : "/console"}
                className={index === 0
                  ? "rounded-xl bg-[var(--accent-soft)] px-3 py-2 font-semibold text-[var(--accent)]"
                  : "rounded-xl px-3 py-2 text-[var(--muted)] hover:text-[var(--text)]"}
              >
                {item}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={runAnalyst}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50"
          >
            {busy ? "Analyzing..." : "Run analyst"}
            <Bot className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7">
        {error && (
          <div className="mb-4 rounded-2xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-xs text-amber-200">
            {error}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {([
            ["Active Threats",dashboard?.metrics.activeThreats ?? 0,Activity],
            ["Critical Assets",dashboard?.metrics.criticalAssets ?? 0,Target],
            ["KEV",dashboard?.metrics.kev ?? 0,Skull],
            ["EPSS",value(dashboard?.metrics.epss),CircleDot],
            ["VPR",value(dashboard?.metrics.vpr),Waypoints],
            ["Risk",value(dashboard?.metrics.exposure),AlertTriangle],
          ] as Array<[string,string|number,LucideIcon]>).map(([label,metric,Icon]) => (
            <div key={String(label)} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">
                <span>{String(label)}</span>
                <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
              </div>
              <div className="mt-3 text-2xl font-black tracking-[-.04em]">{String(metric)}</div>
              <div className="mt-1 text-[9px] uppercase tracking-[.14em] text-[var(--muted)]">
                Evidence-backed state
              </div>
            </div>
          ))}
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Security Graph</div>
                <h2 className="mt-1 text-xl font-black">Attack Graph</h2>
              </div>
              <span className="text-[10px] text-[var(--muted)]">{dashboard?.graph.nodes ?? 0} observed nodes</span>
            </div>
            <div className="relative min-h-[330px] overflow-hidden p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.08),transparent_50%)]" />
              <div className="relative grid h-full min-h-[280px] place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Waypoints className="h-7 w-7" />
                  </div>
                  <div className="mt-5 text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">Observed attack paths</div>
                  <div className="mt-2 text-sm text-[var(--muted-strong)]">Asset → Service → CVE → Exploit → Evidence</div>
                  <div className="mt-2 text-[10px] text-[var(--muted)]">
                    {dashboard?.graph.nodes ? "Graph data available for drill-down." : "No observed graph path is available yet."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Observed geography</div>
                <h2 className="mt-1 text-xl font-black">Live World Map</h2>
              </div>
              <Globe2 className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div className="grid min-h-[330px] place-items-center p-6 text-center">
              {mapPoints.length ? (
                <div className="w-full space-y-2">
                  {mapPoints.slice(0,12).map((point) => (
                    <div key={point.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-xs">
                      <span>{point.subject_key ?? point.event_type}</span>
                      <span className="text-[var(--muted)]">{String(point.payload.latitude)},{String(point.payload.longitude)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Globe2 className="mx-auto h-10 w-10 text-[var(--muted)]" />
                  <div className="mt-3 text-sm font-semibold">UNMEASURABLE</div>
                  <div className="mt-1 max-w-xs text-xs leading-5 text-[var(--muted)]">
                    No real geospatial observations are available in the current tenant evidence window.
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_.9fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Correlated evidence</div>
                <h2 className="mt-1 text-xl font-black">AI Investigation Timeline</h2>
              </div>
              <Link href="/console" className="text-[10px] font-semibold text-[var(--accent)]">
                Open console <ChevronRight className="inline h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {recent.length ? recent.slice(0,12).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelected(event.id)}
                  className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-[var(--panel-strong)]"
                >
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">{event.subject_key ?? event.event_type}</span>
                    <span className="mt-1 block text-[10px] text-[var(--muted)]">
                      {event.connector_id} · {event.evidence_state} · {new Date(event.observed_at).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-[9px] uppercase text-[var(--muted)]">{event.severity ?? "INFO"}</span>
                </button>
              )) : (
                <div className="p-6 text-sm text-[var(--muted)]">No observed security events.</div>
              )}
            </div>
            {selected && (
              <div className="border-t border-[var(--border)] bg-[var(--panel-strong)] p-5">
                <div className="text-[9px] uppercase tracking-[.18em] text-[var(--muted)]">Selected evidence</div>
                <pre className="mt-3 max-h-48 overflow-auto text-[10px] leading-5 text-[var(--muted-strong)]">
                  {JSON.stringify(recent.find((item) => item.id === selected)?.payload ?? {},null,2)}
                </pre>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Campaign context</div>
              <h2 className="mt-1 text-xl font-black">Active Campaigns</h2>
            </div>
            <div className="p-5">
              <div className="text-3xl font-black">{dashboard?.activeCampaigns ?? 0}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">Campaign identifiers observed in tenant evidence</div>
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Database className="h-4 w-4 text-[var(--accent)]" />
                  {connected} sources connected
                </div>
                <div className="mt-2 text-[10px] leading-5 text-[var(--muted)]">
                  Source state is based on live probes or received evidence, not repository presence.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Analysis</div>
              <h2 className="mt-1 text-xl font-black">Autonomous Analyst</h2>
            </div>
            <div className="text-[10px] text-[var(--muted)]">
              {analyst?.run ? analyst.run.status + " · " + analyst.run.evidenceState : "No analysis run"}
            </div>
          </div>

          <div className="grid gap-3 p-5 lg:grid-cols-2">
            {analyst?.findings.length ? analyst.findings.map((finding) => (
              <article key={finding.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold">{finding.title}</div>
                  <span className="text-[9px] font-bold uppercase text-[var(--accent)]">{finding.severity}</span>
                </div>
                <div className="mt-2 text-[10px] text-[var(--muted)]">
                  confidence {finding.confidence} · evidence {finding.evidenceState}
                </div>
                <div className="mt-4 text-xs leading-6 text-[var(--muted-strong)]">
                  {finding.gaps.length ? finding.gaps.join(" ") : "No material evidence gaps recorded for this finding."}
                </div>
                <div className="mt-4 space-y-2">
                  {finding.proposedActions.map((action) => (
                    <div key={action.action} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-[10px]">
                      <span className="font-semibold">{action.approvalState}</span>
                      <span className="ml-2 text-[var(--muted)]">{action.action}</span>
                    </div>
                  ))}
                </div>
              </article>
            )) : (
              <div className="p-6 text-sm text-[var(--muted)]">
                No analyst findings are available. Run the analyst after real evidence is connected.
              </div>
            )}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">18-source fabric</div>
              <h2 className="mt-1 text-xl font-black">Threat Feeds & Detection Fabric</h2>
            </div>
            <RefreshCw className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {dashboard?.connectors.map((connector) => (
              <button
                key={connector.id}
                type="button"
                onClick={() => void probe(connector.id)}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3 text-left hover:border-[var(--accent-border)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{connector.name}</span>
                  <span className={"h-2 w-2 rounded-full " + (
                    connector.health === "CONNECTED" ? "bg-emerald-400" :
                    connector.health === "ERROR" ? "bg-amber-400" : "bg-slate-500"
                  )} />
                </div>
                <div className="mt-2 text-[9px] uppercase tracking-[.12em] text-[var(--muted)]">
                  {connector.mode} · {connector.health}
                </div>
                <div className="mt-2 line-clamp-2 text-[10px] leading-4 text-[var(--muted-strong)]">
                  {connector.purpose}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-5">
          <div className="flex items-start gap-3">
            <Layers3 className="mt-1 h-5 w-5 text-[var(--accent)]" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">Control rule</div>
              <div className="mt-2 text-sm font-semibold">
                The Autonomous Analyst investigates; ELITZE policy controls decide whether anything can execute.
              </div>
              <div className="mt-1 text-xs leading-5 text-[var(--muted-strong)]">
                No automated containment, scanner execution, case mutation or endpoint action is assumed from connector availability alone.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
