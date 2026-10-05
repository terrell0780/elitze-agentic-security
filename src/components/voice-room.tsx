"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, Radio, ShieldCheck, Users } from "lucide-react";

type Presence = { actorId: string; displayName: string | null; joinedAt: string; lastSeenAt?: string };
type DescriptionSignal = { id: number; fromActorId: string; signalType: "offer" | "answer" | "bye"; payload: RTCSessionDescriptionInit; createdAt: string };
type CandidateSignal = { id: number; fromActorId: string; signalType: "candidate"; payload: RTCIceCandidateInit; createdAt: string };
type Signal = DescriptionSignal | CandidateSignal;

type VoiceResponse = { ok?: boolean; presence?: Presence[]; signals?: Signal[]; error?: string };

export default function VoiceRoom({ channelId }: { channelId: number | null }) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [status, setStatus] = useState("Voice idle");
  const [myActorId, setMyActorId] = useState<string | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const actorIdRef = useRef<string | null>(null);

  const signal = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch("/api/team/voice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.error || "voice_request_failed");
  }, []);

  const closePeer = useCallback((actorId: string) => {
    const peer = peers.current.get(actorId);
    peer?.close();
    peers.current.delete(actorId);
  }, []);

  const ensurePeer = useCallback(async (peerActorId: string, makeOffer: boolean) => {
    if (!channelId || !localStream.current) return;
    if (peers.current.has(peerActorId)) return;

    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    peers.current.set(peerActorId, peer);

    for (const track of localStream.current.getTracks()) {
      peer.addTrack(track, localStream.current);
    }

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      void signal({
        action: "signal",
        channelId,
        toActorId: peerActorId,
        signalType: "candidate",
        payload: event.candidate.toJSON(),
      }).catch(() => undefined);
    };

    peer.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      const audio = audioRefs.current.get(peerActorId);
      if (audio) {
        audio.srcObject = stream;
        void audio.play().catch(() => undefined);
      }
    };

    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
        closePeer(peerActorId);
      }
    };

    if (makeOffer) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await signal({
        action: "signal",
        channelId,
        toActorId: peerActorId,
        signalType: "offer",
        payload: offer,
      });
    }
  }, [channelId, closePeer, signal]);

  const processSignals = useCallback(async (signals: Signal[]) => {
    for (const item of signals) {
      try {
        if (item.signalType === "offer") {
          closePeer(item.fromActorId);
          await ensurePeer(item.fromActorId, false);
          const peer = peers.current.get(item.fromActorId);
          if (!peer) continue;
          await peer.setRemoteDescription(item.payload);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          if (channelId) {
            await signal({
              action: "signal",
              channelId,
              toActorId: item.fromActorId,
              signalType: "answer",
              payload: answer,
            });
          }
        } else if (item.signalType === "answer") {
          const peer = peers.current.get(item.fromActorId);
          if (peer && peer.signalingState === "have-local-offer") {
            await peer.setRemoteDescription(item.payload);
          }
        } else if (item.signalType === "candidate") {
          const peer = peers.current.get(item.fromActorId);
          if (peer) await peer.addIceCandidate(item.payload);
        } else if (item.signalType === "bye") {
          closePeer(item.fromActorId);
        }
      } catch {
        closePeer(item.fromActorId);
      }
    }
  }, [channelId, closePeer, ensurePeer, signal]);

  const poll = useCallback(async () => {
    if (!channelId || !joined) return;
    try {
      const response = await fetch("/api/team/voice?channelId=" + channelId, { cache: "no-store" });
      const payload = await response.json() as VoiceResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "voice_unavailable");
      const next = payload.presence ?? [];
      setPresence(next);
      actorIdRef.current = actorIdRef.current || next.find((item) => !peers.current.has(item.actorId))?.actorId || null;
      await processSignals(payload.signals ?? []);

      const myId = actorIdRef.current;
      if (myId) {
        for (const peer of next) {
          if (peer.actorId === myId || peers.current.has(peer.actorId)) continue;
          if (myId.localeCompare(peer.actorId) < 0) {
            await ensurePeer(peer.actorId, true);
          } else {
            await ensurePeer(peer.actorId, false);
          }
        }
      }
      setStatus("Voice connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Voice unavailable");
    }
  }, [channelId, ensurePeer, joined, processSignals]);

  useEffect(() => {
    if (!joined) return;
    const timer = window.setInterval(() => void poll(), 1500);
    void poll();
    return () => window.clearInterval(timer);
  }, [joined, poll]);

  useEffect(() => () => {
    for (const actorId of peers.current.keys()) closePeer(actorId);
    localStream.current?.getTracks().forEach((track) => track.stop());
  }, [closePeer]);

  async function join() {
    if (!channelId || joined) return;
    setStatus("Requesting microphone");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      localStream.current = stream;
      const response = await fetch("/api/team/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "join", channelId }),
      });
      const payload = await response.json() as { ok?: boolean; actorId?: string; error?: string };
      if (!response.ok || !payload.ok || !payload.actorId) throw new Error(payload.error || "voice_join_failed");
      actorIdRef.current = payload.actorId;
      setMyActorId(payload.actorId);
      setMuted(false);
      setJoined(true);
      setStatus("Voice connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Microphone access failed");
    }
  }

  async function leave() {
    if (!channelId) return;
    try { await signal({ action: "leave", channelId }); } catch {}
    for (const actorId of peers.current.keys()) {
      if (actorIdRef.current) {
        void signal({ action: "signal", channelId, toActorId: actorId, signalType: "bye", payload: {} }).catch(() => undefined);
      }
      closePeer(actorId);
    }
    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;
    setJoined(false);
    setPresence([]);
    setMyActorId(null);
    actorIdRef.current = null;
    setStatus("Voice idle");
  }

  function toggleMute() {
    const next = !muted;
    localStream.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
    setMuted(next);
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)]">
          <Radio className="h-4 w-4 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">ELITZE Voice</h3>
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">WebRTC · tenant-scoped signaling · policy-gated join</p>
        </div>
        <span className="ml-auto text-[10px] text-[var(--muted)]">{status}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] text-[var(--muted-strong)]">
          <Users className="h-3.5 w-3.5 text-[var(--accent)]" />{presence.length} connected
        </div>
        {joined ? (
          <>
            <button type="button" onClick={toggleMute} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] font-semibold">
              {muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              {muted ? "Unmute" : "Mute"}
            </button>
            <button type="button" onClick={() => void leave()} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-[11px] font-semibold text-slate-950">
              <Phone className="h-3.5 w-3.5" />Leave voice
            </button>
          </>
        ) : (
          <button type="button" disabled={!channelId} onClick={() => void join()} className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-[11px] font-semibold text-slate-950 disabled:opacity-50">
            <Mic className="h-3.5 w-3.5" />Join voice
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {presence.map((peer) => (
          <div key={peer.actorId} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{peer.displayName || peer.actorId}</span>
            <audio ref={(node) => { if (node) audioRefs.current.set(peer.actorId, node); else audioRefs.current.delete(peer.actorId); }} autoPlay playsInline />
            {peer.actorId === myActorId && <ShieldCheck className="ml-auto h-3 w-3 text-[var(--accent)]" />}
          </div>
        ))}
        {presence.length === 0 && <p className="text-[10px] text-[var(--muted)]">No active voice participants recorded.</p>}
      </div>
    </section>
  );
}
