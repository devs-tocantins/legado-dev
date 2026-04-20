// scene.jsx — 5-cube isometric logo reveal.
// Grid: (gx, gy, gz) where gx goes right-forward, gy goes left-forward, gz goes up.
//
// Layout matching the SVG's stepped arrangement:
//   Top level (gz=2):  gold (0,0,2)   +   blueA (1,0,2)  — the two top cubes
//   Mid level (gz=1):  blueB (0,1,1)  +   (gray sits visually)
//   Base level (gz=0): blueB (0,1,0)  + gray (0.5, 0.5, 0) center platform
//
// Paint order (back→front): higher gy first, then lower gz, then lower gx.

const DUR = 5;

// Cube manifest. Paint order matters for iso: back-to-front.
// Computed z-sort = gx + gy - gz*2 (lower = further back, painted first)
// Layout matches the source logo exactly — an "L" shape:
//   Left tower (3 stacked): gold top, dark-blue middle, blue bottom (all gy=1)
//   Base foot extending front/right: gray front-center + blue right
// Grid: gx = right, gy = back (higher = further from viewer), gz = up
const CUBES = [
  { id: "gold", tone: "gold", gx: 0, gy: 1, gz: 2 }, // tower top
  { id: "blueMid", tone: "blue", gx: 0, gy: 1, gz: 1 }, // tower middle
  { id: "blueBase", tone: "blue", gx: 0, gy: 1, gz: 0 }, // tower bottom
  { id: "gray", tone: "gray", gx: 0, gy: 0, gz: 0 }, // foot front
  { id: "blueRight", tone: "blue", gx: 1, gy: 0, gz: 0 }, // foot right
];

// Animation schedule — each cube enters from a direction that doesn't cross
// any other cube's final resting position. Staggered so nothing moves while
// an earlier cube is still settling into the same neighborhood.
const SCHED = {
  // Cubos montam em ~3s, com sobreposição maior pra sensação de ritmo rápido.
  gray: { start: 0.2, land: 0.9, from: "topFront" },
  blueBase: { start: 0.7, land: 1.4, from: "farLeft" },
  blueRight: { start: 1.2, land: 1.9, from: "farRight" },
  blueMid: { start: 1.8, land: 2.5, from: "above" },
  gold: { start: 2.4, land: 3.1, from: "above" },
};

function Scene() {
  const t = useTime();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 55%, #0d1326 0%, #050812 55%, #020307 100%)",
        overflow: "hidden",
      }}
    >
      <Particles />

      {/* The iso stage — plain 2D container, cubes are SVG. Shifted up to leave room for wordmark. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "-8%",
          bottom: 0,
          pointerEvents: "none",
        }}
      >
        <GroundShadow t={t} />

        {/* Cubes, sorted back-to-front for proper overlap */}
        {sortedCubes().map((c) => (
          <AnimatedCube key={c.id} cube={c} t={t} />
        ))}
      </div>

      <Vignette />
      <Wordmark t={t} />
      <FilmGrain />
    </div>
  );
}

function sortedCubes() {
  // Painter's algorithm for iso. Back-to-front means:
  //  - Further back (higher gy) drawn first (smaller sort value)
  //  - Further left (lower gx) drawn first
  //  - Lower gz drawn first
  return [...CUBES].sort((a, b) => {
    // Sort by depth: -gy (back first), -gx (left first), gz (bottom first)
    const za = -a.gy * 100 + -a.gx * 10 + a.gz;
    const zb = -b.gy * 100 + -b.gx * 10 + b.gz;
    return za - zb;
  });
}

function AnimatedCube({ cube, t }) {
  const { start, land, from } = SCHED[cube.id];
  if (t < start) return null;

  const p = clamp((t - start) / (land - start), 0, 1);
  // Use easeOutCubic — no overshoot — so cubes never briefly enter each other's
  // final positions past the landing point.
  const ease = Easing.easeOutCubic(p);

  // Entry vectors chosen so the path never crosses another cube's final cell.
  //   topFront   — straight down, offset slightly toward camera (safe front-drop)
  //   farLeft    — pure horizontal from off-screen left at ground level
  //   farRight   — pure horizontal from off-screen right at ground level
  //   above      — straight vertical from high above (tower cubes)
  let dx0 = 0,
    dy0 = 0;
  if (from === "topFront") {
    dx0 = 0;
    dy0 = -1300;
  } else if (from === "farLeft") {
    dx0 = -1600;
    dy0 = 0;
  } else if (from === "farRight") {
    dx0 = 1600;
    dy0 = 0;
  } else if (from === "above") {
    dx0 = 0;
    dy0 = -1800;
  }

  const dx = dx0 * (1 - ease);
  const dy = dy0 * (1 - ease);
  const opacity = interpolate([0, 0.15], [0, 1])(p);

  // Tiny squash on landing so it feels weighty without overshooting the position.
  // Squash is applied ONLY via scale (which is centered on the cube itself),
  // so it can't bleed into a neighbor.
  let scaleX = 1,
    scaleY = 1;
  if (p > 0.88 && p < 1.0) {
    const sp = (p - 0.88) / 0.12;
    const squash = Math.sin(sp * Math.PI) * 0.06;
    if (from === "above" || from === "topFront") {
      scaleX = 1 + squash;
      scaleY = 1 - squash;
    } else {
      scaleX = 1 - squash;
      scaleY = 1 + squash;
    }
  }

  const glow = interpolate(
    [land - 0.05, land + 0.05, land + 0.5],
    [0, 1, 0],
    Easing.easeOutQuad
  )(t);

  return (
    <IsoCube
      gx={cube.gx}
      gy={cube.gy}
      gz={cube.gz}
      dx={dx}
      dy={dy}
      scale={1}
      scaleX={scaleX}
      scaleY={scaleY}
      opacity={opacity}
      glow={glow}
      tone={FACE[cube.tone]}
    />
  );
}

// ── FX ────────────────────────────────────────────────────────────────────

function GroundShadow({ t }) {
  const intensity = interpolate(
    [0.2, 0.9, 1.9, 3.1, 5.0],
    [0, 0.3, 0.6, 1.0, 1.0],
    Easing.easeOutCubic
  )(t);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "62%",
        width: 900,
        height: 280,
        marginLeft: -450,
        background: `radial-gradient(ellipse at center, rgba(229,155,19,${0.35 * intensity}) 0%, rgba(28,75,146,${0.25 * intensity}) 45%, transparent 75%)`,
        filter: "blur(50px)",
        pointerEvents: "none",
      }}
    />
  );
}

function LightSweep({ t }) {
  const start = 6.0,
    end = 8.0;
  if (t < start || t > end) return null;
  const progress = (t - start) / (end - start);
  const x = interpolate([0, 1], [-700, 700], Easing.easeInOutCubic)(progress);
  const opacity = interpolate([0, 0.2, 0.8, 1], [0, 0.8, 0.8, 0])(progress);

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${x}px - 80px)`,
        top: "15%",
        width: 160,
        height: "65%",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 50%, transparent)",
        transform: "rotate(15deg)",
        filter: "blur(14px)",
        opacity,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
}

function Vignette() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

function Particles() {
  const t = useTime();
  const seeds = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      arr.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        size: 1 + Math.random() * 2.5,
        speed: 0.08 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? "gold" : "blue",
      });
    }
    return arr;
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {seeds.map((p, i) => {
        const drift = Math.sin(t * p.speed + p.phase) * 20;
        const y = (p.y + t * p.speed * 25) % 1080;
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 2 + p.phase));
        const color = p.hue === "gold" ? "229,155,19" : "100,160,255";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x + drift,
              top: y,
              width: p.size,
              height: p.size,
              borderRadius: p.size,
              background: `rgba(${color},${twinkle * 0.8})`,
              boxShadow: `0 0 ${p.size * 4}px rgba(${color},${twinkle * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
}

function FilmGrain() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        opacity: 0.35,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
}

function Wordmark({ t }) {
  const start = 3.3;
  if (t < start) return null;

  const tagOp = interpolate(
    [start + 1.0, start + 1.6],
    [0, 1],
    Easing.easeOutCubic
  )(t);
  const markOp = interpolate(
    [start, start + 0.5],
    [0, 1],
    Easing.easeOutCubic
  )(t);
  const markY = interpolate(
    [start, start + 0.6],
    [20, 0],
    Easing.easeOutBack
  )(t);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 60,
        textAlign: "center",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        color: "#f2ece0",
        pointerEvents: "none",
        opacity: markOp,
        transform: `translateY(${markY}px)`,
      }}
    >
      <div
        style={{
          fontSize: 68,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          textShadow: "0 2px 40px rgba(229,155,19,0.3)",
        }}
      >
        <span style={{ color: "#f2ece0" }}>legado</span>
        <span style={{ color: "#E59B13" }}>.dev</span>
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 16,
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
  );
}

function App() {
  const [label, setLabel] = React.useState("0.0s");
  React.useEffect(() => {
    const id = setInterval(() => {
      try {
        const v = parseFloat(localStorage.getItem("legado-anim:t") || "0");
        setLabel(`${v.toFixed(1)}s`);
      } catch {}
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div data-screen-label={label}>
      <Stage
        width={1920}
        height={1080}
        duration={DUR}
        persistKey="legado-anim"
        background="#020307"
        loop={true}
      >
        <Scene />
      </Stage>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
