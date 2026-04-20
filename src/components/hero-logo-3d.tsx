"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

// ─── Easing & Math ──────────────────────────────────────────────────────────

const Easing = {
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeOutQuad: (t: number) => t * (2 - t),
  easeOutBack: (t: number) => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function interpolate(
  input: number[],
  output: number[],
  ease = (t: number) => t
) {
  return (t: number) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const eased = ease(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ISO_W = 100;
const ISO_H = 58;
const ISO_Z = 116;

const FACE_COLORS = {
  gold: { top: "#E59B13", right: "#C67402", left: "#A55E00" },
  blue: { top: "#1C4B92", right: "#13356D", left: "#0C2450" },
  gray: { top: "#DDDDDD", right: "#BDBDBD", left: "#9A9A9A" },
};

const CUBES = [
  { id: "gold", tone: "gold", gx: 0, gy: 1, gz: 2 },
  { id: "blueMid", tone: "blue", gx: 0, gy: 1, gz: 1 },
  { id: "blueBase", tone: "blue", gx: 0, gy: 1, gz: 0 },
  { id: "gray", tone: "gray", gx: 0, gy: 0, gz: 0 },
  { id: "blueRight", tone: "blue", gx: 1, gy: 0, gz: 0 },
];

const SCHED: Record<string, { start: number; land: number; from: string }> = {
  gray: { start: 0.2, land: 0.9, from: "topFront" },
  blueBase: { start: 0.7, land: 1.4, from: "farLeft" },
  blueRight: { start: 1.2, land: 1.9, from: "farRight" },
  blueMid: { start: 1.8, land: 2.5, from: "above" },
  gold: { start: 2.4, land: 3.1, from: "above" },
};

// ─── Components ─────────────────────────────────────────────────────────────

function IsoCube({
  gx,
  gy,
  gz,
  dx = 0,
  dy = 0,
  opacity = 1,
  scaleX = 1,
  scaleY = 1,
  glow = 0,
  tone,
}: {
  gx: number;
  gy: number;
  gz: number;
  dx?: number;
  dy?: number;
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
  glow?: number;
  tone: (typeof FACE_COLORS)["gold"];
}) {
  const X = (gx - gy) * ISO_W;
  const Y = -(gx + gy) * ISO_H - gz * ISO_Z;

  const topPts = `0,${-ISO_H} ${ISO_W},0 0,${ISO_H} ${-ISO_W},0`;
  const leftPts = `${-ISO_W},0 0,${ISO_H} 0,${ISO_H + ISO_Z} ${-ISO_W},${ISO_Z}`;
  const rightPts = `0,${ISO_H} ${ISO_W},0 ${ISO_W},${ISO_Z} 0,${ISO_H + ISO_Z}`;

  const topFill =
    glow > 0
      ? `color-mix(in oklab, ${tone.top} ${100 - glow * 50}%, white)`
      : tone.top;

  return (
    <svg
      style={{
        position: "absolute",
        left: `calc(50% + ${X + dx - ISO_W}px)`,
        top: `calc(50% + ${Y + dy - ISO_H}px)`,
        width: ISO_W * 2 + 8,
        height: ISO_H * 2 + ISO_Z + 8,
        opacity,
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: `${ISO_W}px ${ISO_H + ISO_Z}px`,
        overflow: "visible",
        filter:
          glow > 0
            ? `drop-shadow(0 0 ${glow * 40}px rgba(255,220,140,${glow * 0.6}))`
            : "none",
      }}
      viewBox={`${-ISO_W - 4} ${-ISO_H - 4} ${ISO_W * 2 + 8} ${ISO_H * 2 + ISO_Z + 8}`}
    >
      <polygon points={leftPts} fill={tone.left} />
      <polygon points={rightPts} fill={tone.right} />
      <polygon points={topPts} fill={topFill} />
      <polygon
        points={topPts}
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1.5"
      />
      <polygon
        points={leftPts}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="1"
      />
      <polygon
        points={rightPts}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="1"
      />
    </svg>
  );
}

function Particles({ t }: { t: number }) {
  const seeds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        speed: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? "gold" : "blue",
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {seeds.map((p, i) => {
        const drift = Math.sin(t * p.speed + p.phase) * 20;
        const y = (p.y + t * p.speed * 20) % 100;
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2 + p.phase));
        const color = p.hue === "gold" ? "229,155,19" : "100,160,255";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${y}%`,
              transform: `translateX(${drift}px)`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `rgba(${color},${twinkle * 0.6})`,
              boxShadow: `0 0 ${p.size * 4}px rgba(${color},${twinkle * 0.3})`,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function HeroLogo3D() {
  const [time, setTime] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const DUR = 6;

  useEffect(() => {
    const step = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => (t + dt) % DUR);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const sortedCubes = useMemo(() => {
    return [...CUBES].sort((a, b) => {
      const za = -a.gy * 100 + -a.gx * 10 + a.gz;
      const zb = -b.gy * 100 + -b.gx * 10 + b.gz;
      return za - zb;
    });
  }, []);

  const markOp = interpolate([3.3, 3.8], [0, 1], Easing.easeOutCubic)(time);
  const markY = interpolate([3.3, 3.9], [20, 0], Easing.easeOutBack)(time);
  const tagOp = interpolate([4.3, 4.9], [0, 1], Easing.easeOutCubic)(time);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center select-none perspective-1000">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-radial-gradient from-[#0d1326] via-[#020307] to-black opacity-90" />

      {/* FX Layers */}
      <Particles t={time} />

      {/* Film Grain */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* Shadow */}
      <div
        className="absolute w-[600px] h-[180px] blur-[60px] pointer-events-none transition-opacity duration-1000"
        style={{
          top: "65%",
          background: `radial-gradient(ellipse at center, rgba(229,155,19,0.2) 0%, rgba(28,75,146,0.1) 45%, transparent 70%)`,
          opacity: interpolate([0.2, 3.1], [0, 1])(time),
        }}
      />

      {/* ISO Stage */}
      <div className="relative scale-[0.6] md:scale-[0.8] lg:scale-100 -translate-y-12">
        {sortedCubes.map((c) => {
          const { start, land, from } = SCHED[c.id];
          if (time < start) return null;

          const p = clamp((time - start) / (land - start), 0, 1);
          const ease = Easing.easeOutCubic(p);

          let dx0 = 0,
            dy0 = 0;
          if (from === "topFront") dy0 = -1000;
          else if (from === "farLeft") dx0 = -1200;
          else if (from === "farRight") dx0 = 1200;
          else if (from === "above") dy0 = -1500;

          const dx = dx0 * (1 - ease);
          const dy = dy0 * (1 - ease);

          let sX = 1,
            sY = 1;
          if (p > 0.88 && p < 1.0) {
            const squash = Math.sin(((p - 0.88) / 0.12) * Math.PI) * 0.06;
            if (from === "above" || from === "topFront") {
              sX = 1 + squash;
              sY = 1 - squash;
            } else {
              sX = 1 - squash;
              sY = 1 + squash;
            }
          }

          const glow = interpolate(
            [land - 0.05, land + 0.05, land + 0.5],
            [0, 1, 0],
            Easing.easeOutQuad
          )(time);

          return (
            <IsoCube
              key={c.id}
              gx={c.gx}
              gy={c.gy}
              gz={c.gz}
              dx={dx}
              dy={dy}
              scaleX={sX}
              scaleY={sY}
              opacity={interpolate([0, 0.15], [0, 1])(p)}
              glow={glow}
              tone={FACE_COLORS[c.tone as keyof typeof FACE_COLORS]}
            />
          );
        })}
      </div>

      {/* Wordmark */}
      <div
        className="absolute bottom-16 md:bottom-20 text-center pointer-events-none"
        style={{
          opacity: markOp,
          transform: `translateY(${markY}px)`,
        }}
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-[#f2ece0] drop-shadow-[0_2px_30px_rgba(229,155,19,0.3)]">
          legado<span className="text-[#E59B13]">.dev</span>
        </h1>
        <p
          className="mt-4 text-xs md:text-sm uppercase tracking-[0.4em] text-white/40 font-medium"
          style={{ opacity: tagOp }}
        >
          Sua história não será esquecida
        </p>
      </div>
    </div>
  );
}
