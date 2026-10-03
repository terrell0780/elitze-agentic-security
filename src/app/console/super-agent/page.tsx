"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BrainCircuit, Image as ImageIcon, Mic, MicOff, Search, Send, ShieldCheck, Sparkles } from "lucide-react";

type Mode = "auto" | "deep-research" | "security-analyst" | "code" | "creative" | "evidence";
type Message = { role: "user" | "assistant"; content: string; sources?: Array<{ title: string; url: string }> };

const modes: Array<{ id: Mode; label: string; icon: typeof BrainCircuit }> = [
  { id: "auto", label: "Auto", icon: Sparkles },
  { id: "deep-research", label: "Deep Research", icon: Search },
  { id: "security-analyst", label: "Security Analyst", icon: ShieldCheck },
  { id: "code", label: "Engineering", icon: BrainCircuit },
  { id: "creative", label: "Creative", icon: Sparkles },
  { id: "evidence", label: "Evidence", icon: ShieldCheck },
];

function pcm16ToBase64(input: Float32Array) {
  const pcm = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function base64ToPcm16(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

export default function SuperAgentPage() {
  const [mode, setMode] = useState<Mode>("auto");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Voice idle");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioCursorRef = useRef(0);

  async function sendMessage() {
    const value = input.trim();
    if (!value || busy) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/super-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, messages: next }),
      });
      const payload = await response.json() as { ok?: boolean; answer?: string; sources?: Message["sources"]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "super_agent_failed");
      setMessages((current) => [...current, { role: "assistant", content: payload.answer || "No response.", sources: payload.sources }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Super Agent request failed." }]);
    } finally {
      setBusy(false);
    }
  }

  async function startVoice() {
    try {
      setVoiceStatus("Opening secure voice session...");
      const tokenResponse = await fetch("/api/super-agent/realtime-token", { method: "POST" });
      const tokenPayload = await tokenResponse.json() as { ok?: boolean; token?: string; error?: string };
      if (!tokenResponse.ok || !tokenPayload.ok || !tokenPayload.token) throw new Error(tokenPayload.error || "voice_token_failed");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const context = new AudioContext({ sampleRate: 24000 });
      const processor = context.createScriptProcessor(4096, 1, 1);
      const source = context.createMediaStreamSource(stream);
      const ws = new WebSocket("wss://api.x.ai/v1/realtime?model=grok-voice-latest", ["xai-client-secret." + tokenPayload.token]);

      ws.onopen = () => {
        setVoiceStatus("Listening");
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            voice: "eve",
            reasoning: { effort: "high" },
            instructions: "You are ELITZE Super Agent. The model is not the security boundary. Use evidence-bound answers and ELITZE Agent Reach plus Security Graph context where relevant. Never invent security facts.",
            turn_detection: { type: "server_vad" },
            tools: [{ type: "web_search" }, { type: "x_search" }],
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; delta?: string; text?: string };
          if (payload.type === "response.output_audio.delta" && payload.delta) {
            const pcm = base64ToPcm16(payload.delta);
            const float32 = new Float32Array(pcm.length);
            for (let i = 0; i < pcm.length; i += 1) float32[i] = pcm[i] / 0x8000;
            const buffer = context.createBuffer(1, float32.length, 24000);
            buffer.copyToChannel(float32, 0);
            const node = context.createBufferSource();
            node.buffer = buffer;
            node.connect(context.destination);
            const startAt = Math.max(context.currentTime, audioCursorRef.current);
            node.start(startAt);
            audioCursorRef.current = startAt + buffer.duration;
          }
          if (payload.type === "conversation.item.input_audio_transcription.completed" && payload.text) {
            setMessages((current) => [...current, { role: "user", content: payload.text || "" }]);
          }
          if (payload.type === "response.output_text.done" && payload.text) {
            setMessages((current) => [...current, { role: "assistant", content: payload.text || "" }]);
          }
          if (payload.type === "error") setVoiceStatus("Voice error");
        } catch {
          setVoiceStatus("Voice event error");
        }
      };

      ws.onerror = () => setVoiceStatus("Voice connection error");
      ws.onclose = () => {
        setVoiceOn(false);
        setVoiceStatus("Voice idle");
      };

      processor.onaudioprocess = (event) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm16ToBase64(event.inputBuffer.getChannelData(0)) }));
      };

      source.connect(processor);
      processor.connect(context.destination);
      streamRef.current = stream;
      audioContextRef.current = context;
      processorRef.current = processor;
      wsRef.current = ws;
      audioCursorRef.current = context.currentTime;
      setVoiceOn(true);
    } catch (error) {
      setVoiceStatus(error instanceof Error ? error.message : "Voice unavailable");
    }
  }

  async function stopVoice() {
    wsRef.current?.close();
    wsRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    await audioContextRef.current?.close();
    audioContextRef.current = null;
    audioCursorRef.current = 0;
    setVoiceOn(false);
    setVoiceStatus("Voice idle");
  }

  async function generateImage() {
    const prompt = imagePrompt.trim();
    if (!prompt) return;
    try {
      const response = await fetch("/api/super-agent/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const payload = await response.json() as { ok?: boolean; data?: Array<{ url?: string; b64_json?: string }>; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "image_generation_failed");
      const first = payload.data?.[0];
      setImageUrl(first?.url || (first?.b64_json ? "data:image/png;base64," + first.b64_json : null));
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error instanceof Error ? error.message : "Image generation failed." }]);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--header)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <Link href="/console" className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><BrainCircuit className="h-5 w-5" /></Link>
            <div><div className="text-xs font-black tracking-[.14em]">ELITZE SUPER AGENT</div><div className="text-[9px] uppercase tracking-[.2em] text-[var(--muted)]">Reason · Research · Reach · Govern · Prove</div></div>
          </div>
          <Link href="/console" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)]">Control Plane</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-7 lg:grid-cols-[250px_minmax(0,1fr)_290px]">
        <aside className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <div className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Operating mode</div>
          <div className="mt-3 grid gap-2">
            {modes.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setMode(id)} className={"flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold " + (mode === id ? "border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--text)]" : "border-[var(--border)] text-[var(--muted)]")}><Icon className="h-4 w-4 text-[var(--accent)]" />{label}</button>)}
          </div>
          <div className="mt-6 border-t border-[var(--border)] pt-5 text-[10px] leading-5 text-[var(--muted)]">
            <div className="font-semibold text-[var(--text)]">ELITZE capability layer</div>
            <div className="mt-2">Agent Reach · Security Graph · God's Eye View · Autonomous Analyst context · RAG/evidence · policy-aware reasoning · MCP · web research · code execution · voice · image generation.</div>
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-110px)] flex-col rounded-3xl border border-[var(--border)] bg-[var(--panel)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE // intelligence core</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight">ELITZE Super Agent</h1>
            <p className="mt-1 text-xs text-[var(--muted)]">Reason deeply. Research live. Inspect real security state. Map reach. Synthesize the graph. Prove what can be proven.</p>
          </div>
          <div className="flex-1 space-y-4 overflow-auto p-5">
            {messages.length === 0 && <div className="grid min-h-[420px] place-items-center text-center"><div><BrainCircuit className="mx-auto h-10 w-10 text-[var(--accent)]" /><div className="mt-4 text-lg font-bold">Ready</div><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">The Super Agent can use reasoning, web research, code execution, approved MCP servers, tenant-scoped Agent Reach, the Security Graph and evidence records.</p></div>}
            {messages.map((message, index) => <article key={index} className={"rounded-2xl border p-4 " + (message.role === "user" ? "ml-8 border-[var(--accent-border)] bg-[var(--accent-soft)]" : "mr-8 border-[var(--border)] bg-black/10")}><div className="mb-2 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">{message.role}</div><div className="whitespace-pre-wrap text-sm leading-7">{message.content}</div>{message.sources?.length ? <div className="mt-3 border-t border-[var(--border)] pt-3">{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="mr-2 inline-block rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] text-[var(--muted)]">{source.title}</a>)}</div> : null}</article>)}
          </div>
          <div className="border-t border-[var(--border)] p-4">
            <div className="flex gap-2">
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={3} placeholder="Ask ELITZE Super Agent..." className="min-h-20 flex-1 resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-border)]" />
              <button type="button" disabled={busy || !input.trim()} onClick={() => void sendMessage()} className="self-end rounded-2xl bg-[var(--accent)] p-4 text-slate-950 disabled:opacity-40" aria-label="Send"><Send className="h-5 w-5" /></button>
            </div>
            <div className="mt-2 text-[9px] text-[var(--muted)]">Enter to send · Shift+Enter for a new line · mode: {mode}</div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Voice</div>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={() => void (voiceOn ? stopVoice() : startVoice())} className={voiceOn ? "rounded-xl border border-red-400/20 bg-red-500/15 px-4 py-2.5 text-xs font-bold text-red-200" : "rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950"}>{voiceOn ? <><MicOff className="mr-2 inline h-4 w-4" />Stop</> : <><Mic className="mr-2 inline h-4 w-4" />Start voice</>}</button>
              <span className="text-[10px] text-[var(--muted)]">{voiceStatus}</span>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">Browser voice uses a short-lived credential. The primary API key never reaches the browser.</p>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]"><ImageIcon className="h-3.5 w-3.5 text-[var(--accent)]" /> Image Studio</div>
            <textarea value={imagePrompt} onChange={(event) => setImagePrompt(event.target.value)} rows={4} placeholder="Create an ELITZE security visual..." className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-xs outline-none focus:border-[var(--accent-border)]" />
            <button type="button" onClick={() => void generateImage()} className="mt-2 w-full rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-bold text-slate-950">Generate</button>
            {imageUrl && <img src={imageUrl} alt="Generated ELITZE visual" className="mt-3 w-full rounded-2xl border border-[var(--border)]" />}
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-4 text-[10px] leading-5 text-[var(--muted)]">
            <div className="font-semibold text-[var(--text)]">Security boundary</div>
            <div className="mt-2">The Super Agent researches and reasons; consequential actions stay behind ELITZE identity, policy, authorization, approval, execution and verification.</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
