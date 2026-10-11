"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Hash, MessageSquare, Paperclip, Plus, RefreshCw, Send, ShieldCheck, Users } from "lucide-react";
import VoiceRoom from "@/components/voice-room";

type Channel = { id: number; name: string; description: string | null; channelType: string };
type Attachment = { id: string; fileName: string; contentType: string; sizeBytes: number; sha256: string; scanState: string };
type Message = {
  id: number;
  authorId: string;
  authorType: string;
  body: string;
  linkedDecisionId: number | null;
  linkedEvidenceId: number | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type TeamResponse = { ok?: boolean; channels?: Channel[]; channel?: Channel; error?: string };
type MessagesResponse = { ok?: boolean; messages?: Message[]; message?: Message; error?: string };

function attachmentIds(message: Message) {
  const value = message.metadata?.attachmentIds;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default function TeamCollaboration() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [channelName, setChannelName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("Authenticating team session");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadChannels = useCallback(async () => {
    const response = await fetch("/api/team", { cache: "no-store" });
    const payload = await response.json() as TeamResponse;
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Team data is unavailable.");
    const next = payload.channels ?? [];
    setChannels(next);
    setSelected((current) => current && next.some((channel) => channel.id === current) ? current : next[0]?.id ?? null);
    setStatus("Team connected");
  }, []);

  const loadMessages = useCallback(async (channelId: number) => {
    const response = await fetch("/api/team/messages?channelId=" + channelId, { cache: "no-store" });
    const payload = await response.json() as MessagesResponse;
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Team messages are unavailable.");
    setMessages(payload.messages ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    const establishSession = async () => {
      setBusy(true);
      try {
        const response = await fetch("/api/team/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
          cache: "no-store",
        });
        const payload = await response.json() as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error || "Sign in to access tenant team channels.");
        if (active) await loadChannels();
      } catch (error) {
        if (active) setStatus(error instanceof Error ? error.message : "Sign in to access tenant team channels.");
      } finally {
        if (active) setBusy(false);
      }
    };
    const timer = window.setTimeout(() => void establishSession(), 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [loadChannels]);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    const id = selected;
    const initial = window.setTimeout(() => void loadMessages(id).catch(() => undefined), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadMessages(id).catch(() => undefined);
    }, 1500);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [selected, loadMessages]);

  async function createChannel() {
    const name = channelName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, channelType: "team" }),
      });
      const payload = await response.json() as TeamResponse;
      if (!response.ok || !payload.ok || !payload.channel) throw new Error(payload.error || "Unable to create channel.");
      setChannels((current) => current.concat(payload.channel as Channel));
      setSelected(payload.channel.id);
      setChannelName("");
      setStatus("Team connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Channel creation failed.");
    } finally { setBusy(false); }
  }

  function onFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const next = Array.from(event.target.files ?? []);
    setFiles(next.slice(0, 6));
  }

  async function uploadFiles() {
    if (!selected || files.length === 0) return [];
    const form = new FormData();
    form.set("channelId", String(selected));
    for (const file of files) form.append("files", file, file.name);
    const response = await fetch("/api/chat/files", { method: "POST", body: form });
    const payload = await response.json() as { ok?: boolean; attachments?: Attachment[]; error?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.error || "File upload failed.");
    return payload.attachments ?? [];
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = body.trim();
    if (!selected || (!content && files.length === 0) || busy) return;

    setBusy(true);
    try {
      const uploaded = await uploadFiles();
      const response = await fetch("/api/team/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channelId: selected,
          body: content || "Attachment",
          metadata: uploaded.length ? {
            attachmentIds: uploaded.map((item) => item.id),
            attachmentNames: uploaded.map((item) => item.fileName),
            attachmentScanStates: uploaded.map((item) => item.scanState),
          } : {},
        }),
      });
      const payload = await response.json() as MessagesResponse;
      if (!response.ok || !payload.ok || !payload.message) throw new Error(payload.error || "Unable to send message.");
      setMessages((current) => current.concat(payload.message as Message));
      setBody("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      setStatus("Team connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Message failed.");
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-5 py-4">
        <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">ELITZE Team Command</h2>
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Realtime collaboration · attachments · governed voice</p>
        </div>
        <span className="ml-auto flex items-center gap-2 text-[10px] text-[var(--muted)]"><Users className="h-3 w-3" />{status}</span>
      </header>

      <div className="grid lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[var(--border)] p-4 lg:border-b-0 lg:border-r">
          {status !== "Team connected" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-xs text-[var(--muted-strong)]">
              {busy ? "Authenticating against the ELITZE session…" : status}
              <button type="button" onClick={() => window.location.reload()} className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] text-[var(--text)]">Retry</button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--muted)]"><Hash className="h-3 w-3" />Channels</div>
              <div className="space-y-1">
                {channels.map((channel) => (
                  <button key={channel.id} type="button" onClick={() => setSelected(channel.id)} className={"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs " + (selected === channel.id ? "bg-[var(--accent)]/10 text-[var(--text)]" : "text-[var(--muted-strong)] hover:bg-white/[0.03]")}>
                    <Hash className="h-3 w-3" />{channel.name}
                  </button>
                ))}
                {channels.length === 0 && <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center text-[10px] text-[var(--muted)]">No tenant channels recorded.</div>}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={channelName} onChange={(event) => setChannelName(event.target.value)} placeholder="New channel" maxLength={160} className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-2 py-1.5 text-[11px] text-[var(--text)] outline-none" />
                <button type="button" onClick={() => void createChannel()} disabled={busy} aria-label="Create channel" className="rounded-lg border border-[var(--border)] px-2 text-[var(--muted-strong)] disabled:opacity-50"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <button type="button" onClick={() => selected && void loadMessages(selected).catch(() => undefined)} className="mt-3 flex items-center gap-2 text-[10px] text-[var(--muted)]"><RefreshCw className="h-3 w-3" />Refresh</button>
            </>
          )}
        </aside>

        <div className="flex min-h-[430px] flex-col">
          <div className="flex-1 space-y-3 overflow-auto p-5">
            {selected && messages.map((message) => {
              const ids = attachmentIds(message);
              return (
                <article key={message.id} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3">
                  <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                    <span className="font-medium text-[var(--text)]">{message.authorId}</span>
                    <span>{message.authorType}</span>
                    <span className="ml-auto">{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{message.body}</p>
                  {ids.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {ids.map((id, index) => {
                        const names = Array.isArray(message.metadata?.attachmentNames) ? message.metadata?.attachmentNames : [];
                        const name = typeof names[index] === "string" ? names[index] : "Attachment " + (index + 1);
                        return <a key={id} href={"/api/chat/files/" + encodeURIComponent(id)} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-[11px] text-[var(--accent)] hover:bg-[var(--accent-soft)]"><Paperclip className="h-3 w-3" />{name}</a>;
                      })}
                    </div>
                  )}
                  {(message.linkedDecisionId || message.linkedEvidenceId) && <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--accent)]"><ShieldCheck className="h-3 w-3" />Security-linked message{message.linkedDecisionId ? " · decision " + message.linkedDecisionId : ""}{message.linkedEvidenceId ? " · evidence " + message.linkedEvidenceId : ""}</div>}
                </article>
              );
            })}
            {selected && messages.length === 0 && <div className="flex h-full min-h-[250px] items-center justify-center text-xs text-[var(--muted)]">No messages recorded in this tenant channel.</div>}
            {!selected && <div className="flex h-full min-h-[250px] items-center justify-center text-xs text-[var(--muted)]">Sign in to access tenant team channels.</div>}
          </div>

          {selected && (
            <form onSubmit={sendMessage} className="border-t border-[var(--border)] p-4">
              {files.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{files.map((file) => <span key={file.name + file.size} className="rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-2 py-1 text-[10px] text-[var(--muted-strong)]">{file.name}</span>)}</div>}
              <div className="flex gap-2">
                <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Message the security team…" rows={2} maxLength={10000} className="min-w-0 flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]" />
                <input ref={inputRef} type="file" multiple className="hidden" onChange={onFiles} />
                <button type="button" onClick={() => inputRef.current?.click()} aria-label="Attach files" className="self-end rounded-xl border border-[var(--border)] p-3 text-[var(--muted-strong)]"><FileUp className="h-4 w-4" /></button>
                <button type="submit" disabled={busy || (!body.trim() && files.length === 0)} aria-label="Send message" className="self-end rounded-xl bg-[var(--accent)] p-3 text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[9px] text-[var(--muted)]"><Paperclip className="h-3 w-3" />Up to 6 files, 10 MB each. Executable/script extensions are blocked. Malware scanning is shown as NOT_CONFIGURED until a real scanner is connected.</div>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border)] p-4"><VoiceRoom channelId={selected} /></div>
    </section>
  );
}
