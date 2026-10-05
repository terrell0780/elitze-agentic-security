"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, FileUp, KeyRound, LockKeyhole, Paperclip, Send, Settings2, ShieldCheck } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; connectionState?: string; attachmentIds?: string[] };
type Connection = { id: string; name: string; kind: string; protocol: string; baseUrl: string; model: string | null };

const dataClasses = ["public", "internal", "confidential", "restricted"] as const;

export default function GovernedChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [input, setInput] = useState("");
  const [dataClass, setDataClass] = useState<(typeof dataClasses)[number]>("internal");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Checking governed chat");
  const [showSetup, setShowSetup] = useState(false);
  const [setup, setSetup] = useState({ name: "", kind: "model", baseUrl: "", model: "", secret: "" });
  const [channelId, setChannelId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadConnections() {
    try {
      const response = await fetch("/api/ai/connections", { cache: "no-store" });
      const payload = await response.json() as { ok?: boolean; connections?: Connection[]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "AI connection inventory unavailable");
      const next = payload.connections ?? [];
      setConnections(next);
      setConnectionId((current) => current || next[0]?.id || "");
      setStatus(next.length ? "AI route available" : "No tenant AI connection selected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "AI connection inventory unavailable");
    }
  }

  useEffect(() => {
    const initialize = async () => {
      try {
        await fetch("/api/team/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
          cache: "no-store",
        });
        const response = await fetch("/api/team", { cache: "no-store" });
        const payload = await response.json() as { ok?: boolean; channels?: Array<{ id: number; channelType: string }> };
        if (response.ok && payload.ok) {
          setChannelId(payload.channels?.find((channel) => channel.channelType === "assistant")?.id ?? null);
        }
      } catch {}
      await loadConnections();
    };
    void initialize();
  }, []);

  async function createConnection(event: FormEvent) {
    event.preventDefault();
    if (!setup.name.trim() || !setup.baseUrl.trim() || !setup.secret) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ai/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: setup.name,
          kind: setup.kind,
          baseUrl: setup.baseUrl,
          model: setup.model || undefined,
          secret: setup.secret,
        }),
      });
      const payload = await response.json() as { ok?: boolean; connection?: Connection; error?: string };
      if (!response.ok || !payload.ok || !payload.connection) throw new Error(payload.error || "Connection setup failed.");
      const created = payload.connection as Connection;
      setConnections((current) => [created, ...current]);
      setConnectionId(created.kind === "model" ? created.id : "");
      setSetup({ name: "", kind: "model", baseUrl: "", model: "", secret: "" });
      setShowSetup(false);
      setStatus(created.kind === "model"
        ? "Tenant model connection stored and selectable"
        : "Tenant connection stored; its invocation adapter is not enabled in ELITZE Chat");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Connection setup failed.");
    } finally { setBusy(false); }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if ((!message && files.length === 0) || busy) return;

    setBusy(true);
    setStatus("Policy evaluation…");

    try {
      const form = new FormData();
      if (!channelId) throw new Error("ELITZE chat channel is unavailable. No attachment was uploaded.");
      form.set("channelId", String(channelId));
      for (const file of files) form.append("files", file, file.name);
      let attachmentIds: string[] = [];
      if (files.length) {
        const upload = await fetch("/api/chat/files", { method: "POST", body: form });
        const uploadPayload = await upload.json() as { ok?: boolean; attachments?: Array<{ id: string }>; error?: string };
        if (!upload.ok || !uploadPayload.ok) throw new Error(uploadPayload.error || "Attachment upload failed.");
        attachmentIds = (uploadPayload.attachments ?? []).map((item) => item.id);
      }

      setMessages((current) => [...current, { role: "user", content: message || "Attachment", attachmentIds }]);
      setInput("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: message || "Review the attached material.",
          dataClass,
          channelId: channelId ?? undefined,
          connectionId: connectionId || undefined,
          attachmentIds,
        }),
      });
      const payload = await response.json() as { ok?: boolean; answer?: string; state?: string; error?: string; connectionState?: string; sources?: Array<{ citation: string }> };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "No response generated.");
      setMessages((current) => [...current, { role: "assistant", content: payload.answer || "No assistant content returned.", connectionState: payload.connectionState }]);
      setStatus(payload.state === "GENERATED" ? "Generated under ELITZE policy" : payload.state || "Generated");
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "No response generated." }]);
      setStatus("Unavailable");
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-[var(--accent-border)] bg-[var(--panel)] shadow-[0_30px_120px_rgba(10,170,255,.08)]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)]"><Bot className="h-4 w-4 text-[var(--accent)]" /></div>
        <div><h2 className="text-sm font-semibold">ELITZE Governed Chat</h2><p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">AI workspace · BYOK / BYOA / BYOB · policy before generation</p></div>
        <span className="ml-auto text-[10px] text-[var(--muted)]">{status}</span>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="p-5 sm:p-6">
          <div className="min-h-[420px] max-h-[620px] space-y-4 overflow-auto rounded-2xl border border-[var(--border)] bg-black/20 p-4">
            {messages.length === 0 && <div className="flex min-h-[360px] items-center justify-center text-center"><div><ShieldCheck className="mx-auto h-7 w-7 text-[var(--accent)]" /><p className="mt-3 text-sm font-semibold">Governed conversation surface</p><p className="mt-2 max-w-md text-xs leading-5 text-[var(--muted)]">No message is generated until the tenant policy boundary allows the request and a real AI route is configured.</p></div></div>}
            {messages.map((message, index) => (
              <article key={index} className={"rounded-2xl border p-4 " + (message.role === "user" ? "border-white/10 bg-white/[0.03]" : "border-[var(--accent-border)] bg-[var(--accent-soft)]")}>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-[var(--muted)]"><span>{message.role === "user" ? "You" : "ELITZE"}</span>{message.connectionState && <span>· {message.connectionState}</span>}</div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-strong)]">{message.content}</p>
                {message.attachmentIds?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.attachmentIds.map((id) => <a key={id} href={"/api/chat/files/" + encodeURIComponent(id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--accent)]"><Paperclip className="h-3 w-3" />download</a>)}</div> : null}
              </article>
            ))}
          </div>

          <form onSubmit={send} className="mt-4">
            {files.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{files.map((file) => <span key={file.name + file.size} className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted-strong)]">{file.name}</span>)}</div>}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} maxLength={20000} rows={3} placeholder="Investigate an agent, review a control, explain an event, test a policy…" className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-[var(--muted)]" />
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-2">
                <select value={dataClass} onChange={(e) => setDataClass(e.target.value as typeof dataClass)} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider outline-none">
                  {dataClasses.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))} />
                <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold"><FileUp className="h-3.5 w-3.5" />Attach</button>
                <button disabled={busy || (!input.trim() && files.length === 0)} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"><Send className="h-3.5 w-3.5" />{busy ? "Working" : "Send"}</button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[9px] text-[var(--muted)]"><LockKeyhole className="h-3 w-3" />Tenant isolation · policy gate · evidence-aware output · external content treated as untrusted</div>
          </form>
        </div>

        <aside className="border-t border-[var(--border)] bg-black/10 p-5 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--accent)]"><Settings2 className="h-3.5 w-3.5" />AI route</div>
          <select value={connectionId} onChange={(e) => setConnectionId(e.target.value)} className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2.5 text-xs outline-none">
            <option value="">Use ELITZE server gateway</option>
            {connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.name} · {connection.kind.toUpperCase()}</option>)}
          </select>
          <button type="button" onClick={() => setShowSetup((value) => !value)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-2.5 text-xs font-semibold text-[var(--accent)]"><KeyRound className="h-3.5 w-3.5" />{showSetup ? "Close connection setup" : "Add BYOK / BYOA / BYOB"}</button>

          {showSetup && (
            <form onSubmit={createConnection} className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3">
              <input value={setup.name} onChange={(e) => setSetup({ ...setup, name: e.target.value })} placeholder="Connection name" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-2.5 py-2 text-xs outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select value={setup.kind} onChange={(e) => setSetup({ ...setup, kind: e.target.value })} className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-2 text-xs"><option value="model">Model</option><option value="agent">Agent</option><option value="bot">Bot</option></select>
                <input value={setup.model} onChange={(e) => setSetup({ ...setup, model: e.target.value })} placeholder="Model ID" className="rounded-lg border border-[var(--border)] bg-transparent px-2 py-2 text-xs outline-none" />
              </div>
              <input value={setup.baseUrl} onChange={(e) => setSetup({ ...setup, baseUrl: e.target.value })} placeholder="https://provider.example/v1" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-2.5 py-2 text-xs outline-none" />
              <input value={setup.secret} onChange={(e) => setSetup({ ...setup, secret: e.target.value })} type="password" placeholder="API key / secret" className="w-full rounded-lg border border-[var(--border)] bg-transparent px-2.5 py-2 text-xs outline-none" />
              <button disabled={busy} className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-bold text-slate-950">Store encrypted</button>
              <p className="text-[9px] leading-4 text-[var(--muted)]">Secret is stored server-side with AES-256-GCM and is never returned to the browser.</p>
            </form>
          )}

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3 text-[10px] leading-5 text-[var(--muted)]">
            <div className="flex items-center gap-2 text-[var(--text)]"><ChevronDown className="h-3 w-3 text-[var(--accent)]" />Execution boundary</div>
            <div className="mt-2">Model output is not trusted security evidence. Retrieved material is untrusted context. Sensitive actions remain subject to ELITZE policy.</div>
          </div>
        </aside>
      </div>
    </section>
  );
}
