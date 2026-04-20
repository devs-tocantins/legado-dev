// orbit3d.jsx — fully rotatable 3D logo using pure CSS 3D transforms.
// Structure (CRITICAL — preserve-3d must be unbroken):
//   <perspective-parent>                 ← has `perspective`
//     <rotator preserve-3d>              ← rotates whole scene
//       <cube-wrapper preserve-3d>       ← one per cube, positioned in world
//         <6 face divs>                  ← each uses translateZ to pop out
//
// NO extra nesting between rotator and faces. NO opacity/filter/overflow
// on any wrapper that has preserve-3d (it flattens 3D).

const CUBE_SIZE = 200;
const S = CUBE_SIZE;

// 5 cubes, L-shape. World: +X right, +Y up, +Z toward camera.
const CUBES = [
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

function clampPitch(p) {
  const max = Math.PI * 0.9;
  return Math.max(-max, Math.min(max, p));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function Orbit3D() {
  // Pose inicial — capturada da posição que o usuário travou.
  // Esse é o estado de "pausa" / tela inicial da logo.
  const INITIAL_YAW = 0.894; // ≈ 51.19° (gira pra esquerda, mostra face frontal)
  const INITIAL_PITCH = -0.548; // ≈ -31.4° (inclina pra baixo, mostra topo)
  const INITIAL_ZOOM = 0.66; // logo ocupa ~22% W × 51% H da tela

  const [yaw, setYaw] = React.useState(INITIAL_YAW);
  const [pitch, setPitch] = React.useState(INITIAL_PITCH);
  const [zoom, setZoom] = React.useState(INITIAL_ZOOM);
  const [time, setTime] = React.useState(0);
  const [introDone, setIntroDone] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const lastInteract = React.useRef(Date.now());
  const dragStart = React.useRef(null);

  // Intro clock
  React.useEffect(() => {
    let raf;
    const t0 = performance.now();
    const step = (ts) => {
      const t = (ts - t0) / 1000;
      setTime(t);
      if (t > 3.5) {
        setIntroDone(true);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-rotate when idle
  React.useEffect(() => {
    if (!introDone) return;
    let raf,
      lastTs = null;
    const step = (ts) => {
      if (lastTs == null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const idleFor = (Date.now() - lastInteract.current) / 1000;
      if (!dragging && idleFor > 2) {
        setYaw((y) => y + dt * 0.3);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [introDone, dragging]);

  const onPointerDown = (e) => {
    setDragging(true);
    lastInteract.current = Date.now();
    dragStart.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging || !dragStart.current) return;
    lastInteract.current = Date.now();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setYaw(dragStart.current.yaw + dx * 0.008);
    setPitch(clampPitch(dragStart.current.pitch + dy * 0.008));
  };
  const onPointerUp = () => {
    setDragging(false);
    dragStart.current = null;
    lastInteract.current = Date.now();
  };
  const onWheel = (e) => {
    e.preventDefault();
    lastInteract.current = Date.now();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * factor)));
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        resetView();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resetView = () => {
    setYaw(INITIAL_YAW);
    setPitch(INITIAL_PITCH);
    setZoom(INITIAL_ZOOM);
    lastInteract.current = Date.now();
  };

  const yawDeg = (yaw * 180) / Math.PI;
  const pitchDeg = (pitch * 180) / Math.PI;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 50%, #0d1326 0%, #050812 55%, #020307 100%)",
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <BgParticles />

      {/* 3D stage — perspective at 50%/50%, rotator inside */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          perspective: "2200px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* Rotator: direct parent of cubes, preserve-3d */}
        <div
          style={{
            position: "absolute",
            transformStyle: "preserve-3d",
            transform: `scale(${zoom}) rotateX(${pitchDeg}deg) rotateY(${yawDeg}deg)`,
            willChange: "transform",
          }}
        >
          {CUBES.map((c) => (
            <CubeInScene key={c.id} cube={c} time={time} />
          ))}
        </div>
      </div>

      <Vignette3D />
      <UI onReset={resetView} />
      <Wordmark3D visible={introDone} />
    </div>
  );
}

// CRITICAL: this wrapper IS the preserve-3d container for the 6 faces.
// Its transform positions the cube in world space; its children (the faces)
// inherit 3D context directly. NO opacity, filter, will-change on this div.
function CubeInScene({ cube, time }) {
  const sch = ENTRY[cube.id];
  const [fx, fy, fz] = sch.from;

  let ox = 0,
    oy = 0,
    oz = 0,
    visible = true;
  if (time < sch.start) {
    visible = false;
  } else if (time < sch.land) {
    const p = (time - sch.start) / (sch.land - sch.start);
    const ease = easeOutCubic(p);
    ox = fx * (1 - ease);
    oy = fy * (1 - ease);
    oz = fz * (1 - ease);
  }

  if (!visible) return null;

  // Flip Y: CSS +Y is down, but our world +Y is up
  const worldX = cube.x + ox;
  const worldY = -cube.y + oy;
  const worldZ = cube.z + oz;

  return (
    <div
      style={{
        position: "absolute",
        transformStyle: "preserve-3d",
        transform: `translate3d(${worldX}px, ${worldY}px, ${worldZ}px)`,
      }}
    >
      <Cube3DFaces size={CUBE_SIZE} palette={PAL3D[cube.pal]} />
    </div>
  );
}

function UI({ onReset }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 24,
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          color: "rgba(242,236,224,0.6)",
          fontSize: 12,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        legado.dev · 3d view
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 32,
          transform: "translateX(-50%)",
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          color: "rgba(242,236,224,0.45)",
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          display: "flex",
          gap: 24,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span>
          <Kbd>drag</Kbd> rotate
        </span>
        <span>
          <Kbd>scroll</Kbd> zoom
        </span>
        <span>
          <Kbd>space</Kbd> reset
        </span>
      </div>
      <button
        onClick={onReset}
        style={{
          position: "absolute",
          right: 24,
          top: 24,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(242,236,224,0.85)",
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "8px 14px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Reset
      </button>
    </>
  );
}

function Kbd({ children }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        marginRight: 6,
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 3,
        background: "rgba(255,255,255,0.04)",
        color: "rgba(242,236,224,0.75)",
      }}
    >
      {children}
    </span>
  );
}

function Vignette3D() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

function Wordmark3D({ visible }) {
  const [opacity, setOpacity] = React.useState(0);
  React.useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(t);
  }, [visible]);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 90,
        transform: "translateX(-50%)",
        textAlign: "center",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        pointerEvents: "none",
        opacity,
        transition: "opacity 800ms ease-out",
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "#f2ece0",
        }}
      >
        <span>legado</span>
        <span style={{ color: "#E59B13" }}>.dev</span>
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          fontWeight: 400,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(242,236,224,0.5)",
        }}
      >
        Sua história não será esquecida
      </div>
    </div>
  );
}

function BgParticles() {
  const seeds = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        hue: Math.random() > 0.5 ? "gold" : "blue",
        opacity: 0.2 + Math.random() * 0.4,
      });
    }
    return arr;
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {seeds.map((p, i) => {
        const color = p.hue === "gold" ? "229,155,19" : "100,160,255";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x + "%",
              top: p.y + "%",
              width: p.size,
              height: p.size,
              borderRadius: p.size,
              background: `rgba(${color},${p.opacity})`,
              boxShadow: `0 0 ${p.size * 5}px rgba(${color},${p.opacity * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Orbit3D />);
