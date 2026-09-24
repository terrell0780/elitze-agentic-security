"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Hash, MessageSquare, Plus, RefreshCw, Send, ShieldCheck, Users } from "lucide-react";

type Channel = { id: number; name: string; description: string | null; channelType: string };
type Message = { id: number; authorId: string; authorType: string; body: string; linkedDecisionId: number | null; linkedEvidenceId: number | null; createdAt: string };

export default function TeamCollaboration() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [channelName, setChannelName] = useState("");
  const [status, setStatus] = useState("Authenticating team session");
  const [busy, setBusy] = useState(false);

  const loadChannels = useCallback(async () => {
    const response = await fetch("/api/team", { cache: "no-store" });
    const payload = await response.json() as { ok?: boolean; channels?: Channel[]; error?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Team unavailable");
    setChannels(payload.channels || []);
    setStatus("Team connected");
    setSelected((current) => current ?? payload.channels?.[0]?.id ?? null);
  }, []);
  }

  async function loadMessages(channelId: number) {
    const response = await fetch(`/api/team/messages?channelId=${channelId}`, { cache: "no-store" });
    const payload = await response.json() as { ok?: boolean; messages?: Message[]; error?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.error || "Messages unavailable");
    setMessages(payload.messages || []);
  }

  useEffect(() => {
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
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Sign in to access tenant team channels.");
        }
        await loadChannels();
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Sign in to access tenant team channels.");
      } finally {
        setBusy(false);
      }
    };

    const initial = window.setTimeout(() => { void establishSession(); }, 0);
    return () => window.clearTimeout(initial);
  }, [loadChannels]);

  useEffect(() => {
    if (!selected) return;
    const channelId = selected;
    const initial = window.setTimeout(() => {
      void loadMessages(channelId).catch((error) => setStatus(error instanceof Error ? error.message : "Messages unavailable"));
    }, 0);
    return () => window.clearTimeout(initial);
  }, [selected]);

  async function createChannel() {
    if (!channelName.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/team", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: channelName, channelType: "team" }) });
      const payload = await response.json() as { ok?: boolean; channel?: Channel; error?: string };
      if (!response.ok || !payload.ok || !payload.channel) throw new Error(payload.error || "Unable to create channel");
      setChannels((current) => [...current, payload.channel!]);
      setSelected(payload.channel.id);
      setChannelName("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Channel creation failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selected || !body.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/team/messages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ channelId: selected, body }) });
      const payload = await response.json() as { ok?: boolean; message?: Message; error?: string };
      if (!response.ok || !payload.ok || !payload.message) throw new Error(payload.error || "Unable to send message");
      setMessages((current) => [...current, payload.message!]);
      setBody("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Message failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
      <header className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
        <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">ELITZE Team Command</h2>
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Chat, incident coordination, decisions and evidence</p>
        </div>
        <span className="ml-auto flex items-center gap-2 text-[10px] text-slate-500"><Users className="h-3 w-3" />{status}</span>
      </header>

      <div className="grid lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-white/7 p-4 lg:border-b-0 lg:border-r">
          {status !== "Team connected" && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-xs text-[var(--muted-strong)]">
              {busy ? "Authenticating against the ELITZE session…" : status}
              <button type="button" onClick={() => window.location.reload()} className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] text-[var(--text)] hover:bg-white/[0.03]">Retry</button>
            </div>
          )}

          {status === "Team connected" && (
            <>
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500"><Hash className="h-3 w-3" />Channels</div>
              <div className="space-y-1">
                {channels.map((channel) => <button key={channel.id} onClick={() => setSelected(channel.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${selected === channel.id ? "bg-[var(--accent)]/10 text-white" : "text-[var(--muted-strong)] hover:bg-white/[0.03]"}`}><Hash className="h-3 w-3" />{channel.name}</button>)}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="New channel" className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-2 py-1.5 text-[11px] text-white outline-none" maxLength={160} />
                <button onClick={createChannel} disabled={busy} aria-label="Create channel" className="rounded-lg border border-white/10 px-2 text-[var(--text)] disabled:opacity-50"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <button onClick={() => selected && void loadMessages(selected)} className="mt-3 flex items-center gap-2 text-[10px] text-[var(--muted)] hover:text-slate-300"><RefreshCw className="h-3 w-3" />Refresh</button>
            </>
          )}
        </aside>

        <div className="flex min-h-[360px] flex-col">
          <div className="flex-1 space-y-3 overflow-auto p-5">
            {selected && messages.map((message) => (
              <article key={message.id} className="rounded-xl border border-white/7 bg-[var(--panel-strong)] p-3">
                <div className="flex items-center gap-2 text-[10px] text-slate-500"><span className="font-medium text-white">{message.authorId}</span><span>{message.authorType}</span><span className="ml-auto">{new Date(message.createdAt).toLocaleString()}</span></div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{message.body}</p>
                {(message.linkedDecisionId || message.linkedEvidenceId) && <div className="mt-2 flex items-center gap-2 text-[10px] text-red-300"><ShieldCheck className="h-3 w-3" />Security-linked message {message.linkedDecisionId ? `· decision ${message.linkedDecisionId}` : ""}{message.linkedEvidenceId ? ` · evidence ${message.linkedEvidenceId}` : ""}</div>}
              </article>
            ))}
            {selected && messages.length === 0 && <div className="flex h-full min-h-[250px] items-center justify-center text-xs text-slate-600">No messages recorded in this channel.</div>}
            {!selected && <div className="flex h-full min-h-[250px] items-center justify-center text-xs text-slate-600">Sign in to access tenant team channels.</div>}
          </div>
          {selected && (
            <form onSubmit={sendMessage} className="border-t border-white/7 p-4">
              <div className="flex gap-2">
                <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message the security team…" rows={2} maxLength={10000} className="min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600" />
                <button disabled={busy || !body.trim()} aria-label="Send message" className="self-end rounded-xl bg-red-500 p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
