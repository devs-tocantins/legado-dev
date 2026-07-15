"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";
import { m } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────────────────
const CUBE_SIZE = 1.4;
const S = CUBE_SIZE;
const INTRO_END = 5.0; // seconds — intro choreography length

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
  gray: { start: 0.2, land: 0.9, from: [0, 15, 12] },
  blueBase: { start: 0.7, land: 1.4, from: [-20, 0, 0] },
  blueRight: { start: 1.2, land: 1.9, from: [20, 0, 0] },
  blueMid: { start: 1.8, land: 2.5, from: [0, -18, -8] },
  gold: { start: 2.4, land: 3.1, from: [0, -22, -8] },
};

interface Palette {
  top: string;
  bottom: string;
  front: string;
  back: string;
  right: string;
  left: string;
}

const PAL3D_DARK: Record<string, Palette> = {
  gold: {
    top: "#F2B13E",
    bottom: "#7A4A00",
    front: "#E59B13",
    back: "#E59B13",
    right: "#F2B13E",
    left: "#F2B13E",
  },
  blue: {
    top: "#1C4B92",
    bottom: "#0C2450",
    front: "#1C4B92",
    back: "#1C4B92",
    right: "#2458A8",
    left: "#2458A8",
  },
  gray: {
    top: "#DDDDDD",
    bottom: "#A8A8A8",
    front: "#DDDDDD",
    back: "#DDDDDD",
    right: "#EAEAEA",
    left: "#EAEAEA",
  },
};

const PAL3D_LIGHT: Record<string, Palette> = {
  gold: {
    top: "#F2B13E",
    bottom: "#D49E4D",
    front: "#E59B13",
    back: "#E59B13",
    right: "#F2B13E",
    left: "#F2B13E",
  },
  blue: {
    top: "#3B82F6",
    bottom: "#4B70B0",
    front: "#3B82F6",
    back: "#2563EB",
    right: "#3B82F6",
    left: "#3B82F6",
  },
  gray: {
    top: "#F9FAFB",
    bottom: "#9CA3AF",
    front: "#E5E7EB",
    back: "#D1D5DB",
    right: "#D1D5DB",
    left: "#F9FAFB",
  },
};

// A cube's 6 face materials, in the order three.js expects for BoxGeometry
// groups: [+x, -x, +y, -y, +z, -z] → [right, left, top, bottom, front, back].
function buildPaletteMaterials(
  palette: Palette,
  isDark: boolean
): THREE.MeshStandardMaterial[] {
  const props = {
    roughness: isDark ? 0.4 : 0.6,
    metalness: isDark ? 0.1 : 0.0,
  };
  return [
    new THREE.MeshStandardMaterial({ color: palette.right, ...props }),
    new THREE.MeshStandardMaterial({ color: palette.left, ...props }),
    new THREE.MeshStandardMaterial({ color: palette.top, ...props }),
    new THREE.MeshStandardMaterial({ color: palette.bottom, ...props }),
    new THREE.MeshStandardMaterial({ color: palette.front, ...props }),
    new THREE.MeshStandardMaterial({ color: palette.back, ...props }),
  ];
}

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

// Reveal curves for the DOM elements (wordmark / tagline / shadow). Built once
// at module load, not per frame.
const revealWordmarkOpacity = interpolate(
  [3.3, 3.8],
  [0, 1],
  Easing.easeOutCubic
);
const revealWordmarkY = interpolate([3.3, 3.9], [20, 0], Easing.easeOutBack);
const revealTagline = interpolate([4.3, 4.9], [0, 1], Easing.easeOutCubic);
const revealShadow = interpolate([0.2, 3.1], [0, 1]);

// ─── Device quality tiering ─────────────────────────────────────────────────
// Decided ONCE on the client. Everything expensive (DPR ceiling, MSAA, particle
// count) scales off this so the same scene stays smooth from a flagship down to
// a weak Android, instead of forcing every device to pay the desktop cost.
type QualityTier = "low" | "medium" | "high";

interface Quality {
  tier: QualityTier;
  dprMax: number;
  antialias: boolean;
  particleCount: number;
  reducedMotion: boolean;
}

function detectQuality(): Quality {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return {
      tier: "high",
      dprMax: 2,
      antialias: true,
      particleCount: 60,
      reducedMotion: false,
    };
  }

  const reducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // navigator.deviceMemory / hardwareConcurrency are the cheapest reliable
  // signals for "how weak is this machine". Both are absent on some browsers,
  // so we fall back to sane middle values.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  let tier: QualityTier = "high";
  if ((mem !== undefined && mem <= 2) || (cores !== undefined && cores <= 2)) {
    tier = "low";
  } else if (isMobile || (mem !== undefined && mem <= 4)) {
    tier = "medium";
  }

  const config: Record<QualityTier, Omit<Quality, "tier" | "reducedMotion">> = {
    low: { dprMax: 1, antialias: false, particleCount: 0 },
    medium: { dprMax: 1.5, antialias: true, particleCount: 28 },
    high: { dprMax: 2, antialias: true, particleCount: 60 },
  };

  return { tier, reducedMotion: !!reducedMotion, ...config[tier] };
}

// ─── Scene (single render loop, zero per-frame React) ───────────────────────
// The whole animation — intro choreography, rotation, the content-shift, the
// particles, and even the DOM wordmark/shadow reveal — is driven from THIS one
// useFrame. Nothing here calls setState per frame, so React never re-renders
// during the animation. All mutable state lives in refs.

interface SceneRefs {
  yaw: React.MutableRefObject<number>;
  pitch: React.MutableRefObject<number>;
  dragging: React.MutableRefObject<boolean>;
  lastInteract: React.MutableRefObject<number>;
  introDone: React.MutableRefObject<boolean>;
  wordmark: React.RefObject<HTMLDivElement | null>;
  tagline: React.RefObject<HTMLDivElement | null>;
  shadow: React.RefObject<HTMLDivElement | null>;
}

function Scene({
  theme,
  quality,
  showContent,
  isMobile,
  isTablet,
  refs,
  onReady,
  onIntroComplete,
}: {
  theme: string;
  quality: Quality;
  showContent: boolean;
  isMobile: boolean;
  isTablet: boolean;
  refs: SceneRefs;
  onReady?: () => void;
  onIntroComplete?: () => void;
}) {
  const isDark = theme !== "light";
  const groupRef = useRef<THREE.Group>(null);
  const cubeRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pointsRef = useRef<THREE.Points>(null);

  // Master clock for the intro. Starts at INTRO_END when reduced-motion so the
  // scene renders its final composed state immediately.
  const clock = useRef(refs.introDone.current ? INTRO_END : 0);
  const transition = useRef(0);
  const readyFired = useRef(false);
  const introFired = useRef(false);
  const particlePhase = useRef(0);

  // Materials: built ONCE per (theme) and shared across every cube of the same
  // palette. Previously each cube rebuilt all three palettes (90 materials for
  // 5 cubes); now it's exactly 3 palettes × 6 faces = 18, disposed on change.
  const materials = useMemo(() => {
    const pal = isDark ? PAL3D_DARK : PAL3D_LIGHT;
    return {
      gold: buildPaletteMaterials(pal.gold, isDark),
      blue: buildPaletteMaterials(pal.blue, isDark),
      gray: buildPaletteMaterials(pal.gray, isDark),
    };
  }, [isDark]);

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((set) =>
        set.forEach((mtl) => mtl.dispose())
      );
    };
  }, [materials]);

  // Particle buffers — built once per (theme, count).
  const particles = useMemo(() => {
    const count = quality.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    const gold = new THREE.Color("rgb(229,155,19)");
    const blue = new THREE.Color("rgb(100,160,255)");
    const lightBlue = new THREE.Color("rgb(59,130,246)");
    const darkGold = new THREE.Color("rgb(180,123,17)");

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      const isGold = Math.random() > 0.5;
      const c = isDark ? (isGold ? gold : blue) : isGold ? darkGold : lightBlue;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      speeds[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, colors, speeds, phases, count };
  }, [isDark, quality.particleCount]);

  useFrame((state, rawDelta) => {
    // Fire onReady exactly when the first real frame paints — no artificial
    // requestIdleCallback / setTimeout / grace-period delay. The intro is
    // always seen from frame 0 because the clock only advances once we're here.
    if (!readyFired.current) {
      readyFired.current = true;
      onReady?.();
    }

    // Clamp delta. THIS is what stops the "teleport after a stall": on a slow
    // device (or after a GC pause / tab switch) a frame can be 100ms+; without
    // clamping the wall-clock intro would jump ahead and the cubes would snap.
    // Capped at ~1/30s, the animation gracefully slows instead of skipping.
    const delta = Math.min(rawDelta, 1 / 30);

    // Advance the intro clock.
    if (clock.current < INTRO_END) {
      clock.current = Math.min(clock.current + delta, INTRO_END);
    }
    // Fire intro-complete exactly once when the clock reaches the end. Kept
    // outside the advance block so reduced-motion (which starts the clock
    // already at INTRO_END) still fires it and reveals the rest of the page.
    if (!introFired.current && clock.current >= INTRO_END) {
      introFired.current = true;
      refs.introDone.current = true;
      onIntroComplete?.();
    }
    const t = clock.current;

    const group = groupRef.current;
    if (group) {
      // Idle auto-rotation once the intro is done and the user is idle.
      if (
        refs.introDone.current &&
        !refs.dragging.current &&
        !quality.reducedMotion &&
        (Date.now() - refs.lastInteract.current) / 1000 > 2.5
      ) {
        refs.yaw.current += delta * 0.25;
      }

      group.rotation.y = -refs.yaw.current;
      group.rotation.x = -refs.pitch.current;

      // Content-shift transition (logo slides left when the side panel appears).
      const target = showContent ? 1 : 0;
      transition.current = THREE.MathUtils.lerp(
        transition.current,
        target,
        delta * 2.5
      );
      const p = transition.current;

      const width = state.size.width;
      const factor = clamp((width - 480) / (1200 - 480), 0, 1);
      const baseScale = 0.5 + 0.15 * factor;
      const targetScale = 0.82;
      group.scale.setScalar(
        baseScale * THREE.MathUtils.lerp(1, targetScale, p)
      );

      const targetX = isMobile ? 0 : isTablet ? -1.6 : -2.3;
      const baseY = 1.0 - 0.2 * factor;
      const targetY = isMobile ? 1.4 : baseY;
      group.position.x = THREE.MathUtils.lerp(0, targetX, p);
      group.position.y = THREE.MathUtils.lerp(baseY, targetY, p);
    }

    // Cube entry choreography.
    for (let i = 0; i < CUBES.length; i++) {
      const mesh = cubeRefs.current[i];
      if (!mesh) continue;
      const cube = CUBES[i];
      const sch = ENTRY[cube.id as keyof typeof ENTRY];
      const [fx, fy, fz] = sch.from;

      if (t < sch.start) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      let ox = 0,
        oy = 0,
        oz = 0;
      if (t < sch.land) {
        const raw = (t - sch.start) / (sch.land - sch.start);
        const e = Easing.easeOutCubic(raw);
        ox = fx * (1 - e);
        oy = fy * (1 - e);
        oz = fz * (1 - e);
      }
      mesh.position.set(cube.x + ox, cube.y - oy, cube.z + oz);
    }

    // Particles drift (folded into the same loop — no separate rAF).
    const pts = pointsRef.current;
    if (pts && particles.count > 0) {
      particlePhase.current += delta;
      const pt = particlePhase.current;
      const arr = pts.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particles.count; i++) {
        arr[i * 3] +=
          Math.sin(pt * particles.speeds[i] + particles.phases[i]) * 0.02;
        arr[i * 3 + 1] += particles.speeds[i] * delta * 1.5;
        if (arr[i * 3 + 1] > 10) arr[i * 3 + 1] = -10;
      }
      pts.geometry.attributes.position.needsUpdate = true;
    }

    // DOM reveal (wordmark + tagline + shadow) driven by the SAME clock, so it
    // stays perfectly in sync with the 3D intro without any React re-render.
    // We only touch styles while the intro is running; afterwards they're frozen
    // at their final values.
    if (t <= INTRO_END + 0.05) {
      const wm = refs.wordmark.current;
      if (wm) {
        wm.style.opacity = String(revealWordmarkOpacity(t));
        wm.style.transform = `translateY(${revealWordmarkY(t)}px)`;
      }
      const tg = refs.tagline.current;
      if (tg) {
        tg.style.opacity = String(revealTagline(t));
      }
      const sh = refs.shadow.current;
      if (sh) {
        sh.style.opacity = String(revealShadow(t));
      }
    }
  });

  return (
    <>
      <ambientLight intensity={isDark ? 0.7 : 1.0} />
      <hemisphereLight
        intensity={isDark ? 0.4 : 0.8}
        color="#ffffff"
        groundColor={isDark ? "#1C4B92" : "#FDFBF7"}
      />
      <pointLight
        position={[0, 0, 12]}
        intensity={2.5}
        color={isDark ? "#ffffff" : "#F2B13E"}
      />
      <pointLight
        position={[5, 5, 10]}
        intensity={1.5}
        color={isDark ? "#ffffff" : "#3B82F6"}
      />

      <group ref={groupRef}>
        {CUBES.map((c, i) => (
          <mesh
            key={c.id}
            ref={(el) => {
              cubeRefs.current[i] = el;
            }}
            visible={false}
            material={
              materials[c.pal as keyof typeof materials] as THREE.Material[]
            }
          >
            <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
            <Edges color={isDark ? "#000000" : "#cccccc"} threshold={15} />
          </mesh>
        ))}
      </group>

      {particles.count > 0 && (
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particles.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[particles.colors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.06}
            vertexColors
            transparent
            opacity={isDark ? 0.6 : 0.3}
            sizeAttenuation
          />
        </points>
      )}
    </>
  );
}

// Kept for backwards-compat with the page (particles now live inside the Canvas).
export function BgParticles() {
  return null;
}

export function FXOverlay() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  // feTurbulence + mix-blend-overlay is genuinely expensive to composite over a
  // repainting WebGL canvas. Keep the (cheap) vignette everywhere, but only add
  // the film-grain layer where the device can clearly afford it.
  const [grain, setGrain] = useState(false);
  useEffect(() => {
    const q = detectQuality();
    setGrain(q.tier === "high" && !q.reducedMotion);
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isLight
            ? "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(235,228,216,0.2) 100%)"
            : "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />
      {grain && (
        <div
          className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          }}
        />
      )}
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function HeroLogo3D({
  onIntroComplete,
  onReady,
  showContent = false,
  isMobile = false,
  isTablet = false,
}: {
  onIntroComplete?: () => void;
  onReady?: () => void;
  showContent?: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [quality, setQuality] = useState<Quality | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

  const theme = resolvedTheme || "dark";
  const isDark = theme !== "light";

  const INITIAL_YAW = -0.677;
  const INITIAL_PITCH = -0.548;

  // All animation state lives in refs — the render loop reads them, React never
  // re-renders because of them.
  const yaw = useRef(INITIAL_YAW);
  const pitch = useRef(INITIAL_PITCH);
  const dragging = useRef(false);
  const lastInteract = useRef(Date.now());
  const introDone = useRef(false);
  const dragStart = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
  } | null>(null);

  const wordmarkRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const q = detectQuality();
    if (q.reducedMotion) introDone.current = true; // skip intro entirely
    setQuality(q);
  }, []);

  // Pause the render loop entirely when the hero is scrolled out of view — zero
  // GPU/CPU once you're reading the rest of the page. Only pause after the intro
  // has completed, so a fast scroll can never strand the page in a pre-intro
  // state.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const handleReady = useCallback(() => onReady?.(), [onReady]);
  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
    onIntroComplete?.();
  }, [onIntroComplete]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!introDone.current) return;
    dragging.current = true;
    lastInteract.current = Date.now();
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      yaw: yaw.current,
      pitch: pitch.current,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !dragStart.current) return;
    lastInteract.current = Date.now();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    yaw.current = dragStart.current.yaw - dx * 0.008;
    pitch.current = clamp(
      dragStart.current.pitch - dy * 0.008,
      -Math.PI * 0.45,
      Math.PI * 0.45
    );
  };

  const onPointerUp = () => {
    dragging.current = false;
    dragStart.current = null;
  };

  if (!mounted || !quality) return null;

  const sceneRefs: SceneRefs = {
    yaw,
    pitch,
    dragging,
    lastInteract,
    introDone,
    wordmark: wordmarkRef,
    tagline: taglineRef,
    shadow: shadowRef,
  };

  // Render only while on-screen OR still mid-intro; freeze (never render) once
  // the intro is done and the hero is scrolled away.
  const frameloop: "always" | "never" =
    onScreen || !introComplete ? "always" : "never";

  return (
    <div
      ref={wrapperRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="relative w-full h-full flex items-center justify-center bg-transparent cursor-grab active:cursor-grabbing touch-none select-none z-10"
    >
      {/* Shadow (opacity revealed by the render loop via shadowRef) */}
      <div
        ref={shadowRef}
        className="absolute w-[850px] h-[220px] blur-[65px] pointer-events-none"
        style={{
          top: "63%",
          opacity: 0,
          background: isDark
            ? `radial-gradient(ellipse at center, rgba(229,155,19,0.4) 0%, rgba(28,75,146,0.25) 45%, transparent 70%)`
            : `radial-gradient(ellipse at center, rgba(229,155,19,0.15) 0%, rgba(100,160,255,0.05) 45%, transparent 70%)`,
        }}
      />

      {/* Single 3D Canvas for all elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 35 }}
          dpr={[1, quality.dprMax]}
          frameloop={frameloop}
          performance={{ min: 0.5 }}
          gl={{
            antialias: quality.antialias,
            powerPreference: "high-performance",
            alpha: true,
          }}
        >
          <Scene
            theme={theme}
            quality={quality}
            showContent={showContent}
            isMobile={isMobile}
            isTablet={isTablet}
            refs={sceneRefs}
            onReady={handleReady}
            onIntroComplete={handleIntroComplete}
          />
        </Canvas>
      </div>

      {/* Wordmark. Outer element owns the content-shift (framer). Inner element
          owns the intro reveal (opacity + translateY via the render loop). They
          animate different property spaces, so they never fight. */}
      <m.div
        className="absolute left-0 right-0 text-center pointer-events-none"
        style={{
          top: isMobile ? "62%" : "auto",
          bottom: isMobile ? "auto" : "24%",
        }}
        animate={{
          x: showContent ? (isMobile ? 0 : isTablet ? "-16%" : "-22%") : 0,
          y: showContent ? (isMobile ? "-55%" : 0) : 0,
          scale: showContent ? 0.82 : 1,
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          ref={wordmarkRef}
          style={{
            opacity: introDone.current ? 1 : 0,
            willChange: "opacity, transform",
          }}
        >
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: isDark ? "#f2ece0" : "#1a1a1a",
              textShadow: isDark
                ? "0 2px 40px rgba(229,155,19,0.3)"
                : "0 2px 20px rgba(0,0,0,0.05)",
            }}
          >
            <span>legado</span>
            <span style={{ color: "#E59B13" }}>.dev</span>
          </div>
          <div
            ref={taglineRef}
            style={{
              marginTop: 12,
              opacity: introDone.current ? 1 : 0,
              fontSize: "clamp(0.55rem, 1.4vw, 0.8rem)",
              fontWeight: 400,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: isDark ? "rgba(242,236,224,0.55)" : "rgba(0,0,0,0.5)",
            }}
          >
            Sua história não será esquecida
          </div>
        </div>
      </m.div>
    </div>
  );
}
