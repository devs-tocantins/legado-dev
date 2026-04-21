"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "next-themes";
import { m } from "framer-motion";

// ─── Constants ──────────────────────────────────────────────────────────────
const CUBE_SIZE = 1.4;
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

function getMaterialsForPalette(palette: Palette, theme: string) {
  const isDark = theme !== "light";
  const materialProps = {
    roughness: isDark ? 0.4 : 0.6,
    metalness: isDark ? 0.1 : 0.0,
  };

  return [
    new THREE.MeshStandardMaterial({ color: palette.right, ...materialProps }),
    new THREE.MeshStandardMaterial({ color: palette.left, ...materialProps }),
    new THREE.MeshStandardMaterial({ color: palette.top, ...materialProps }),
    new THREE.MeshStandardMaterial({ color: palette.bottom, ...materialProps }),
    new THREE.MeshStandardMaterial({ color: palette.front, ...materialProps }),
    new THREE.MeshStandardMaterial({ color: palette.back, ...materialProps }),
  ];
}

const MATERIAL_MAP = (theme: string) => {
  const pal = theme === "light" ? PAL3D_LIGHT : PAL3D_DARK;
  return {
    gold: getMaterialsForPalette(pal.gold, theme),
    blue: getMaterialsForPalette(pal.blue, theme),
    gray: getMaterialsForPalette(pal.gray, theme),
  };
};

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

// ─── Scene Components ───────────────────────────────────────────────────────

function CubeInScene({
  cube,
  time,
  theme,
  isMobile,
}: {
  cube: CubeData;
  time: number;
  theme: string;
  isMobile?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sch = ENTRY[cube.id as keyof typeof ENTRY];
  const [fx, fy, fz] = sch.from;

  const materials = useMemo(() => MATERIAL_MAP(theme), [theme]);

  useFrame(() => {
    if (!meshRef.current) return;

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

    meshRef.current.visible = visible;
    meshRef.current.position.set(cube.x + ox, cube.y - oy, cube.z + oz);
  });

  return (
    <mesh
      ref={meshRef}
      material={materials[cube.pal as keyof typeof materials]}
    >
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      {!isMobile && (
        <Edges
          color={theme === "light" ? "#cccccc" : "#000000"}
          threshold={15}
        />
      )}
    </mesh>
  );
}

function Scene3D({
  time,
  yaw,
  pitch,
  theme,
  showContent,
  isMobile,
  isTablet,
  transitionProgress,
}: {
  time: number;
  yaw: number;
  pitch: number;
  theme: string;
  showContent: boolean;
  isMobile: boolean;
  isTablet: boolean;
  transitionProgress: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -yaw;
      groupRef.current.rotation.x = -pitch;

      // Lerp transition progress
      const target = showContent ? 1 : 0;
      transitionProgress.current = THREE.MathUtils.lerp(
        transitionProgress.current,
        target,
        delta * 2.5
      );
      const p = transitionProgress.current;

      // Continuous smooth scaling logic based on viewport width
      const width = state.size.width;
      const factor = Math.min(Math.max((width - 480) / (1200 - 480), 0), 1);

      const baseScale = 0.5 + 0.15 * factor;
      const targetScale = 0.82;
      groupRef.current.scale.setScalar(
        baseScale * THREE.MathUtils.lerp(1, targetScale, p)
      );

      // Calculate offsets based on responsive state - Adjusted to be slightly more to the right
      const targetX = isMobile ? 0 : isTablet ? -1.6 : -2.3;
      const baseY = 1.0 - 0.2 * factor;
      const targetY = isMobile ? 1.4 : baseY;

      groupRef.current.position.x = THREE.MathUtils.lerp(0, targetX, p);
      groupRef.current.position.y = THREE.MathUtils.lerp(baseY, targetY, p);
    }
  });

  return (
    <group ref={groupRef}>
      {CUBES.map((c) => (
        <CubeInScene
          key={c.id}
          cube={c}
          time={time}
          theme={theme}
          isMobile={isMobile}
        />
      ))}
    </group>
  );
}

function ParticlesWebGL({
  theme,
  isMobile,
}: {
  theme: string;
  isMobile?: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const particleCount = isMobile ? 30 : 60;

  const particles = useMemo(() => {
    const arr = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    const gold = new THREE.Color("rgb(229,155,19)");
    const blue = new THREE.Color("rgb(100,160,255)");
    const lightBlue = new THREE.Color("rgb(59,130,246)");
    const darkGold = new THREE.Color("rgb(180,123,17)");

    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5;

      const isGold = Math.random() > 0.5;
      let c;
      if (theme === "light") {
        c = isGold ? darkGold : lightBlue;
      } else {
        c = isGold ? gold : blue;
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 1.0 + Math.random() * 2.5;
      speeds[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions: arr, colors, sizes, speeds, phases };
  }, [theme, particleCount]);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const drift =
        Math.sin(t * particles.speeds[i] + particles.phases[i]) * 0.02;
      positions[i * 3] += drift;
      positions[i * 3 + 1] += particles.speeds[i] * delta * 1.5;

      if (positions[i * 3 + 1] > 10) {
        positions[i * 3 + 1] = -10;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent={!isMobile}
        opacity={theme === "light" ? 0.3 : 0.6}
        sizeAttenuation
      />
    </points>
  );
}

export function BgParticles() {
  return null;
}

export function FXOverlay() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

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
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
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
  useEffect(() => setMounted(true), []);

  const theme = resolvedTheme || "dark";

  const INITIAL_YAW = -0.677;
  const INITIAL_PITCH = -0.548;

  const [time, setTime] = useState(0);
  const [yaw, setYaw] = useState(INITIAL_YAW);
  const [pitch, setPitch] = useState(INITIAL_PITCH);
  const [introDone, setIntroDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Transition states for internal animation
  const transitionProgress = useRef(0);

  const lastInteract = useRef(Date.now());
  const dragStart = useRef<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
  } | null>(null);

  useEffect(() => {
    let raf: number;
    let t0: number;
    let isActive = true;

    const init = () => {
      onReady?.();
      t0 = performance.now();
      const step = (ts: number) => {
        if (!isActive) return;
        const elapsed = (ts - t0) / 1000;

        if (!introDone) {
          if (elapsed > 5.0) {
            setTime(5.0);
            setIntroDone(true);
            onIntroComplete?.();
          } else {
            setTime(elapsed);
          }
        }

        const idleFor = (Date.now() - lastInteract.current) / 1000;
        if (introDone && !dragging && idleFor > 2.5) {
          setYaw((y) => y + (1 / 60) * 0.25);
        }

        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => setTimeout(init, 100));
    } else {
      setTimeout(init, 500);
    }

    return () => {
      isActive = false;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introDone, dragging]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!introDone) return;
    setDragging(true);
    lastInteract.current = Date.now();
    dragStart.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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
  };

  if (!mounted) return null;

  if (isMobile) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-transparent touch-none select-none z-10">
        {/* Simple CSS Fallback for Mobile */}
        <div className="relative flex flex-col items-center justify-center transform scale-90">
          <div className="relative w-48 h-48 mb-8 animate-pulse">
            <img
              src="/LOGO.svg"
              alt="legado.dev"
              className="w-full h-full drop-shadow-[0_0_30px_rgba(229,155,19,0.3)]"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-heading font-bold tracking-tighter transition-colors duration-1000 dark:text-white text-slate-900">
              legado<span className="text-[#E59B13]">.dev</span>
            </h1>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
              A forja dos desenvolvedores lendários.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          background:
            theme === "light"
              ? `radial-gradient(ellipse at center, rgba(229,155,19,0.15) 0%, rgba(100,160,255,0.05) 45%, transparent 70%)`
              : `radial-gradient(ellipse at center, rgba(229,155,19,0.4) 0%, rgba(28,75,146,0.25) 45%, transparent 70%)`,
          opacity: interpolate([0.2, 3.1], [0, 1])(time),
        }}
      />

      {/* Single 3D Canvas for all elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 35 }}
          dpr={isMobile ? 1 : [1, 2]}
          performance={{ min: 0.5 }}
          gl={{
            antialias: !isMobile,
            powerPreference: "high-performance",
            alpha: true,
          }}
        >
          <ambientLight intensity={theme === "light" ? 1.0 : 0.7} />
          {theme !== "light" && !isMobile && <Environment preset="city" />}
          <hemisphereLight
            intensity={theme === "light" ? 0.8 : 0.4}
            color="#ffffff"
            groundColor={theme === "light" ? "#FDFBF7" : "#1C4B92"}
          />
          <pointLight
            position={[0, 0, 12]}
            intensity={theme === "light" ? 2.5 : 2.5}
            color={theme === "light" ? "#F2B13E" : "#ffffff"}
          />
          {!isMobile && (
            <pointLight
              position={[5, 5, 10]}
              intensity={theme === "light" ? 1.5 : 1.5}
              color={theme === "light" ? "#3B82F6" : "#ffffff"}
            />
          )}
          <Scene3D
            time={time}
            yaw={yaw}
            pitch={pitch}
            theme={theme}
            showContent={showContent}
            isMobile={isMobile}
            isTablet={isTablet}
            transitionProgress={transitionProgress}
          />
          {!isMobile && <ParticlesWebGL theme={theme} isMobile={isMobile} />}
        </Canvas>
      </div>

      {/* Wordmark */}
      <m.div
        className="absolute left-0 right-0 text-center pointer-events-none"
        style={{
          top: isMobile ? "62%" : "auto",
          bottom: isMobile ? "auto" : "24%",
          opacity: interpolate([3.3, 3.8], [0, 1], Easing.easeOutCubic)(time),
          transform: `translateY(${interpolate([3.3, 3.9], [20, 0], Easing.easeOutBack)(time)}px)`,
        }}
        animate={{
          x: showContent ? (isMobile ? 0 : isTablet ? "-16%" : "-22%") : 0,
          y: showContent ? (isMobile ? "-55%" : 0) : 0,
          scale: showContent ? 0.82 : 1,
        }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: theme === "light" ? "#1a1a1a" : "#f2ece0",
            textShadow:
              theme === "light"
                ? "0 2px 20px rgba(0,0,0,0.05)"
                : "0 2px 40px rgba(229,155,19,0.3)",
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
            color:
              theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(242,236,224,0.55)",
            opacity: interpolate([4.3, 4.9], [0, 1], Easing.easeOutCubic)(time),
          }}
        >
          Sua história não será esquecida
        </div>
      </m.div>
    </div>
  );
}
