"use client";

import { FormEvent, useState } from "react";
import { Bot, LockKeyhole, Send } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function GovernedChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [dataClass, setDataClass] = useState<"public" | "internal" | "confidential" | "restricted">("internal");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setBusy(true);
    setStatus("Policy evaluation…");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, dataClass }),
      });
      const payload = await response.json() as { ok?: boolean; answer?: string; state?: string; error?: string };
      if (!response.ok || !payload.ok) {
        setMessages((current) => [...current, { role: "assistant", content: payload.error || "No response generated." }]);
        setStatus(payload.state || "Unavailable");
        return;
      }
      setMessages((current) => [...current, { role: "assistant", content: payload.answer || "No assistant content returned." }]);
      setStatus("Generated under ELITZE policy");
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Chat service unavailable. No response was generated." }]);
      setStatus("Unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)]">
      <header className="flex items-center gap-3 border-b border-white/7 px-5 py-4">
        <Bot className="h-4 w-4 text-[var(--accent)]" />
        <div><h2 className="text-sm font-semibold text-white">ELITZE Governed Chat</h2><p className="text-[10px] uppercase tracking-widest text-slate-500">Policy before generation · explicit uncertainty · no fabricated telemetry</p></div>
        <span className="ml-auto text-[10px] text-slate-500">{status}</span>
      </header>
      <div className="space-y-3 p-5">
        <div className="max-h-[420px] min-h-[220px] space-y-3 overflow-auto rounded-xl border border-white/7 bg-black/20 p-4">
          {messages.length === 0 && <div className="flex h-[180px] items-center justify-center text-xs text-slate-600">Start a security conversation. Responses require a configured ELITZE AI gateway.</div>}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`rounded-xl border p-3 ${message.role === "user" ? "border-white/10 bg-white/[0.03]" : "border-[var(--accent-border)] bg-[var(--accent-soft)]"}`}>
              <div className="text-[10px] uppercase tracking-widest text-slate-600">{message.role === "user" ? "You" : "ELITZE"}</div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-300">{message.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={send}>
          <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-600"><LockKeyhole className="h-3 w-3" />Classification</div>
          <div className="flex gap-2">
            <select value={dataClass} onChange={(e) => setDataClass(e.target.value as typeof dataClass)} className="rounded-xl border border-white/10 bg-black/30 px-3 text-xs text-slate-300 outline-none">
              <option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="restricted">Restricted</option>
            </select>
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={20000} placeholder="Ask ELITZE about an investigation, policy, agent, or control…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600" />
            <button disabled={busy || !input.trim()} aria-label="Send chat" className="rounded-xl bg-[var(--accent)] px-4 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
        </form>
      </div>
    </section>
  );
}
