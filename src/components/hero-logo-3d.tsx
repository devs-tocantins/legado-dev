"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────

const CUBE_SIZE = 140;
const S = CUBE_SIZE;

interface CubeData {
  id: string;
  pal: string;
  x: number;
  y: number;
  z: number;
}

const CUBES: CubeData[] = [
  { id: "blueBase", pal: "blue", x: -S / 2, y: -S, z: -S / 2 },
  { id: "blueMid", pal: "blue", x: -S / 2, y: 0, z: -S / 2 },
  { id: "gold", pal: "gold", x: -S / 2, y: S, z: -S / 2 },
  { id: "gray", pal: "gray", x: -S / 2, y: -S, z: S / 2 },
  { id: "blueRight", pal: "blue", x: S / 2, y: -S, z: S / 2 },
];

const ENTRY = {
  gray: { start: 0.2, land: 0.9, from: [0, 1500, 1200] },
  blueBase: { start: 0.7, land: 1.4, from: [-2000, 0, 0] },
  blueRight: { start: 1.2, land: 1.9, from: [2000, 0, 0] },
  blueMid: { start: 1.8, land: 2.5, from: [0, 1800, -800] },
  gold: { start: 2.4, land: 3.1, from: [0, 2200, -800] },
};

interface Palette {
  top: string;
  bottom: string;
  front: string;
  back: string;
  right: string;
  left: string;
}

const PAL3D: Record<string, Palette> = {
  gold: {
    top: "#F2B13E",
    bottom: "#7A4A00",
    front: "#E59B13",
    back: "#A55E00",
    right: "#C67402",
    left: "#E59B13",
  },
  blue: {
    top: "#2458A8",
    bottom: "#061635",
    front: "#1C4B92",
    back: "#0C2450",
    right: "#13356D",
    left: "#1C4B92",
  },
  gray: {
    top: "#EAEAEA",
    bottom: "#7E7E7E",
    front: "#DDDDDD",
    back: "#A8A8A8",
    right: "#BDBDBD",
    left: "#D4D4D4",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const Easing = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
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
        return output[i] + (output[i + 1] - output[i]) * ease(local);
      }
    }
    return output[output.length - 1];
  };
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function Cube3DFaces({ size, palette }: { size: number; palette: Palette }) {
  const h = size / 2;
  const faceStyle: React.CSSProperties = {
    position: "absolute",
    width: size,
    height: size,
    left: -h,
    top: -h,
    boxShadow: `inset 0 0 0 1.2px rgba(0,0,0,0.18)`,
    backfaceVisibility: "hidden",
  };
  return (
    <>
      <div
        style={{
          ...faceStyle,
          background: palette.top,
          transform: `rotateX(90deg) translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.bottom,
          transform: `rotateX(-90deg) translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.left,
          transform: `rotateY(-90deg) translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.right,
          transform: `rotateY(90deg) translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.front,
          transform: `translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.back,
          transform: `rotateY(180deg) translateZ(${h}px)`,
        }}
      />
    </>
  );
}

function CubeInScene({ cube, time }: { cube: CubeData; time: number }) {
  const sch = ENTRY[cube.id as keyof typeof ENTRY];
  const [fx, fy, fz] = sch.from;

  let ox = 0;
  let oy = 0;
  let oz = 0;
  let visible = true;
  if (time < sch.start) {
    visible = false;
  } else if (time < sch.land) {
    const p = (time - sch.start) / (sch.land - sch.start);
    const ease = Easing.easeOutCubic(p);
    ox = fx * (1 - ease);
    oy = fy * (1 - ease);
    oz = fz * (1 - ease);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        transformStyle: "preserve-3d",
        transform: `translate3d(${cube.x + ox}px, ${-cube.y + oy}px, ${cube.z + oz}px)`,
      }}
    >
      <Cube3DFaces size={CUBE_SIZE} palette={PAL3D[cube.pal]} />
    </div>
  );
}

export function BgParticles() {
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    let lastTs = t0;
    
    const step = (ts: number) => {
      const elapsed = (ts - t0) / 1000;
      
      // Stop particles after 10 seconds to ensure CPU idles for Lighthouse
      if (elapsed > 10) return;
      
      // Throttle to ~24fps
      if (ts - lastTs > 41) {
        setT(elapsed);
        lastTs = ts;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seeds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        speed: 0.08 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? "gold" : "blue",
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {seeds.map((p, i) => {
        const drift = Math.sin(t * p.speed + p.phase) * 20;
        const y = (p.y + t * p.speed * 25) % 100;
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
              background: `rgba(${color},${twinkle * 0.8})`,
              boxShadow: `0 0 ${p.size * 4}px rgba(${color},${twinkle * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
}

export function FXOverlay() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none z-30"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function HeroLogo3D({
  onIntroComplete,
  onReady,
}: {
  onIntroComplete?: () => void;
  onReady?: () => void;
}) {
  const INITIAL_YAW = 0.894;
  const INITIAL_PITCH = -0.548;
  const zoom = 0.72;

  const [yaw, setYaw] = useState(INITIAL_YAW);
  const [pitch, setPitch] = useState(INITIAL_PITCH);
  const [time, setTime] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const lastInteract = useRef(Date.now());
  const dragStart = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const startLoop = () => {
      onReady?.();
      const t0 = performance.now();
      const step = (ts: number) => {
        if (lastTsRef.current === null) lastTsRef.current = ts;
        const dt = (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;

        const t = (ts - t0) / 1000;
        if (!introDone) {
          if (t > 5.0) {
            setTime(5.0);
            setIntroDone(true);
            onIntroComplete?.();
          } else {
            setTime(t);
          }
        }

        const idleFor = (Date.now() - lastInteract.current) / 1000;
        if (introDone && !dragging && idleFor > 2.5) {
          setYaw((y) => y + dt * 0.25);
        }

        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    };

    // Defer heavy calculation until the main thread is idle and the page has painted
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        timer = setTimeout(startLoop, 100);
      });
    } else {
      timer = setTimeout(startLoop, 500);
    }

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone, dragging]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!introDone) return;
    setDragging(true);
    lastInteract.current = Date.now();
    dragStart.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    
    // Restart loop for dragging
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const stepDrag = (ts: number) => {
       if (lastTsRef.current === null) lastTsRef.current = ts;
       lastTsRef.current = ts;
       // Just keep the loop alive so yaw/pitch changes are rendered
       rafRef.current = requestAnimationFrame(stepDrag);
    };
    rafRef.current = requestAnimationFrame(stepDrag);
  };
  
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    lastInteract.current = Date.now();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setYaw(dragStart.current.yaw + dx * 0.008);
    setPitch(
      clamp(
        dragStart.current.pitch + dy * 0.008,
        -Math.PI * 0.45,
        Math.PI * 0.45
      )
    );
  };

  const onPointerUp = () => {
    setDragging(false);
    dragStart.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const yawDeg = (yaw * 180) / Math.PI;
  const pitchDeg = (pitch * 180) / Math.PI;

  const markOp = interpolate([3.3, 3.8], [0, 1], Easing.easeOutCubic)(time);
  const markY = interpolate([3.3, 3.9], [20, 0], Easing.easeOutBack)(time);
  const tagOp = interpolate([4.3, 4.9], [0, 1], Easing.easeOutCubic)(time);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="relative w-full h-full flex items-center justify-center bg-transparent cursor-grab active:cursor-grabbing touch-none select-none z-10"
    >
      {/* Shadow */}
      <div
        className="absolute w-[850px] h-[220px] blur-[65px] pointer-events-none"
        style={{
          top: "63%",
          background: `radial-gradient(ellipse at center, rgba(229,155,19,0.4) 0%, rgba(28,75,146,0.25) 45%, transparent 70%)`,
          opacity: interpolate([0.2, 3.1], [0, 1])(time),
        }}
      />

      {/* 3D Stage */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          width: 0,
          height: 0,
          perspective: "1800px",
        }}
      >
        <div
          style={{
            position: "absolute",
            transformStyle: "preserve-3d",
            transform: `scale(${zoom}) rotateX(${pitchDeg}deg) rotateY(${yawDeg}deg)`,
          }}
        >
          {CUBES.map((c) => (
            <CubeInScene key={c.id} cube={c} time={time} />
          ))}
        </div>
      </div>

      {/* Wordmark */}
      <div
        className="absolute left-0 right-0 bottom-16 md:bottom-24 text-center pointer-events-none"
        style={{ opacity: markOp, transform: `translateY(${markY}px)` }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#f2ece0",
            textShadow: "0 2px 40px rgba(229,155,19,0.3)",
          }}
        >
          <span>legado</span>
          <span style={{ color: "#E59B13" }}>.dev</span>
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: "clamp(0.55rem, 1.4vw, 0.8rem)",
            fontWeight: 400,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(242,236,224,0.55)",
            opacity: tagOp,
          }}
        >
          Sua história não será esquecida
        </div>
      </div>
    </div>
  );
}
