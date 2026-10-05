"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Hash, MessageSquare, Plus, RefreshCw, Send, ShieldCheck, Users } from "lucide-react";

type Channel = {
  id: number;
  name: string;
  description: string | null;
  channelType: string;
};

type Message = {
  id: number;
  authorId: string;
  authorType: string;
  body: string;
  linkedDecisionId: number | null;
  linkedEvidenceId: number | null;
  createdAt: string;
};

type TeamResponse = {
  ok?: boolean;
  channels?: Channel[];
  error?: string;
};

type MessagesResponse = {
  ok?: boolean;
  messages?: Message[];
  message?: Message;
  error?: string;
};

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
    const payload = await response.json() as TeamResponse;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Team data is unavailable.");
    }

    const nextChannels = payload.channels ?? [];
    setChannels(nextChannels);
    setSelected((current) => current && nextChannels.some((channel) => channel.id === current)
      ? current
      : nextChannels[0]?.id ?? null);
    setStatus("Team connected");
  }, []);

  const loadMessages = useCallback(async (channelId: number) => {
    const response = await fetch("/api/team/messages?channelId=" + channelId, { cache: "no-store" });
    const payload = await response.json() as MessagesResponse;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Team messages are unavailable.");
    }
    setMessages(payload.messages ?? []);
  }, []);

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

    const timer = window.setTimeout(() => { void establishSession(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadChannels]);

  useEffect(() => {
    if (!selected) {
      const timer = window.setTimeout(() => {
        setMessages([]);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const channelId = selected;
    const timer = window.setTimeout(() => {
      void loadMessages(channelId).catch((error) => {
        setStatus(error instanceof Error ? error.message : "Messages are unavailable.");
      });
    }, 0);

    return () => window.clearTimeout(timer);
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
      const payload = await response.json() as TeamResponse & { channel?: Channel };
      if (!response.ok || !payload.ok || !payload.channel) {
        throw new Error(payload.error || "Unable to create channel.");
      }

      setChannels((current) => current.concat(payload.channel as Channel));
      setSelected(payload.channel.id);
      setChannelName("");
      setStatus("Team connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Channel creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = body.trim();
    if (!selected || !content) return;

    setBusy(true);
    try {
      const response = await fetch("/api/team/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelId: selected, body: content }),
      });
      const payload = await response.json() as MessagesResponse;
      if (!response.ok || !payload.ok || !payload.message) {
        throw new Error(payload.error || "Unable to send message.");
      }

      setMessages((current) => current.concat(payload.message as Message));
      setBody("");
      setStatus("Team connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Message failed.");
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
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
            Tenant-scoped collaboration, decisions and evidence links
          </p>
        </div>
        <span className="ml-auto flex items-center gap-2 text-[10px] text-[var(--muted)]">
          <Users className="h-3 w-3" />{status}
        </span>
      </header>

      <div className="grid lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[var(--border)] p-4 lg:border-b-0 lg:border-r">
          {status !== "Team connected" ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-xs text-[var(--muted-strong)]">
              {busy ? "Authenticating against the ELITZE session…" : status}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] text-[var(--text)] hover:bg-white/[0.03]"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                <Hash className="h-3 w-3" />Channels
              </div>

              <div className="space-y-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSelected(channel.id)}
                    className={"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs " + (
                      selected === channel.id
                        ? "bg-[var(--accent)]/10 text-[var(--text)]"
                        : "text-[var(--muted-strong)] hover:bg-white/[0.03]"
                    )}
                  >
                    <Hash className="h-3 w-3" />{channel.name}
                  </button>
                ))}

                {channels.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center text-[10px] text-[var(--muted)]">
                    No tenant channels recorded.
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={channelName}
                  onChange={(event) => setChannelName(event.target.value)}
                  placeholder="New channel"
                  maxLength={160}
                  className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-2 py-1.5 text-[11px] text-[var(--text)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => void createChannel()}
                  disabled={busy}
                  aria-label="Create channel"
                  className="rounded-lg border border-[var(--border)] px-2 text-[var(--muted-strong)] disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => selected && void loadMessages(selected).catch((error) => setStatus(error instanceof Error ? error.message : "Messages are unavailable."))}
                className="mt-3 flex items-center gap-2 text-[10px] text-[var(--muted)] hover:text-[var(--text)]"
              >
                <RefreshCw className="h-3 w-3" />Refresh
              </button>
            </>
          )}
        </aside>

        <div className="flex min-h-[360px] flex-col">
          <div className="flex-1 space-y-3 overflow-auto p-5">
            {selected && messages.map((message) => (
              <article key={message.id} className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-3">
                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                  <span className="font-medium text-[var(--text)]">{message.authorId}</span>
                  <span>{message.authorType}</span>
                  <span className="ml-auto">{new Date(message.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{message.body}</p>
                {(message.linkedDecisionId || message.linkedEvidenceId) && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--accent)]">
                    <ShieldCheck className="h-3 w-3" />
                    Security-linked message
                    {message.linkedDecisionId ? " · decision " + message.linkedDecisionId : ""}
                    {message.linkedEvidenceId ? " · evidence " + message.linkedEvidenceId : ""}
                  </div>
                )}
              </article>
            ))}

            {selected && messages.length === 0 && (
              <div className="flex h-full min-h-[250px] items-center justify-center text-xs text-[var(--muted)]">
                No messages recorded in this tenant channel.
              </div>
            )}

            {!selected && (
              <div className="flex h-full min-h-[250px] items-center justify-center text-xs text-[var(--muted)]">
                Sign in to access tenant team channels.
              </div>
            )}
          </div>

          {selected && (
            <form onSubmit={sendMessage} className="border-t border-[var(--border)] p-4">
              <div className="flex gap-2">
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Message the security team…"
                  rows={2}
                  maxLength={10000}
                  className="min-w-0 flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
                />
                <button
                  type="submit"
                  disabled={busy || !body.trim()}
                  aria-label="Send message"
                  className="self-end rounded-xl bg-[var(--accent)] p-3 text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
