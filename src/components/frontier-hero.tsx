"use client";

import { useState } from "react";

type Point = { x: number; y: number };

type Props = {
  src: string;
  alt: string;
  eyebrow: string;
  label: string;
};

export default function FrontierHero({ src, alt, eyebrow, label }: Props) {
  const [tilt, setTilt] = useState<Point>({ x: 0, y: 0 });

  return (
    <div
      className="group relative isolate overflow-hidden rounded-[32px] border border-[var(--accent-border)] bg-black/40 shadow-[0_40px_120px_rgba(0,0,0,.45)]"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * -4, y: x * 5 });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <img
        src={src}
        alt={alt}
        width={3200}
        height={1800}
        loading="eager"
        className="h-auto w-full origin-center object-cover transition-transform duration-500 ease-out will-change-transform"
        style={{
          transform: `perspective(1800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.035)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,transparent_30%,rgba(3,8,20,.25)_68%,rgba(3,8,20,.78)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#030815] via-[#030815]/35 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-screen [background-image:linear-gradient(rgba(103,232,249,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.055)_1px,transparent_1px)] [background-size:42px_42px] transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute left-5 top-5 right-5 flex items-start justify-between sm:left-7 sm:top-7 sm:right-7">
        <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.22em] text-cyan-100 backdrop-blur-xl">
          {eyebrow}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-slate-950/55 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.18em] text-cyan-100 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)]" />
          {label}
        </div>
      </div>
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-5 sm:bottom-7 sm:left-7 sm:right-7">
        <div className="max-w-xl">
          <div className="text-[9px] font-bold uppercase tracking-[.2em] text-cyan-200/75">
            Interactive frontier visual
          </div>
          <div className="mt-2 text-lg font-black tracking-[-.03em] text-white sm:text-2xl">
            Discover → govern → validate → prove
          </div>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-right text-[8px] font-bold uppercase tracking-[.16em] text-slate-300 backdrop-blur-xl sm:block">
          Pointer-reactive 3D depth
          <br />
          Reduced-motion safe
        </div>
      </div>
    </div>
  );
}
