import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Box,
  Boxes,
  Braces,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  Eye,
  FileSearch,
  Fingerprint,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  Hammer,
  HandCoins,
  KeyRound,
  Layers,
  Lock,
  type LucideIcon,
  Mic,
  Package,
  PanelTop,
  PlayCircle,
  Plug,
  Power,
  Radar,
  Scale,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Signal,
  Siren,
  Sparkles,
  Terminal,
  TestTube2,
  TreePine,
  UserCheck,
  Vault,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import MarketIntel from "@/components/MarketIntel";
import UseCases from "@/components/UseCases";
import SmartApps from "@/components/SmartApps";
import SmartChatHierarchy from "@/components/SmartChatHierarchy";
import MissingFromMarket from "@/components/MissingFromMarket";
import CookieSettings from "@/components/CookieSettings";
import CDNStatus from "@/components/CDNStatus";

/* -------------------------------------------------------------------------- */
/*  Data                                                                       */
/* -------------------------------------------------------------------------- */

const mainNav = [
  { label: "Surface", icon: Layers, href: "#surface" },
  { label: "Code", icon: Code2, href: "#code" },
  { label: "Connect", icon: Plug, href: "#connect" },
  { label: "Market", icon: Radar, href: "#market" },
];

const corePillars: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: "red" | "rose" | "bronze" | "amber";
  bullets: string[];
}[] = [
  {
    title: "Security Graph",
    subtitle: "Every identity, tool, secret, model and endpoint as a living graph.",
    icon: Workflow,
    accent: "red",
    bullets: [
      "Shadow agent & MCP discovery",
      "Attack-path & multi-agent blast radius",
      "Cross-surface provenance tracing",
    ],
  },
  {
    title: "Security Intelligence",
    subtitle: "Context-aware scoring trained on CVEs, threat feeds and your telemetry.",
    icon: Brain,
    accent: "rose",
    bullets: [
      "Intent-focused detection (not just API logs)",
      "Memory integrity / context poisoning defense",
      "OWASP ASI threat correlation",
    ],
  },
  {
    title: "Policy Engine",
    subtitle: "Declarative, OPA-compatible policies for agents, tools and data flows.",
    icon: Scale,
    accent: "bronze",
    bullets: [
      "Purpose binding & capability tokens",
      "Per-agent NHI + least privilege",
      "GitOps policy lifecycle",
    ],
  },
  {
    title: "Guardrails",
    subtitle: "In-band enforcement that keeps agents on the rails without breaking them.",
    icon: ShieldCheck,
    accent: "red",
    bullets: [
      "Pre-tool hooks (intercept before execute)",
      "Direct + indirect prompt injection defense",
      "DLP, PII redaction & intent mismatch",
    ],
  },
  {
    title: "Sandbox",
    subtitle: "Deterministic, network-isolated execution for untrusted agent actions.",
    icon: Box,
    accent: "amber",
    bullets: [
      "Firecracker micro-VMs / gVisor",
      "Egress allowlists + credential vault broker",
      "Ephemeral per-task filesystems",
    ],
  },
  {
    title: "Killswitch",
    subtitle: "Close the governance–containment gap. Stop agents, don't just watch them.",
    icon: Power,
    accent: "rose",
    bullets: [
      "Granular & global stop in <50ms",
      "Auto-isolate · revoke NHI · fire playbook",
      "HITL for irreversible / financial / external",
    ],
  },
];

const protectBlocks = [
  {
    title: "CVE Intelligence",
    icon: FileSearch,
    desc: "Prioritized, in-context CVE data mapped to your repos, containers and agents.",
    stat: "47,218",
    statLabel: "CVEs tracked today",
  },
  {
    title: "Vulnerability Operations",
    icon: Hammer,
    desc: "Triage, assign and auto-remediate vulns across code, supply chain and runtime.",
    stat: "93%",
    statLabel: "SLA hit rate",
  },
  {
    title: "SOC / SecOps",
    icon: Siren,
    desc: "Detection engineering, alert triage and SOAR workflows purpose-built for agents.",
    stat: "1.2k",
    statLabel: "Detections out-of-the-box",
  },
  {
    title: "Governance",
    icon: TreePine,
    desc: "Compliance evidence, access reviews and audit trails for SOC2, ISO, HIPAA.",
    stat: "24/7",
    statLabel: "Audit-ready evidence",
  },
];

const byoBlocks = [
  {
    key: "BYOK",
    title: "Bring Your Own Key",
    desc: "Customer-managed encryption keys via KMS / HSM. We never see your keys.",
    icon: KeyRound,
  },
  {
    key: "BYOM",
    title: "Bring Your Own Model",
    desc: "Point Guardrails at your own hosted LLMs — Open Source, Azure, Bedrock, vLLM.",
    icon: Bot,
  },
  {
    key: "BYOP",
    title: "Bring Your Own Provider",
    desc: "Pluggable identity, cloud and observability. No forced vendor lock-in.",
    icon: HandCoins,
  },
];

const integrationRows: {
  title: string;
  items: { name: string; icon: LucideIcon }[];
}[] = [
  {
    title: "Secrets & Identity",
    items: [
      { name: "Token / Credential Vault", icon: Vault },
      { name: "OIDC / SSO", icon: UserCheck },
      { name: "Workload Identity", icon: Fingerprint },
    ],
  },
  {
    title: "Clouds",
    items: [
      { name: "AWS", icon: Cloud },
      { name: "Azure", icon: Server },
      { name: "GCP", icon: Globe },
    ],
  },
  {
    title: "Dev Ecosystem",
    items: [
      { name: "GitHub", icon: GitBranch },
      { name: "Container Registries", icon: Boxes },
      { name: "CI/CD", icon: Workflow },
    ],
  },
  {
    title: "Edge & Network",
    items: [
      { name: "Kong Gateway", icon: Plug },
      { name: "Envoy / Service Mesh", icon: Shuffle },
      { name: "Zero-Trust Edge", icon: ShieldCheck },
    ],
  },
  {
    title: "Endpoint & EDR",
    items: [
      { name: "CrowdStrike", icon: Eye },
      { name: "Defender / XDR", icon: Radar },
      { name: "SIEM Forwarders", icon: Activity },
    ],
  },
];

const domainCards = [
  {
    title: "MCP Security",
    icon: Braces,
    desc: "Auth, schema validation, audience-bound tokens and capability scoping for Model Context Protocol servers.",
    tags: ["OAuth", "Audience-bound", "Tool broker"],
  },
  {
    title: "API / LLM / Agent Security",
    icon: Bot,
    desc: "Unified firewall for HTTP, LLM prompts/responses and agent tool-call graphs — intent-aware, not just allowlists.",
    tags: ["WAAP", "Intent mismatch", "Agent Runtime"],
  },
  {
    title: "CI/CD + AIBOM",
    icon: Workflow,
    desc: "Scan pipelines, sign artifacts, inventory agents/tools/models (AIBOM) and block risky capabilities before merge.",
    tags: ["Pre-merge", "AIBOM", "Sigstore"],
  },
  {
    title: "Runtime Enforcement",
    icon: Gauge,
    desc: "Pre-tool hooks + eBPF/sidecar enforcement that stops attacks in-flight — isolate, revoke, playbook.",
    tags: ["Pre-tool", "eBPF", "Auto-isolate"],
  },
  {
    title: "NHI & Identity",
    icon: Fingerprint,
    desc: "First-class non-human identity per agent. Short-lived vaulted credentials — agents never hold long-lived keys.",
    tags: ["Per-agent NHI", "JIT tokens", "Least privilege"],
  },
  {
    title: "Audit & Evidence",
    icon: Database,
    desc: "Tamper-evident logs, replayable agent traces, ASI-mapped evidence and insurance-ready MTTR packs.",
    tags: ["Signed logs", "ASI matrix", "EU AI Act"],
  },
];

const interfaceBlocks = [
  {
    title: "Frontier Chat",
    icon: Sparkles,
    desc: "Natural-language interface to your security posture: ask, explain, remediate.",
    meta: "Conversational SecOps copilot",
    color: "from-red-500/25 to-red-500/0",
  },
  {
    title: "Voice",
    icon: Mic,
    desc: "Hands-free triage during incidents. Speak a query, get a trusted answer back.",
    meta: "Real-time voice + transcription",
    color: "from-rose-500/25 to-rose-500/0",
  },
  {
    title: "Production UI",
    icon: PanelTop,
    desc: "Dashboards, inventory, explorer, graph view, attack-path visualizer and more.",
    meta: "Full SOC console included",
    color: "from-amber-600/20 to-amber-600/0",
  },
  {
    title: "Full Test Suite",
    icon: TestTube2,
    desc: "Red-team your agents with thousands of adversarial prompts and attack scenarios.",
    meta: "DAST + red-team evals",
    color: "from-red-700/25 to-red-700/0",
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const accentMap: Record<
  string,
  { border: string; text: string; bg: string; ring: string }
> = {
  red: {
    border: "border-red-500/35",
    text: "text-red-300",
    bg: "bg-red-500/10",
    ring: "shadow-[0_0_40px_-10px_rgba(239,68,68,0.55)]",
  },
  rose: {
    border: "border-rose-500/35",
    text: "text-rose-300",
    bg: "bg-rose-500/10",
    ring: "shadow-[0_0_40px_-10px_rgba(244,63,94,0.55)]",
  },
  bronze: {
    border: "border-amber-600/35",
    text: "text-amber-300",
    bg: "bg-amber-700/10",
    ring: "shadow-[0_0_40px_-10px_rgba(180,83,9,0.45)]",
  },
  amber: {
    border: "border-amber-500/30",
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    ring: "shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)]",
  },
};

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-md ring-1 ring-red-500/40 pulse-glow"
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/elitze-mark.png"
        alt="Elitze"
        width={size}
        height={size}
        className="h-full w-full object-cover"
        priority
      />
    </div>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-red-900/30 bg-[#07040a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={34} />
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight text-white">
                Elitze
                <span className="text-red-400">.</span>
              </div>
              <div className="-mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-red-400/80">
                Agentic Security
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {mainNav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="group flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-slate-300 transition hover:bg-red-500/10 hover:text-white"
              >
                <n.icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-300" />
                {n.label}
              </a>
            ))}
            <div className="mx-2 h-5 w-px bg-red-900/40" />
            <a
              href="#platform"
              className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-white"
            >
              Platform
            </a>
            <a
              href="#protect"
              className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-white"
            >
              Protect
            </a>
            <a
              href="#integrations"
              className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-white"
            >
              Integrations
            </a>
            <a
              href="#interfaces"
              className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-white"
            >
              Interfaces
            </a>
            <a
              href="#use-cases"
              className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-white"
            >
              Use Cases
            </a>
            <a
              href="#market"
              className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-white"
            >
              Market
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#docs"
            className="hidden rounded-md px-3 py-1.5 text-sm text-slate-300 transition hover:text-white sm:block"
          >
            Docs
          </a>
          <a
            href="#signin"
            className="hidden rounded-md px-3 py-1.5 text-sm text-slate-300 transition hover:text-white sm:block"
          >
            Sign in
          </a>
          <a
            href="#demo"
            className="group flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(239,68,68,0.45)] transition hover:bg-red-400"
          >
            Request demo
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

function StatusBar() {
  const items = [
    { label: "Guardrails", state: "ok", icon: ShieldCheck },
    { label: "Sandbox", state: "ok", icon: Box },
    { label: "Killswitch", state: "armed", icon: Power },
    { label: "Graph sync", state: "live", icon: Signal },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-full border border-red-500/20 bg-red-500/[0.04] px-4 py-2 text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
        </span>
        <span className="font-mono tracking-wider text-red-300">SYSTEM LIVE</span>
      </div>
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <i.icon className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-400">{i.label}</span>
          <span
            className={`font-mono ${
              i.state === "ok" || i.state === "live"
                ? "text-emerald-400"
                : i.state === "armed"
                  ? "text-amber-400"
                  : "text-rose-400"
            }`}
          >
            {i.state}
          </span>
        </div>
      ))}
    </div>
  );
}

function SecurityGraphVisual() {
  const nodes = [
    { id: "user", x: 60, y: 80, color: "#f87171", label: "user" },
    { id: "agent", x: 200, y: 60, color: "#ef4444", label: "agent" },
    { id: "llm", x: 340, y: 120, color: "#d4a574", label: "llm" },
    { id: "tool", x: 200, y: 220, color: "#fbbf24", label: "tool" },
    { id: "db", x: 400, y: 240, color: "#fb7185", label: "vault" },
    { id: "sandbox", x: 80, y: 240, color: "#f97316", label: "sandbox" },
  ];
  const edges: [string, string][] = [
    ["user", "agent"],
    ["agent", "llm"],
    ["agent", "tool"],
    ["agent", "sandbox"],
    ["tool", "db"],
    ["llm", "tool"],
  ];
  const getNode = (id: string) => nodes.find((n) => n.id === id)!;
  return (
    <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-[#0a0508] p-2">
      <div className="flex items-center justify-between border-b border-red-900/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-red-400/80" />
          <span className="ml-2 font-mono text-[11px] text-slate-500">
            security-graph · live
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500">
          <span className="blink text-red-300">▮</span> streaming
        </span>
      </div>
      <svg viewBox="0 0 480 320" className="h-64 w-full">
        <defs>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 40}
            y1={0}
            x2={i * 40}
            y2={320}
            stroke="rgba(248,113,113,0.06)"
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 40}
            x2={480}
            y2={i * 40}
            stroke="rgba(248,113,113,0.06)"
          />
        ))}
        {edges.map(([a, b], idx) => {
          const na = getNode(a);
          const nb = getNode(b);
          return (
            <g key={idx}>
              <line
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke="rgba(248,113,113,0.2)"
                strokeWidth={1}
              />
              <line
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={nb.color}
                strokeWidth={1.2}
                strokeDasharray="4 8"
                className="dash"
                opacity="0.85"
              />
            </g>
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={22} fill="url(#node-glow)" />
            <circle cx={n.x} cy={n.y} r={10} fill={n.color} opacity="0.25" />
            <circle
              cx={n.x}
              cy={n.y}
              r={6}
              fill={n.color}
              stroke={n.color}
              strokeWidth={1}
            />
            <text
              x={n.x}
              y={n.y - 18}
              textAnchor="middle"
              fill="#fca5a5"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-2 border-t border-red-900/40 px-3 py-2 font-mono text-[10px]">
        <div>
          <div className="text-slate-500">entities</div>
          <div className="text-slate-200">14,982</div>
        </div>
        <div>
          <div className="text-slate-500">edges</div>
          <div className="text-slate-200">182,774</div>
        </div>
        <div>
          <div className="text-slate-500">risk score</div>
          <div className="text-red-300">24 / low</div>
        </div>
      </div>
    </div>
  );
}

function TerminalMock() {
  const lines = [
    { prompt: "$", c: "elitze policy eval --bundle ./policies", out: "" },
    { prompt: "", c: "", out: "✔ 147 policies loaded (reg0 + cedar)", color: "emerald" },
    { prompt: "", c: "", out: "→ analyzing agent:frontier-desk …", color: "red" },
    {
      prompt: "",
      c: "",
      out: "  tool.call[http.request] → ALLOW (egress: api.stripe.com)",
      color: "slate",
    },
    {
      prompt: "",
      c: "",
      out: "  tool.call[sql.exec]    → DENY  (missing row-level cap)",
      color: "rose",
    },
    {
      prompt: "",
      c: "",
      out: "  send_email[external]   → WARN  (PII fingerprint in body)",
      color: "amber",
    },
    { prompt: "$", c: "elitze killswitch arm --scope prod", out: "" },
    {
      prompt: "",
      c: "",
      out: "⚡ killswitch ARMED (scope=prod) · 3 agents paused",
      color: "amber",
    },
  ];
  return (
    <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-black/70 shadow-2xl shadow-red-950/40">
      <div className="flex items-center justify-between border-b border-red-900/40 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-red-400" />
          <span className="font-mono text-xs text-slate-400">~/elitze — zsh</span>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        </div>
      </div>
      <div className="max-h-80 overflow-auto p-4 font-mono text-[12.5px] leading-relaxed scrollbar-thin">
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre">
            {l.prompt && (
              <>
                <span className="text-red-400">{l.prompt}</span>{" "}
                <span className="text-slate-200">{l.c}</span>
              </>
            )}
            {l.out && (
              <span
                className={
                  l.color === "emerald"
                    ? "text-emerald-300"
                    : l.color === "red"
                      ? "text-red-300"
                      : l.color === "amber"
                        ? "text-amber-300"
                        : l.color === "rose"
                          ? "text-rose-300"
                          : "text-slate-400"
                }
              >
                {l.out}
              </span>
            )}
          </div>
        ))}
        <div className="mt-1">
          <span className="text-red-400">$</span>{" "}
          <span className="blink text-red-300">▮</span>
        </div>
      </div>
    </div>
  );
}

function ThreatFeed() {
  const items = [
    {
      sev: "critical",
      title: "Agent tool-call: exfil attempt blocked",
      time: "12s ago",
      icon: ShieldAlert,
    },
    {
      sev: "high",
      title: "New CVE mapped to your image: CVE-2026-3141",
      time: "4m ago",
      icon: AlertTriangle,
    },
    {
      sev: "info",
      title: "Policy pack ci-deploy-v1.4.2 synced to 3 clusters",
      time: "11m ago",
      icon: CheckCircle2,
    },
    {
      sev: "medium",
      title: "Anomalous tool burst from agent refund-bot",
      time: "22m ago",
      icon: Activity,
    },
    {
      sev: "info",
      title: "Killswitch drill completed in region us-east-1",
      time: "1h ago",
      icon: Power,
    },
  ];
  const sevColor: Record<string, string> = {
    critical: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    high: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    medium: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    info: "bg-red-500/10 text-red-300 border-red-500/30",
  };
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-red-500/20 bg-[#0a0508]">
      <div className="flex items-center justify-between border-b border-red-900/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-red-400 pulse-soft" />
          <span className="text-sm font-medium text-white">Threat feed</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          filtering · all surfaces
        </span>
      </div>
      <ul className="divide-y divide-red-950/60">
        {items.map((i) => (
          <li
            key={i.title}
            className="flex items-start gap-3 px-4 py-3 transition hover:bg-red-500/[0.04]"
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${sevColor[i.sev]}`}
            >
              <i.icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-slate-200">{i.title}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                {i.time} ·{" "}
                <span
                  className={
                    i.sev === "critical"
                      ? "text-rose-400"
                      : i.sev === "high"
                        ? "text-amber-400"
                        : i.sev === "medium"
                          ? "text-orange-400"
                          : "text-red-400"
                  }
                >
                  {i.sev}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-red-900/40 px-4 py-2.5">
        <a
          href="#soc"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-red-300"
        >
          Open SOC console
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <main className="relative">
      <NavBar />

      {/* ============================= HERO ============================= */}
      <section
        id="surface"
        className="relative overflow-hidden border-b border-red-950/50"
      >
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-red-600/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
              <Eye className="h-3.5 w-3.5" />
              Elitze · Agentic Security
            </div>
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[68px]">
              Security built for{" "}
              <span className="bg-gradient-to-r from-red-300 via-rose-300 to-amber-300 bg-clip-text text-transparent">
                agents that act.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Elitze is the unified security layer for agents, LLMs and APIs. A
              single graph connects identity, tools, models and data — enforced by
              Guardrails, contained in Sandbox, and kill-switched on demand.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-md bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] transition hover:bg-red-400"
              >
                <PlayCircle className="h-4 w-4" />
                Start free trial
              </a>
              <a
                href="#platform"
                className="inline-flex items-center gap-2 rounded-md border border-red-500/25 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-red-500/10"
              >
                <Terminal className="h-4 w-4 text-red-300" />
                Explore the platform
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-10">
              <StatusBar />
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-red-950/60 pt-8">
              {[
                { k: "30ms", v: "Guardrail p99 latency" },
                { k: "12,000+", v: "Tool calls / sec rated" },
                { k: "99.99%", v: "Enforcement uptime" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="text-2xl font-semibold text-white">{s.k}</dt>
                  <dd className="mt-1 text-xs text-slate-500">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative flex flex-col gap-4">
            {/* Emblem / logo showcase */}
            <div className="relative overflow-hidden rounded-xl border border-red-500/25 bg-[#0a0508] p-3">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/15 via-transparent to-amber-700/10" />
              <div className="relative flex items-center gap-4">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg ring-1 ring-red-500/40 eye-pulse sm:h-36 sm:w-36">
                  <Image
                    src="/images/elitze-logo.png"
                    alt="Elitze · Agentic Security emblem"
                    fill
                    className="object-cover"
                    sizes="144px"
                    priority
                  />
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-400/80">
                    Emblem · Elitze
                  </div>
                  <div className="mt-1 text-xl font-semibold tracking-wide text-white sm:text-2xl">
                    ELITZE
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                    The all-seeing eye watches every agent, tool call and secret
                    path across your surface.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-300">
                      graph
                    </span>
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] text-red-300">
                      killswitch
                    </span>
                    <span className="rounded-full border border-amber-600/30 bg-amber-700/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                      oss
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <SecurityGraphVisual />
            <TerminalMock />
          </div>
        </div>
      </section>

      {/* ============================= CODE ============================= */}
      <section id="code" className="relative border-b border-red-950/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Surface · Code"
            title="Secure the agent before it ever reaches production."
            description="Scan agent code, prompts, tools, and policy bundles at PR time. Generate SBOMs, sign artifacts, and block risky tool capabilities before merge."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <CodeCard
              icon={GitBranch}
              title="Pull request gating"
              lines={[
                { t: "elitze scan pr --repo acme/agent-runtime", c: "red" },
                { t: "→ 14 changed tools detected", c: "slate" },
                { t: "  ✔ sql.query  · row-level scoped", c: "emerald" },
                { t: "  ✘ http.rpc   · egress to unknown host", c: "rose" },
                { t: "  ⚠ fs.write   · path traversal hint", c: "amber" },
              ]}
            />
            <CodeCard
              icon={FileSearch}
              title="Prompt & policy review"
              lines={[
                { t: "elitze policy check ./policies/agent.rego", c: "red" },
                { t: "PASS  data.authz.allow_tool_call", c: "emerald" },
                { t: "WARN  default allow used in package tools", c: "amber" },
                { t: "HINT  add capability token for send_email", c: "red" },
              ]}
            />
            <CodeCard
              icon={ShieldCheck}
              title="Signed provenance"
              lines={[
                { t: "elitze sign --bundle ./dist", c: "red" },
                { t: "→ signing with cosign (keyless)", c: "slate" },
                { t: "✔ sbom.cdx.json    · sha256:7a1f…", c: "emerald" },
                { t: "✔ policy-bundle.tar · sha256:03cc…", c: "emerald" },
                { t: "attestations pushed to transparency log", c: "slate" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ============================= CONNECT ============================= */}
      <section
        id="connect"
        className="relative border-b border-red-950/50 bg-gradient-to-b from-transparent to-red-950/20 py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Surface · Connect"
            title="Plumb Elitze through every hop, without rewriting your stack."
            description="Drop-in SDKs, sidecars and gateway plugins for APIs, MCP servers, Kong, Envoy, and agent frameworks like LangGraph, CrewAI and AutoGen."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Package, t: "SDKs", d: "TypeScript, Python, Go, Rust. 5-min drop-in." },
              { icon: Plug, t: "Kong Plugin", d: "Lua plugin that enforces Guardrails at the edge." },
              { icon: Shuffle, t: "Envoy / Sidecar", d: "gRPC ext_proc filter for LLM/API traffic." },
              { icon: Braces, t: "MCP Gateway", d: "Broker + auditor for Model Context Protocol." },
              { icon: Bot, t: "Agent Frameworks", d: "LangGraph, CrewAI, AutoGen, LlamaIndex adapters." },
              { icon: Workflow, t: "CI/CD Plugins", d: "GitHub Actions, GitLab CI, Jenkins, Argo." },
              { icon: Database, t: "SIEM Forwarders", d: "Splunk, Datadog, Elastic, Panther, Chronicle." },
              { icon: Activity, t: "Webhooks", d: "Stream every decision to your own stacks." },
            ].map((x) => (
              <div
                key={x.t}
                className="group rounded-xl border border-red-900/40 bg-white/[0.02] p-5 transition hover:border-red-500/40 hover:bg-red-500/[0.05]"
              >
                <x.icon className="h-5 w-5 text-red-300" />
                <div className="mt-4 text-sm font-semibold text-white">{x.t}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-400">
                  {x.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= PLATFORM PILLARS ============================= */}
      <section id="platform" className="relative border-b border-red-950/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Agentic Security Platform"
            title="Six primitives that defend every layer."
            description="Elitze composes six native primitives into a single control plane: a graph, intelligence, policies, guardrails, sandbox and killswitch."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {corePillars.map((p) => {
              const a = accentMap[p.accent];
              return (
                <div
                  key={p.title}
                  className={`group relative overflow-hidden rounded-2xl border border-red-900/40 bg-[#0c060c] p-6 transition hover:border-red-500/35 hover:${a.ring}`}
                >
                  <div
                    className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${a.bg} opacity-70 transition group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${a.border} ${a.bg}`}
                    >
                      <p.icon className={`h-5 w-5 ${a.text}`} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      {p.subtitle}
                    </p>
                    <ul className="mt-5 space-y-2">
                      {p.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-xs text-slate-300"
                        >
                          <ChevronRight
                            className={`mt-0.5 h-3 w-3 shrink-0 ${a.text}`}
                          />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================= PROTECT ============================= */}
      <section
        id="protect"
        className="relative border-b border-red-950/50 bg-red-950/10 py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Protect"
            title="Full-spectrum security operations."
            description="From CVE intelligence to governance evidence, Elitze turns raw signal into prioritized action your SOC can run with."
          />
          <div className="mt-14 grid gap-5 lg:grid-cols-4">
            {protectBlocks.map((b) => (
              <div
                key={b.title}
                className="group relative overflow-hidden rounded-2xl border border-red-900/40 bg-[#0c060c] p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
                    <b.icon className="h-5 w-5 text-red-300" />
                  </div>
                  <Flame className="h-4 w-4 text-red-400/70" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">
                  {b.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  {b.desc}
                </p>
                <div className="mt-6 border-t border-red-950/50 pt-4">
                  <div className="font-mono text-2xl font-semibold text-red-300">
                    {b.stat}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
                    {b.statLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BYO */}
          <div className="mt-20">
            <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-red-400">
                  Sovereignty
                </div>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  BYOK · BYOM · BYOP
                </h3>
                <p className="mt-1 max-w-xl text-sm text-slate-400">
                  Elitze is a control plane, not a cage. Bring your own keys,
                  models and providers — we enforce policy regardless of where
                  your workloads run.
                </p>
              </div>
              <a
                href="#byo"
                className="inline-flex items-center gap-1 text-sm text-red-300 hover:text-red-200"
              >
                Deployment architecture
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {byoBlocks.map((b) => (
                <div
                  key={b.key}
                  className="group rounded-2xl border border-red-900/40 bg-gradient-to-br from-red-500/[0.06] to-transparent p-6 transition hover:border-red-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/25 bg-red-500/10">
                      <b.icon className="h-5 w-5 text-red-300" />
                    </div>
                    <div className="font-mono text-sm font-semibold tracking-widest text-red-300">
                      {b.key}
                    </div>
                  </div>
                  <div className="mt-5 text-base font-semibold text-white">
                    {b.title}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================= DOMAINS + THREAT FEED ============================= */}
      <section className="relative border-b border-red-950/50 py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeader
              eyebrow="Where Elitze runs"
              title="Every surface. One policy."
              description="From MCP servers to CI pipelines to runtime eBPF, Elitze enforces the same policies, logs to the same graph, and respects the same killswitch."
              leftAlign
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {domainCards.map((d) => (
                <div
                  key={d.title}
                  className="group rounded-xl border border-red-900/40 bg-[#0c060c] p-5 transition hover:border-red-500/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-red-500/30 bg-red-500/10">
                      <d.icon className="h-4 w-4 text-red-300" />
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {d.title}
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    {d.desc}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-red-900/50 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-slate-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:pt-20">
            <ThreatFeed />
          </div>
        </div>
      </section>

      {/* ============================= INTEGRATIONS ============================= */}
      <section
        id="integrations"
        className="relative border-b border-red-950/50 bg-gradient-to-b from-red-950/15 to-transparent py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Connect · Integrations"
            title="Plays nice with the stack you already bet on."
            description="Vaults, clouds, SCMs, gateways, EDRs, SIEMs — Elitze is a unifying layer above the primitives you already operate."
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-red-900/40 bg-[#0a0508]">
            <div className="divide-y divide-red-950/50">
              {integrationRows.map((row) => (
                <div
                  key={row.title}
                  className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[220px_1fr] md:items-center md:gap-8"
                >
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {row.title}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.items.map((i) => (
                      <div
                        key={i.name}
                        className="group inline-flex items-center gap-2 rounded-lg border border-red-900/40 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:border-red-500/45 hover:bg-red-500/[0.07]"
                      >
                        <i.icon className="h-4 w-4 text-red-300" />
                        {i.name}
                        <CheckCircle2 className="h-3 w-3 text-emerald-400/70" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-red-400" /> SOC 2 Type II
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-red-400" /> ISO 27001
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-red-400" /> HIPAA BAA
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-red-400" /> FedRAMP Moderate (in progress)
            </span>
          </div>
        </div>
      </section>

      {/* ============================= INTERFACES ============================= */}
      <section id="interfaces" className="relative border-b border-red-950/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Interfaces"
            title="Chat it. Voice it. Click it. Break it."
            description="Four ways to operate Elitze. Meet Frontier Chat, Voice control, the full production UI, and an adversarial test suite out of the box."
          />
          <div className="mt-14 grid gap-5 lg:grid-cols-4">
            {interfaceBlocks.map((b) => (
              <div
                key={b.title}
                className="group relative overflow-hidden rounded-2xl border border-red-900/40 bg-[#0c060c] p-6"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${b.color} opacity-70`}
                />
                <div className="relative">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10">
                    <b.icon className="h-5 w-5 text-red-200" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300/90">
                    {b.desc}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-red-900/40 pt-4 text-[11px] text-slate-400">
                    <span>{b.meta}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-red-300 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= USE CASES ============================= */}
      <section
        id="use-cases"
        className="relative border-b border-red-950/50 py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Use Cases"
            title="From agent risk to API attacks — and every industry in between."
            description="Agentic AI security, API discovery & inventory, attack-surface reduction, compliance, incident response — plus Agent Reach, DuckDuckGo search, Gods Eye visibility, and Lindy AI governance."
          />
          <div className="mt-12">
            <UseCases />
          </div>
        </div>
      </section>

      {/* ============================= PRIVACY & CDN ============================= */}
      <section className="relative border-b border-red-950/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Privacy"
            title="Cookie settings. CDN controls. No hidden tracking."
            description="Elitze runs a privacy-first edge with no tracking profiles, no personal data caches, and full cookie / CDN / residency transparency."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <CookieSettings />
            <CDNStatus />
          </div>
        </div>
      </section>

      {/* ============================= SMART APPS ============================= */}
      <section className="relative border-b border-red-950/50 bg-gradient-to-b from-red-950/15 to-transparent py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Smart Apps · Data Hub"
            title="Intelligence flows through apps — not reports."
            description="Smart Apps run agentic security workflows. AI-Augmented Dashboards explain risk shifts with evidence. The Data Hub feeds both with live streams from the security graph, CVE feeds, gateways, HITL queues, and audit evidence."
          />
          <div className="mt-12">
            <SmartApps />
          </div>
        </div>
      </section>

      {/* ============================= SMART CHAT HIERARCHY ============================= */}
      <section className="relative border-b border-red-950/50 bg-gradient-to-b from-red-950/15 to-transparent py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Agent Hierarchy"
            title="Top agents · reasoning · skills · security"
            description="Judge Elitze (singular reasoning) governs Agent Reach (recursive search), Gods Eye (singular vision), Lindy AI (recursive automation), Graphics Security (mythos visual skills), Recursive Agent (recursive self-improvement), Singularity (universal transfer), Universal AI (cross-domain synthesis), and Maximum Agent (throughput-maximized execution). Every agent runs LangGraph + Bini Claws sandbox."
          />
          <div className="mt-12">
            <SmartChatHierarchy />
          </div>
        </div>
      </section>

      {/* ============================= MARKET INTEL ============================= */}
      <section
        id="market"
        className="relative border-b border-red-950/50 bg-gradient-to-b from-red-950/20 to-transparent py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="Market · Research-backed"
            title="What's missing. What buyers ask for. What puts us over the top."
            description="Live product intelligence from 2026 buyer checklists, OWASP ASI, Gartner AI Security Platforms, NIST agent standards, and the governance–containment gap. Seeded into Postgres — interactive, not a slide deck."
          />
          <div className="mt-12">
            <MarketIntel />
          </div>
        </div>
      </section>

      {/* ============================= MISSING FROM MARKET ============================= */}
      <section id="missing" className="relative border-b border-red-950/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-red-400">What the market is missing</div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">What's missing · What they're needing · What's over the top</h2>
            </div>
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20">
              Talk to security engineering <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="mt-8">
            <MissingFromMarket />
          </div>
        </div>
      </section>

      {/* ============================= CTA ============================= */}
      <section className="relative overflow-hidden py-24">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-red-500/40 eye-pulse">
              <Image
                src="/images/elitze-logo.png"
                alt="Elitze"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          </div>
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
            <Lock className="h-3 w-3" />
            Self-host or SaaS. Your keys, your models, your providers.
          </div>
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Ship autonomous agents without the autonomous risks.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
            Connect your first repo in under 10 minutes. Guardrails live in
            staging today. Killswitch ready when you need it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#trial"
              className="inline-flex items-center gap-2 rounded-md bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] transition hover:bg-red-400"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-red-500/10"
            >
              Talk to sales
            </a>
          </div>
        </div>
      </section>

      {/* ============================= FOOTER ============================= */}
      <footer className="border-t border-red-950/50 bg-[#050208] py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={34} />
              <div className="leading-tight">
                <div className="text-[15px] font-semibold text-white">
                  Elitze<span className="text-red-400">.</span>
                </div>
                <div className="-mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-red-400/80">
                  Agentic Security
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-slate-400">
              The agentic security platform. Graph. Intelligence. Policy.
              Guardrails. Sandbox. Killswitch.
            </p>
          </div>
          <FooterCol
            title="Platform"
            items={[
              "Security Graph",
              "Policy Engine",
              "Guardrails",
              "Sandbox",
              "Killswitch",
            ]}
          />
          <FooterCol
            title="Use Cases"
            items={[
              "Agentic AI Security",
              "API Discovery",
              "Stop API Attacks",
              "Gods Eye",
              "Lindy AI Governance",
            ]}
          />
          <FooterCol
            title="Privacy"
            items={["Cookie Settings", "Data Residency", "CDN Policy", "Audit Logs", "DPA"]}
          />
          <FooterCol
            title="Company"
            items={["About", "Customers", "Careers", "Security", "Contact"]}
          />
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-start justify-between gap-2 border-t border-red-950/50 px-6 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Elitze · Agentic Security</div>
          <div className="flex items-center gap-2 font-mono">
            <span className="h-2 w-2 rounded-full bg-red-400 pulse-soft" />
            All systems operational
          </div>
        </div>
      </footer>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small components                                                           */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  eyebrow,
  title,
  description,
  leftAlign,
}: {
  eyebrow: string;
  title: string;
  description: string;
  leftAlign?: boolean;
}) {
  return (
    <div className={leftAlign ? "" : "mx-auto max-w-3xl text-center"}>
      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-red-300">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p
        className={`mt-4 text-base leading-relaxed text-slate-400 ${
          leftAlign ? "max-w-2xl" : "mx-auto max-w-2xl"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function CodeCard({
  icon: Icon,
  title,
  lines,
}: {
  icon: LucideIcon;
  title: string;
  lines: { t: string; c: "emerald" | "rose" | "amber" | "red" | "slate" }[];
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    amber: "text-amber-300",
    red: "text-red-300",
    slate: "text-slate-400",
  };
  return (
    <div className="group relative overflow-hidden rounded-xl border border-red-900/40 bg-black/50">
      <div className="flex items-center justify-between border-b border-red-950/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-red-300" />
          <span className="text-xs font-medium text-slate-200">{title}</span>
        </div>
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500/60" />
          <span className="h-2 w-2 rounded-full bg-amber-400/60" />
          <span className="h-2 w-2 rounded-full bg-red-400/60" />
        </div>
      </div>
      <div className="p-4 font-mono text-[11.5px] leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className={colorMap[l.c]}>
            {l.t}
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-300">
        {title}
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-400">
        {items.map((i) => (
          <li key={i} className="transition hover:text-red-300">
            <a href="#">{i}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
