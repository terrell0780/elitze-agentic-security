"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDot, ExternalLink, KeyRound, RefreshCw, Save, ShieldCheck, Zap } from "lucide-react";

type Connection = {
  id: string;
  name: string;
  kind: string;
  protocol: string;
  baseUrl: string;
  model: string | null;
  provider?: { provider?: string; secretStored?: boolean; clientExposure?: string };
  enabled: boolean;
  createdAt: string;
};
type ConnectionList = { ok: boolean; connections: Connection[]; error?: string };
type ProbeResult = { ok: boolean; status: string; modelIds?: string[]; modelName?: string; checkedAt?: string; errorCode?: string; error?: string };

export default function IntegrationsConsole() {
  const router = useRouter();
  const [list, setList] = useState<ConnectionList | null>(null);
  const [busy, setBusy] = useState<"load" | "save" | "probe" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("ELITZE NVIDIA NIM");
  const [baseUrl, setBaseUrl] = useState("https://integrate.api.nvidia.com/v1");
  const [model, setModel] = useState("");
  const [secret, setSecret] = useState("");
  const [probe, setProbe] = useState<ProbeResult | null>(null);

  const load = useCallback(async () => {
    setBusy("load");
    setError(null);
    try {
      const response = await fetch("/api/ai/connections", { cache: "no-store" });
      if (response.status === 401) { router.replace("/login?next=%2Fconsole%2Fintegrations"); return; }
      const data = await response.json() as ConnectionList;
      if (!response.ok || !data.ok) throw new Error(data.error ?? "integration_list_unavailable");
      setList(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "integration_list_unavailable");
    } finally { setBusy(null); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("save"); setError(null); setSuccess(null); setProbe(null);
    try {
      const response = await fetch("/api/ai/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, kind: "model", baseUrl, model, secret, provider: "NVIDIA_NIM" }),
      });
      const data = await response.json() as { ok: boolean; error?: string; connection?: { name?: string } };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "nim_connection_save_failed");
      setSecret("");
      setSuccess("Credential encrypted and connection stored. The endpoint is not marked CONNECTED until a live probe succeeds.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "nim_connection_save_failed");
    } finally { setBusy(null); }
  }

  async function probeNim() {
    setBusy("probe"); setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/console/agentic-soc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "probe-nim" }),
      });
      const data = await response.json() as ProbeResult;
      setProbe(data);
      if (!response.ok || !data.ok) throw new Error(data.errorCode ?? data.error ?? "nim_probe_failed");
      setSuccess("Live NVIDIA NIM /v1/models probe succeeded for the selected connection.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "nim_probe_failed");
    } finally { setBusy(null); await load(); }
  }

  const connections = list?.connections ?? [];
  const nimConnections = connections.filter((item) => item.provider?.provider === "NVIDIA_NIM" || item.name.toLowerCase().includes("nvidia nim") || item.baseUrl.includes("integrate.api.nvidia.com"));

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 sm:px-7">
          <Link href="/console" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5"/></span><span><b className="block text-sm tracking-[.12em]">ELITZE</b><span className="block text-[8px] uppercase tracking-[.22em] text-[var(--muted)]">Integration control plane</span></span></Link>
          <nav className="flex flex-wrap items-center gap-2 text-xs"><Link href="/console/agentic-soc" className="rounded-lg border border-[var(--border)] px-3 py-2">Agentic SOC</Link><Link href="/console/threat-detection" className="rounded-lg border border-[var(--border)] px-3 py-2">Threat detection</Link><button type="button" onClick={() => void load()} disabled={busy !== null} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-50"><RefreshCw className={"h-3.5 w-3.5 " + (busy === "load" ? "animate-spin" : "")}/>Refresh</button></nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7">
        <section className="rounded-[28px] border border-cyan-300/15 bg-[#06111d] p-6 text-white sm:p-8">
          <div className="text-[9px] font-bold uppercase tracking-[.24em] text-cyan-200">Authorized provider setup</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Connect the real model.<br/><span className="text-cyan-300">Prove the endpoint.</span></h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Provider configuration, encrypted credentials, endpoint reachability, selected-model availability and successful inference are separate states. ELITZE does not infer CONNECTED from the presence of a key.</p>
        </section>

        {error && <div role="alert" className="mt-4 flex items-center gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[.04] p-4 text-sm text-rose-100"><AlertTriangle className="h-4 w-4 shrink-0"/>{error}</div>}
        {success && <div role="status" className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[.04] p-4 text-sm text-cyan-100"><CheckCircle2 className="h-4 w-4 shrink-0"/>{success}</div>}

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
          <form onSubmit={save} className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-6">
            <div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-[var(--accent)]"/><h2 className="text-lg font-semibold">NVIDIA NIM endpoint</h2></div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">The hosted NVIDIA endpoint uses a bearer API key. The key is sent over HTTPS to the app server and encrypted before storage. It is not returned by the list endpoint.</p>
            <label className="mt-5 block text-xs font-semibold">Connection name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={160} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm outline-none focus:border-[var(--accent-border)]"/></label>
            <label className="mt-4 block text-xs font-semibold">NIM base URL<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required type="url" pattern="https://.+" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm outline-none focus:border-[var(--accent-border)]"/></label>
            <p className="mt-1 text-[10px] text-[var(--muted)]">Use a trusted HTTPS origin and a base path ending in /v1, for example integrate.api.nvidia.com/v1.</p>
            <label className="mt-4 block text-xs font-semibold">Exact model ID<input value={model} onChange={(e) => setModel(e.target.value)} required maxLength={160} placeholder="Copy an exact available model ID after checking NVIDIA NIM" className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm outline-none focus:border-[var(--accent-border)]"/></label>
            <label className="mt-4 block text-xs font-semibold">NVIDIA API key<input value={secret} onChange={(e) => setSecret(e.target.value)} required type="password" autoComplete="new-password" maxLength={8000} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-3 text-sm outline-none focus:border-[var(--accent-border)]"/></label>
            <div className="mt-5 flex flex-wrap gap-3"><button type="submit" disabled={busy !== null || !model.trim() || !secret} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"><Save className="h-4 w-4"/>{busy === "save" ? "Saving encrypted connection…" : "Save connection"}</button><button type="button" onClick={() => void probeNim()} disabled={busy !== null || nimConnections.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold disabled:opacity-40"><Zap className="h-4 w-4"/>{busy === "probe" ? "Testing endpoint…" : "Probe saved connection"}</button></div>
            <div className="mt-4 text-[10px] leading-5 text-[var(--muted)]">Setup uses the tenant&apos;s authenticated AI-connection store. This screen does not create test events, findings or usage metrics.</div>
          </form>

          <div className="space-y-4">
            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Saved connections</h2><span className="text-xs text-[var(--muted)]">{connections.length} enabled</span></div>
              {connections.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-4 text-xs leading-5 text-[var(--muted)]">No enabled model, agent or bot connections were returned by the tenant-scoped API. This is NOT_CONFIGURED, not an error-free integration.</p> :
                <div className="mt-4 space-y-3">{connections.map((connection) => <div key={connection.id} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{connection.name}</h3><p className="mt-1 break-all font-mono text-[10px] text-[var(--muted)]">{connection.baseUrl}</p></div><span className="rounded-full border border-[var(--border)] px-2 py-1 text-[8px] font-bold uppercase">{connection.enabled ? "Enabled" : "Disabled"}</span></div><div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[var(--muted)]"><span>{connection.kind}</span><span>{connection.provider?.provider ?? connection.protocol}</span><span>Model: {connection.model ?? "NOT_CONFIGURED"}</span><span>Secret: {connection.provider?.secretStored ? "stored encrypted" : "status unknown"}</span></div></div>)}</div>}
            </article>
            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5">
              <h2 className="text-lg font-semibold">Latest NIM probe</h2>
              {probe ? <><div className="mt-3 flex items-center gap-2 text-sm"><CircleDot className={"h-4 w-4 " + (probe.ok ? "text-cyan-300" : "text-rose-300")}/>{probe.status}</div><p className="mt-2 break-words text-xs text-[var(--muted)]">{probe.errorCode ?? probe.modelName ?? "No model ID returned."}</p><div className="mt-2 text-[10px] text-[var(--muted)]">Checked: {probe.checkedAt ?? "UNKNOWN"}</div>{probe.modelIds?.length ? <div className="mt-3 max-h-36 overflow-auto rounded-xl border border-[var(--border)] p-3">{probe.modelIds.map((id) => <button key={id} type="button" onClick={() => setModel(id)} className="block w-full truncate py-1 text-left font-mono text-[10px] text-[var(--accent)] hover:underline">{id}</button>)}</div> : null}</> : <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Probe results appear here only after the live endpoint check runs. No saved key is revealed to the browser.</p>}
            </article>
            <article className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5">
              <h2 className="text-sm font-semibold">Integration truth states</h2>
              <div className="mt-3 space-y-2 text-xs"><p><b>NOT_CONFIGURED:</b> no enabled connection.</p><p><b>CONFIGURED:</b> credentials stored; runtime not proved.</p><p><b>CONNECTED:</b> current provider probe succeeded.</p><p><b>ERROR:</b> provider probe or stored configuration failed.</p></div>
              <Link href="/integrations" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">Integration requirements <ExternalLink className="h-3.5 w-3.5"/></Link>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
