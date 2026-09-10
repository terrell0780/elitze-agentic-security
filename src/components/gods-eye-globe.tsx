"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Crosshair,
  Eye,
  Layers3,
  LocateFixed,
  Maximize2,
  Mic,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";

type DomainId = "apps" | "agents" | "identity" | "cloud" | "data" | "visual";
type SensorMode = "TACTICAL" | "NVG" | "FLIR" | "NOIR" | "SNOW" | "NORMAL";
type LayerId = "graph" | "exposure" | "enforcement" | "detections" | "reach";

type Domain = {
  id: DomainId;
  label: string;
  detail: string;
  x: number;
  y: number;
  orbit: number;
};

type Market = {
  ok: boolean;
  stats?: {
    agents: number;
    shadowAgents: number;
    openDiscoveries: number;
    pendingApprovals: number;
    asiAvg: number;
  };
  events?: Array<{
    id: number;
    severity: string;
    eventType: string;
    summary: string;
    createdAt: string;
  }>;
};

const domains: Domain[] = [
  { id: "apps", label: "Apps", detail: "Application and release security", x: 50, y: 27, orbit: 14 },
  { id: "agents", label: "Agents", detail: "Agent, tool, MCP and autonomy boundaries", x: 75, y: 43, orbit: 20 },
  { id: "identity", label: "Identity", detail: "Human, service and workload identity", x: 67, y: 73, orbit: 18 },
  { id: "cloud", label: "Cloud", detail: "Cloud assets, dependencies and exposure paths", x: 34, y: 73, orbit: 21 },
  { id: "data", label: "Data", detail: "Sensitive data, authorization and movement", x: 25, y: 45, orbit: 17 },
  { id: "visual", label: "Telemetry", detail: "Verified connector and runtime telemetry", x: 50, y: 84, orbit: 24 },
];

const layers: Array<{ id: LayerId; label: string; detail: string }> = [
  { id: "graph", label: "Security graph", detail: "Relationships between assets, identities, agents, data and controls." },
  { id: "exposure", label: "Exposure", detail: "Reachability, attack paths, vulnerabilities and business context." },
  { id: "enforcement", label: "Enforcement", detail: "Policy decisions and runtime actions that remain inside explicit authorization boundaries." },
  { id: "detections", label: "Detections", detail: "Verified security events and analyst-relevant observations." },
  { id: "reach", label: "Agent Reach", detail: "Authorized paths an agent can traverse across tools, APIs and connected systems." },
];

const sensors: SensorMode[] = ["TACTICAL", "NVG", "FLIR", "NOIR", "SNOW", "NORMAL"];

const sensorClasses: Record<SensorMode, string> = {
  TACTICAL: "contrast-125 saturate-110",
  NVG: "sepia-[.22] hue-rotate-[55deg] saturate-150 contrast-110",
  FLIR: "sepia saturate-200 hue-rotate-[300deg] contrast-125",
  NOIR: "grayscale contrast-125",
  SNOW: "grayscale opacity-95 brightness-125",
  NORMAL: "",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "—";
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(timestamp);
}

export default function GodsEyeGlobe() {
  const [active, setActive] = useState<DomainId>("agents");
  const [layer, setLayer] = useState<LayerId>("graph");
  const [sensor, setSensor] = useState<SensorMode>("TACTICAL");
  const [hud, setHud] = useState(true);
  const [detectionOverlay, setDetectionOverlay] = useState(true);
  const [globalContext, setGlobalContext] = useState(false);
  const [directorPlaying, setDirectorPlaying] = useState(false);
  const [command, setCommand] = useState("");
  const [commandMessage, setCommandMessage] = useState("");
  const [copilotListening, setCopilotListening] = useState(false);
  const [rotation, setRotation] = useState(-8);
  const [market, setMarket] = useState<Market | null>(null);
  const dragRef = useRef<{ x: number; rotation: number } | null>(null);

  const activeDomain = useMemo(() => domains.find((domain) => domain.id === active) ?? domains[0], [active]);
  const activeLayer = useMemo(() => layers.find((entry) => entry.id === layer) ?? layers[0], [layer]);
  const recentEvents = market?.events?.slice(0, 4) ?? [];
  const liveState = market?.ok ? "LIVE" : "UNAVAILABLE";

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/market", { cache: "no-store" });
      const payload = (await response.json()) as Market;
      setMarket(payload);
    } catch {
      setMarket({ ok: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!directorPlaying) return;
    const timer = window.setInterval(() => {
      setActive((current) => {
        const index = domains.findIndex((domain) => domain.id === current);
        return domains[(index + 1) % domains.length].id;
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [directorPlaying]);

  function executeCommand(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!value) return;
    if (value.includes("reset") || value.includes("globe")) {
      setRotation(-8);
      setActive("agents");
      setLayer("graph");
      setGlobalContext(false);
      setCommandMessage("Global Security View reset.");
      return;
    }
    const matchingDomain = domains.find((domain) => value.includes(domain.label.toLowerCase()));
    if (matchingDomain) {
      setActive(matchingDomain.id);
      setCommandMessage(`Focused ${matchingDomain.label}.`);
      return;
    }
    const matchingLayer = layers.find((entry) => value.includes(entry.label.toLowerCase()));
    if (matchingLayer) {
      setLayer(matchingLayer.id);
      setCommandMessage(`${matchingLayer.label} layer enabled.`);
      return;
    }
    if (value.includes("nvg") || value.includes("night vision")) {
      setSensor("NVG");
      setCommandMessage("NVG sensor enabled.");
      return;
    }
    if (value.includes("flir") || value.includes("thermal")) {
      setSensor("FLIR");
      setCommandMessage("FLIR sensor enabled.");
      return;
    }
    if (value.includes("noir")) {
      setSensor("NOIR");
      setCommandMessage("NOIR sensor enabled.");
      return;
    }
    if (value.includes("tactical")) {
      setSensor("TACTICAL");
      setHud(true);
      setCommandMessage("Tactical layout enabled.");
      return;
    }
    if (value.includes("global")) {
      setGlobalContext(true);
      setCommandMessage("Global context staged.");
      return;
    }
    setCommandMessage("Command not recognized. Try: agents, exposure, enforcement, NVG, FLIR, tactical, global, reset.");
  }

  function beginDrag(clientX: number) {
    dragRef.current = { x: clientX, rotation };
  }

  function moveDrag(clientX: number) {
    if (!dragRef.current) return;
    setRotation(clamp(dragRef.current.rotation + (clientX - dragRef.current.x) * 0.12, -28, 28));
  }

  function endDrag() {
    dragRef.current = null;
  }

  async function shareView() {
    const params = new URLSearchParams({ domain: active, layer, sensor, hud: String(hud), detections: String(detectionOverlay) });
    const url = `${window.location.origin}${window.location.pathname}?gsv=${encodeURIComponent(params.toString())}`;
    try {
      await navigator.clipboard.writeText(url);
      setCommandMessage("Shareable Global Security View link copied.");
    } catch {
      setCommandMessage("Share link prepared in the current browser address model.");
    }
  }

  function startVoice() {
    const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: new () => { start(): void; stop(): void; onresult?: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend?: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCommandMessage("Browser voice input is unavailable.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setCommand(transcript);
      executeCommand(transcript);
    };
    recognition.onend = () => setCopilotListening(false);
    setCopilotListening(true);
    recognition.start();
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-[radial-gradient(circle_at_50%_48%,rgba(239,68,68,.14),transparent_44%),linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012))] p-4 shadow-[0_30px_100px_rgba(0,0,0,.28)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
            <span className={`h-2 w-2 rounded-full ${market?.ok ? "bg-emerald-400" : "bg-amber-400"} pulse-soft`} />
            ELITZE Global Security View
          </div>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">Command the security system like a live operational map.</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--muted)]">A security-first spatial interface inspired by modern live-globe operating consoles: focus, track, interrogate, switch sensor modes, inspect reachability and preserve the exact current view.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
          <div className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">{liveState} data</div>
          <div className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">{sensor}</div>
          <button type="button" onClick={() => setHud((value) => !value)} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 transition hover:border-[var(--accent-border)]"><Eye className="mr-1 inline h-3 w-3" />HUD {hud ? "ON" : "OFF"}</button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {layers.map((entry) => (
          <button key={entry.id} type="button" onClick={() => setLayer(entry.id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${layer === entry.id ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={`relative min-h-[560px] overflow-hidden rounded-2xl border border-white/8 bg-[#05070b] ${sensorClasses[sensor]}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,.08),transparent_48%)]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:34px_34px]" />

          {hud && (
            <>
              <div className="absolute left-4 top-4 z-20 rounded-xl border border-white/10 bg-black/45 p-3 backdrop-blur-md">
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">TACTICAL VIEW</div>
                <div className="mt-1 font-mono text-sm text-white">{activeDomain.label.toUpperCase()} / {activeLayer.label.toUpperCase()}</div>
                <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> telemetry boundary: {liveState.toLowerCase()}</div>
              </div>
              <div className="absolute right-4 top-4 z-20 rounded-xl border border-white/10 bg-black/45 p-3 text-right backdrop-blur-md">
                <div className="text-[9px] uppercase tracking-[0.2em] text-slate-500">ROTATION</div>
                <div className="font-mono text-sm text-white">{rotation.toFixed(1)}°</div>
              </div>
              <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-[9px] text-slate-400 backdrop-blur-md">DRAG TO ROTATE · CLICK A DOMAIN TO FOCUS</div>
              <div className="absolute bottom-4 right-4 z-20 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-[9px] text-slate-400 backdrop-blur-md">EVIDENCE FIRST · NO SYNTHETIC TELEMETRY</div>
            </>
          )}

          <div
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onPointerDown={(event) => beginDrag(event.clientX)}
            onPointerMove={(event) => moveDrag(event.clientX)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
          >
            <svg className="absolute inset-[3%] h-[94%] w-[94%]" viewBox="0 0 100 100" role="img" aria-label="Interactive ELITZE Global Security View">
              <defs>
                <radialGradient id="gsvCore" cx="42%" cy="38%" r="62%">
                  <stop offset="0%" stopColor="rgba(239,68,68,.24)" />
                  <stop offset="58%" stopColor="rgba(59,130,246,.09)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
                <linearGradient id="gsvArc" x1="0" x2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="50%" stopColor="rgba(239,68,68,.65)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              <g transform={`translate(50 50) rotate(${rotation}) translate(-50 -50)`}>
                <ellipse cx="50" cy="50" rx="37" ry="37" fill="url(#gsvCore)" />
                <ellipse cx="50" cy="50" rx="36" ry="36" fill="none" stroke="rgba(248,250,252,.16)" strokeWidth=".25" />
                <ellipse cx="50" cy="50" rx="29" ry="36" fill="none" stroke="rgba(248,250,252,.09)" strokeWidth=".2" />
                <ellipse cx="50" cy="50" rx="15" ry="36" fill="none" stroke="rgba(248,250,252,.07)" strokeWidth=".2" />
                <ellipse cx="50" cy="50" rx="36" ry="29" fill="none" stroke="rgba(248,250,252,.09)" strokeWidth=".2" />
                <ellipse cx="50" cy="50" rx="36" ry="15" fill="none" stroke="rgba(248,250,252,.07)" strokeWidth=".2" />

                <path d="M14 49 C26 24 74 24 86 50 C74 76 26 76 14 49Z" fill="none" stroke="rgba(239,68,68,.1)" strokeWidth=".55" />
                <path d="M20 67 C36 76 62 76 80 62" fill="none" stroke="url(#gsvArc)" strokeWidth=".42" strokeDasharray="2.5 2.2" className={directorPlaying ? "animate-pulse" : ""} />
                <path d="M17 39 C34 25 68 26 83 39" fill="none" stroke="rgba(59,130,246,.22)" strokeWidth=".35" strokeDasharray="1 2" />

                {domains.map((domain, index) => {
                  const focused = active === domain.id;
                  const radius = focused ? 4.8 : 3.4;
                  const showDetection = detectionOverlay || layer === "detections";
                  return (
                    <g key={domain.id}>
                      <line x1="50" y1="50" x2={domain.x} y2={domain.y} stroke={focused ? "rgba(239,68,68,.58)" : "rgba(239,68,68,.18)"} strokeWidth={focused ? ".6" : ".28"} strokeDasharray={layer === "reach" ? "1 1" : "1.4 2.2"} />
                      <circle cx={domain.x} cy={domain.y} r={radius + domain.orbit / 7} fill="none" stroke={focused ? "rgba(239,68,68,.42)" : "rgba(248,250,252,.09)"} strokeWidth=".22" />
                      <circle cx={domain.x} cy={domain.y} r={focused ? radius : 2.1} fill={focused ? "#ef4444" : "rgba(248,250,252,.58)"} className={index % 2 === 0 ? "animate-pulse" : ""} />
                      {showDetection && <rect x={domain.x - 4.8} y={domain.y - 4.2} width="9.6" height="8.4" fill="none" stroke={focused ? "rgba(239,68,68,.72)" : "rgba(248,250,252,.22)"} strokeWidth=".35" />}
                      <foreignObject x={domain.x - 9} y={domain.y - 10} width="18" height="20">
                        <button type="button" className="grid h-6 w-20 -translate-x-1/2 place-items-center rounded text-[7px] font-bold uppercase tracking-[0.12em] text-white/75 transition hover:text-white" onClick={(event) => { event.stopPropagation(); setActive(domain.id); }} title={domain.detail}>
                          {domain.label}
                        </button>
                      </foreignObject>
                    </g>
                  );
                })}
              </g>
            </svg>

            <div className={`absolute left-1/2 top-1/2 grid h-32 w-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--accent-border)] bg-black/35 text-center shadow-[0_0_70px_rgba(239,68,68,.14)] backdrop-blur-md ${globalContext ? "ring-2 ring-[var(--accent)]/20" : ""}`}>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]">ELITZE</div>
                <div className="mt-1 text-sm font-bold">Global View</div>
                <div className="mt-1 text-[9px] text-[var(--accent)]">{activeDomain.label} focus</div>
                {globalContext && <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-emerald-300">context staged</div>}
              </div>
            </div>
          </div>

          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 backdrop-blur-md">{activeLayer.detail}</div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Focused contact</div>
                <div className="mt-2 text-2xl font-bold">{activeDomain.label}</div>
              </div>
              <div className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-2 text-[var(--accent)]"><Crosshair className="h-4 w-4" /></div>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-strong)]">{activeDomain.detail}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDirectorPlaying(true)} className="rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition hover:border-[var(--accent-border)]"><LocateFixed className="mb-1 h-3.5 w-3.5" />Track</button>
              <button type="button" onClick={() => setDetectionOverlay((value) => !value)} className={`rounded-xl border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition ${detectionOverlay ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)]"}`}><ScanLine className="mb-1 h-3.5 w-3.5" />Detection {detectionOverlay ? "ON" : "OFF"}</button>
              <button type="button" onClick={() => setGlobalContext((value) => !value)} className={`rounded-xl border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition ${globalContext ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)]"}`}><Layers3 className="mb-1 h-3.5 w-3.5" />Global context</button>
              <button type="button" onClick={() => { setActive("agents"); setLayer("graph"); setSensor("TACTICAL"); setDirectorPlaying(false); }} className="rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition hover:border-[var(--accent-border)]"><RotateCcw className="mb-1 h-3.5 w-3.5" />Reset view</button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Sensor stack</div>
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {sensors.map((mode) => <button key={mode} type="button" onClick={() => setSensor(mode)} className={`rounded-lg border px-2 py-2 text-[9px] font-bold uppercase tracking-[0.08em] transition ${sensor === mode ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}>{mode}</button>)}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Scene director</div>
              <button type="button" onClick={() => setDirectorPlaying((value) => !value)} className="rounded-lg border border-[var(--border)] bg-black/10 p-2 transition hover:border-[var(--accent-border)]" aria-label={directorPlaying ? "Pause scene director" : "Play scene director"}>{directorPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setLayer("graph")} className="rounded-lg border border-[var(--border)] px-2 py-2 text-[9px] font-bold uppercase">Graph</button>
              <button type="button" onClick={() => setLayer("reach")} className="rounded-lg border border-[var(--border)] px-2 py-2 text-[9px] font-bold uppercase">Reach</button>
              <button type="button" onClick={() => setLayer("detections")} className="rounded-lg border border-[var(--border)] px-2 py-2 text-[9px] font-bold uppercase">Detect</button>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Operational command</div>
              <button type="button" onClick={startVoice} className={`rounded-lg border border-[var(--border)] p-2 transition hover:border-[var(--accent-border)] ${copilotListening ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} aria-label="Use browser voice command"><Mic className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-3 flex gap-2">
              <input value={command} onChange={(event) => setCommand(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") executeCommand(command); }} placeholder="Try 'agents', 'FLIR', 'global'" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600" />
              <button type="button" onClick={() => executeCommand(command)} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-white">Run</button>
            </div>
            {commandMessage && <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">{commandMessage}</p>}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Live security context</div>
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[var(--border)] p-2"><div className="font-mono text-sm font-bold">{market?.stats?.agents ?? "—"}</div><div className="text-[8px] uppercase tracking-[0.1em] text-[var(--muted)]">agents</div></div>
              <div className="rounded-lg border border-[var(--border)] p-2"><div className="font-mono text-sm font-bold">{market?.stats?.openDiscoveries ?? "—"}</div><div className="text-[8px] uppercase tracking-[0.1em] text-[var(--muted)]">discoveries</div></div>
              <div className="rounded-lg border border-[var(--border)] p-2"><div className="font-mono text-sm font-bold">{market?.stats?.pendingApprovals ?? "—"}</div><div className="text-[8px] uppercase tracking-[0.1em] text-[var(--muted)]">approvals</div></div>
              <div className="rounded-lg border border-[var(--border)] p-2"><div className="font-mono text-sm font-bold">{market?.stats?.asiAvg ?? "—"}%</div><div className="text-[8px] uppercase tracking-[0.1em] text-[var(--muted)]">ASI</div></div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[var(--accent)]" /><div className="text-xs font-bold">Recent verified context</div></div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-[var(--muted)]">source: ELITZE records</div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {recentEvents.length > 0 ? recentEvents.map((event) => <div key={event.id} className="rounded-xl border border-[var(--border)] bg-black/10 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--accent)]">{event.severity}</span><span className="text-[9px] text-[var(--muted)]">{formatTime(event.createdAt)}</span></div><div className="mt-1 text-[10px] font-semibold">{event.eventType}</div><div className="mt-1 text-[10px] leading-4 text-[var(--muted)]">{event.summary}</div></div>) : <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-[var(--border)] bg-black/10 p-4 text-[10px] text-[var(--muted)]">No verified event telemetry is available from the configured data plane.</div>}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          <button type="button" onClick={shareView} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:border-[var(--accent-border)]"><Share2 className="mr-1 inline h-3.5 w-3.5" />Share view</button>
          <button type="button" onClick={() => setDirectorPlaying((value) => !value)} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:border-[var(--accent-border)]"><Target className="mr-1 inline h-3.5 w-3.5" />{directorPlaying ? "Stop track" : "Track mode"}</button>
          <button type="button" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] transition hover:border-[var(--accent-border)]"><Maximize2 className="mr-1 inline h-3.5 w-3.5" />Expand context</button>
        </div>
      </div>
    </section>
  );
}
