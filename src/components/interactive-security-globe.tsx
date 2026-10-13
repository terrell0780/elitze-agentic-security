"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent, MouseEvent, WheelEvent } from "react";
import { Compass, Globe2, RotateCcw } from "lucide-react";

export type GlobeObservation = {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  connectorId?: string;
  severity?: string;
  observedAt?: string;
  sourceRef?: string | null;
  evidenceState?: string;
};

type Projected = GlobeObservation & { x: number; y: number; z: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function project(
  latitude: number,
  longitude: number,
  cx: number,
  cy: number,
  radius: number,
  rotationY: number,
  rotationX: number,
  zoom: number,
): Projected {
  const lat = latitude * Math.PI / 180;
  const lon = longitude * Math.PI / 180 + rotationY;
  const x = Math.cos(lat) * Math.sin(lon);
  const y0 = Math.sin(lat);
  const z0 = Math.cos(lat) * Math.cos(lon);
  const y = y0 * Math.cos(rotationX) - z0 * Math.sin(rotationX);
  const z = y0 * Math.sin(rotationX) + z0 * Math.cos(rotationX);
  return {
    id: "",
    latitude,
    longitude,
    label: "",
    x: cx + x * radius * zoom,
    y: cy - y * radius * zoom,
    z,
  };
}

function severityColor(severity: string | undefined) {
  const value = (severity ?? "").toUpperCase();
  if (value === "CRITICAL") return "#fb7185";
  if (value === "HIGH") return "#f59e0b";
  if (value === "MEDIUM") return "#22d3ee";
  return "#67e8f9";
}

export default function InteractiveSecurityGlobe({ observations }: { observations: GlobeObservation[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const observationsRef = useRef(observations);
  const rotationRef = useRef({ x: -0.16, y: -0.55 });
  const zoomRef = useRef(1);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<GlobeObservation | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    observationsRef.current = observations;
    if (selected && !observations.some((item) => item.id === selected.id)) setSelected(null);
  }, [observations, selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(300, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!draggingRef.current && autoRotate) rotationRef.current.y += 0.0016;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#050b13";
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const radius = Math.min(width * 0.36, height * 0.37);
      const rotationX = rotationRef.current.x;
      const rotationY = rotationRef.current.y;
      const zoom = zoomRef.current;

      const atmosphere = ctx.createRadialGradient(cx, cy, radius * 0.65, cx, cy, radius * 1.46);
      atmosphere.addColorStop(0, "rgba(34,211,238,0.02)");
      atmosphere.addColorStop(0.66, "rgba(34,211,238,0.07)");
      atmosphere.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = atmosphere;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.48, 0, Math.PI * 2);
      ctx.fill();

      const sphere = ctx.createRadialGradient(cx - radius * 0.36, cy - radius * 0.42, radius * 0.1, cx, cy, radius * 1.08);
      sphere.addColorStop(0, "#12314a");
      sphere.addColorStop(0.55, "#0a1a2c");
      sphere.addColorStop(1, "#040811");
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius * zoom, 0, Math.PI * 2);
      ctx.clip();

      const drawLine = (points: Array<{ x: number; y: number; z: number }>, alpha: number) => {
        ctx.beginPath();
        let open = false;
        for (const point of points) {
          if (point.z < -0.035) {
            open = false;
            continue;
          }
          if (!open) {
            ctx.moveTo(point.x, point.y);
            open = true;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.strokeStyle = "rgba(66, 191, 227," + alpha + ")";
        ctx.lineWidth = 0.65;
        ctx.stroke();
      };

      for (let lat = -75; lat <= 75; lat += 15) {
        const points = [];
        for (let lon = -180; lon <= 180; lon += 4) {
          points.push(project(lat, lon, cx, cy, radius, rotationY, rotationX, zoom));
        }
        drawLine(points, lat === 0 ? 0.36 : 0.2);
      }
      for (let lon = -180; lon < 180; lon += 15) {
        const points = [];
        for (let lat = -90; lat <= 90; lat += 3) {
          points.push(project(lat, lon, cx, cy, radius, rotationY, rotationX, zoom));
        }
        drawLine(points, lon === 0 ? 0.38 : 0.23);
      }

      const axis = [
        project(0, -180, cx, cy, radius, rotationY, rotationX, zoom),
        project(0, 0, cx, cy, radius, rotationY, rotationX, zoom),
        project(0, 180, cx, cy, radius, rotationY, rotationX, zoom),
      ];
      drawLine(axis, 0.12);
      ctx.restore();

      ctx.strokeStyle = "rgba(103,232,249,0.55)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * zoom, 0, Math.PI * 2);
      ctx.stroke();

      const points: Array<{ observation: GlobeObservation; projected: Projected }> = [];
      for (const observation of observationsRef.current) {
        const point = project(observation.latitude, observation.longitude, cx, cy, radius, rotationY, rotationX, zoom);
        if (point.z < -0.01) continue;
        points.push({ observation, projected: point });
      }
      points.sort((a, b) => a.projected.z - b.projected.z);
      for (const { observation, projected } of points) {
        const color = severityColor(observation.severity);
        const selectedPoint = selected?.id === observation.id;
        ctx.globalAlpha = 0.22 + Math.max(0, projected.z) * 0.7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, selectedPoint ? 6 : 3.7, 0, Math.PI * 2);
        ctx.fill();
        if (selectedPoint) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, 10.5, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(207,250,254,0.65)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, 6.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(148,163,184,0.85)";
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText("ELITZE / OBSERVED GEO-EVIDENCE", 18, 24);
      ctx.fillStyle = "rgba(103,232,249,0.8)";
      ctx.fillText("ROTATE · DRAG · SCROLL TO ZOOM", 18, height - 16);

      frame = window.requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [autoRotate, selected]);

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    draggingRef.current = true;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const last = lastPointerRef.current;
    if (!draggingRef.current || !last) return;
    const dx = event.clientX - last.x;
    const dy = event.clientY - last.y;
    rotationRef.current.y += dx * 0.008;
    rotationRef.current.x = clamp(rotationRef.current.x + dy * 0.008, -1.4, 1.4);
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp() {
    draggingRef.current = false;
    lastPointerRef.current = null;
  }

  function onClick(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const radius = Math.min(width * 0.36, height * 0.37);
    const candidates = observations.map((observation) => ({
      observation,
      point: project(observation.latitude, observation.longitude, cx, cy, radius, rotationRef.current.y, rotationRef.current.x, zoomRef.current),
    })).filter((item) => item.point.z >= -0.01);
    candidates.sort((a, b) => Math.hypot(a.point.x - (event.clientX - rect.left), a.point.y - (event.clientY - rect.top))
      - Math.hypot(b.point.x - (event.clientX - rect.left), b.point.y - (event.clientY - rect.top)));
    const nearest = candidates[0];
    if (nearest && Math.hypot(nearest.point.x - (event.clientX - rect.left), nearest.point.y - (event.clientY - rect.top)) < 22) {
      setSelected(nearest.observation);
    }
  }

  function onWheel(event: WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    zoomRef.current = clamp(zoomRef.current - event.deltaY * 0.0008, 0.72, 1.4);
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[#050b13] text-white shadow-[0_28px_90px_rgba(0,0,0,.32)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-cyan-200"><Globe2 className="h-3.5 w-3.5" /> Observed threat geography</div>
          <h2 className="mt-1 text-lg font-black tracking-tight">Interactive 3D globe</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">Geographic markers appear only when a connected tenant source provides validated latitude and longitude. The globe grid is visual context, not security telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAutoRotate((value) => !value)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-slate-300">{autoRotate ? "Pause rotation" : "Resume rotation"}</button>
          <button type="button" onClick={() => { rotationRef.current = { x: -0.16, y: -0.55 }; zoomRef.current = 1; setSelected(null); }} aria-label="Reset globe view" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300"><RotateCcw className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-[320px] w-full cursor-grab touch-none active:cursor-grabbing sm:h-[430px]"
          aria-label={"Interactive three-dimensional earth globe with " + observations.length + " observed geolocated security events"}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onClick}
          onWheel={onWheel}
        />
        <div className="pointer-events-none absolute bottom-8 right-4 flex flex-col gap-1 rounded-xl border border-white/10 bg-[#06111d]/90 px-3 py-2 text-[9px] text-slate-300 backdrop-blur">
          <span className="font-bold uppercase tracking-wider text-slate-500">Observed markers</span>
          <span>{observations.length} source-bound coordinates</span>
          <span className="text-amber-300">{observations.length ? "Not a threat-count proxy" : "UNMEASURABLE · no coordinates"}</span>
        </div>
      </div>
      <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[.025] p-3">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-500"><Compass className="h-3.5 w-3.5" /> Evidence state</div>
          <div className="mt-2 text-sm font-semibold text-slate-100">{observations.length ? "OBSERVED" : "UNMEASURABLE"}</div>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{observations.length ? "Each marker retains its recorded source and timestamp." : "No synthetic markers or inferred locations are plotted."}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.025] p-3">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Selected source observation</div>
          {selected ? (
            <>
              <div className="mt-2 break-words text-xs font-semibold text-slate-100">{selected.label}</div>
              <div className="mt-1 text-[10px] text-slate-400">{selected.connectorId ?? "Source not recorded"} · {selected.severity ?? "INFO"}</div>
              <div className="mt-1 font-mono text-[10px] text-cyan-100">{selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}</div>
              <div className="mt-1 text-[9px] text-slate-500">{selected.observedAt ? new Date(selected.observedAt).toLocaleString() : "Timestamp not recorded"}</div>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">{observations.length ? "Select an observed marker on the globe." : "Nothing selected."}</p>
          )}
        </div>
      </div>
    </section>
  );
}
