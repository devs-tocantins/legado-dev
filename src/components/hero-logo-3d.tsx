"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

// ─── Constants ──────────────────────────────────────────────────────────────
const CUBE_SIZE = 1.4; // Scaled down by 100 for Three.js units
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

// BoxGeometry face order in Three.js is: right, left, top, bottom, front, back
function getMaterialsForPalette(palette: Palette) {
  return [
    new THREE.MeshStandardMaterial({ color: palette.right, roughness: 0.2, metalness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: palette.left, roughness: 0.2, metalness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: palette.top, roughness: 0.2, metalness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: palette.bottom, roughness: 0.2, metalness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: palette.front, roughness: 0.2, metalness: 0.4 }),
    new THREE.MeshStandardMaterial({ color: palette.back, roughness: 0.2, metalness: 0.4 }),
  ];
}

const MATERIAL_MAP = {
  gold: getMaterialsForPalette(PAL3D.gold),
  blue: getMaterialsForPalette(PAL3D.blue),
  gray: getMaterialsForPalette(PAL3D.gray),
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

function CubeInScene({ cube, time }: { cube: CubeData; time: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sch = ENTRY[cube.id as keyof typeof ENTRY];
  const [fx, fy, fz] = sch.from;

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
    <mesh ref={meshRef} material={MATERIAL_MAP[cube.pal as keyof typeof MATERIAL_MAP]}>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <Edges color="rgba(0, 0, 0, 0.45)" threshold={15} />
    </mesh>
  );
}

function Scene3D({ time, yaw, pitch }: { time: number, yaw: number, pitch: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -yaw;
      groupRef.current.rotation.x = -pitch;
    }
  });

  return (
    <group ref={groupRef} scale={0.65} position={[0, 0.8, 0]}>
      {CUBES.map((c) => (
        <CubeInScene key={c.id} cube={c} time={time} />
      ))}
    </group>
  );
}

export function BgParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ParticlesWebGL />
      </Canvas>
    </div>
  );
}

function ParticlesWebGL() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const arr = new Float32Array(60 * 3);
    const colors = new Float32Array(60 * 3);
    const sizes = new Float32Array(60);
    const speeds = new Float32Array(60);
    const phases = new Float32Array(60);
    
    const gold = new THREE.Color("rgb(229,155,19)");
    const blue = new THREE.Color("rgb(100,160,255)");
    
    for (let i = 0; i < 60; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30; // x
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5; // z
      
      const isGold = Math.random() > 0.5;
      const c = isGold ? gold : blue;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      
      sizes[i] = 1.0 + Math.random() * 2.5;
      speeds[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions: arr, colors, sizes, speeds, phases };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < 60; i++) {
      const drift = Math.sin(t * particles.speeds[i] + particles.phases[i]) * 0.02;
      positions[i * 3] += drift; // x
      positions[i * 3 + 1] += particles.speeds[i] * delta * 1.5; // y going up
      
      if (positions[i * 3 + 1] > 10) {
        positions[i * 3 + 1] = -10;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={60} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={60} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

export function FXOverlay() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)",
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
}: {
  onIntroComplete?: () => void;
  onReady?: () => void;
}) {
  const INITIAL_YAW = -0.677; // ~-38.78 degrees (rotated 180 degrees from 141.22)
  const INITIAL_PITCH = -0.548;

  const [time, setTime] = useState(0);
  const [yaw, setYaw] = useState(INITIAL_YAW);
  const [pitch, setPitch] = useState(INITIAL_PITCH);
  const [introDone, setIntroDone] = useState(false);
  const [dragging, setDragging] = useState(false);

  const lastInteract = useRef(Date.now());
  const dragStart = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

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
          setYaw((y) => y + (1/60) * 0.25);
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

      {/* 3D Stage via WebGL */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[5, 10, 10]} intensity={2.0} color="#ffffff" />
          <pointLight position={[-5, -10, 8]} intensity={3.0} color="#ffffff" />
          <Scene3D time={time} yaw={yaw} pitch={pitch} />
        </Canvas>
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
