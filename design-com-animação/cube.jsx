// cube.jsx — isometric cube drawn as 3 parallelogram faces.
// Each cube has: top (rhombus), left face, right face.
// Coordinates are in ISO grid units. Conversion:
//   iso(x, y, z) -> screen(X, Y)
//   X = (x - y) * W        (W = half-width of a tile)
//   Y = (x + y) * H - z*Z  (H = half-height of rhombus, Z = cube height)
// where x,y are ground plane grid, z is vertical stack level.

// Tile constants — tweak to resize the whole logo.
const ISO_W = 115; // half width of top rhombus
const ISO_H = 66; // half height of top rhombus
const ISO_Z = 132; // cube vertical height in screen px

// Palette — 5 cubes, 3 face tones each (top brightest, right = front, left = darker).
const FACE = {
  gold: { top: "#E59B13", right: "#C67402", left: "#A55E00" },
  blue: { top: "#1C4B92", right: "#13356D", left: "#0C2450" },
  gray: { top: "#DDDDDD", right: "#BDBDBD", left: "#9A9A9A" },
};

// Project iso -> screen. origin is the stage center.
// Higher gy = further back (UP on screen in isometric).
function iso(x, y, z) {
  return {
    X: (x - y) * ISO_W,
    Y: -(x + y) * ISO_H - z * ISO_Z,
  };
}

// Render a single cube at grid position (gx, gy, gz).
// dx/dy are animation offsets in px (for entry).
// opacity, scale for animation.
// glow brightens the top face.
function IsoCube({
  gx = 0,
  gy = 0,
  gz = 0,
  dx = 0,
  dy = 0,
  opacity = 1,
  scale = 1,
  scaleX = 1,
  scaleY = 1,
  glow = 0,
  tone = FACE.gold,
  zIndex = 0,
}) {
  const { X, Y } = iso(gx, gy, gz);
  const W = ISO_W,
    H = ISO_H,
    Z = ISO_Z;

  // All polygons are drawn in a 0,0 local coord, with absolute positioning.
  // Top rhombus corners (clockwise from top):
  //   (0, -H) (W, 0) (0, H) (-W, 0)
  // Left face (visible when viewer is on the right of the cube's left side):
  //   top-back (-W, 0), top-front (0, H), bottom-front (0, H+Z), bottom-back (-W, Z)
  // Right face:
  //   top-front (0, H), top-back (W, 0), bottom-back (W, Z), bottom-front (0, H+Z)

  const topPts = `0,${-H} ${W},0 0,${H} ${-W},0`;
  const leftPts = `${-W},0 0,${H} 0,${H + Z} ${-W},${Z}`;
  const rightPts = `0,${H} ${W},0 ${W},${Z} 0,${H + Z}`;

  const topFill =
    glow > 0
      ? `color-mix(in oklab, ${tone.top} ${100 - glow * 50}%, white)`
      : tone.top;

  // SVG viewBox: covers the cube region comfortably.
  const vbPad = 4;
  const vbX = -W - vbPad;
  const vbY = -H - vbPad;
  const vbW = W * 2 + vbPad * 2;
  const vbH = H * 2 + Z + vbPad * 2;

  return (
    <svg
      style={{
        position: "absolute",
        left: `calc(50% + ${X + dx - W}px)`,
        top: `calc(50% + ${Y + dy - H}px)`,
        width: vbW,
        height: vbH,
        opacity,
        transform: `scale(${scale * scaleX}, ${scale * scaleY})`,
        transformOrigin: `${W}px ${H + Z}px`,
        zIndex,
        overflow: "visible",
        filter:
          glow > 0
            ? `drop-shadow(0 0 ${glow * 40}px rgba(255,220,140,${glow * 0.6}))`
            : "none",
      }}
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
    >
      <polygon points={leftPts} fill={tone.left} />
      <polygon points={rightPts} fill={tone.right} />
      <polygon points={topPts} fill={topFill} />
      {/* Edge lines */}
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

Object.assign(window, { IsoCube, FACE, iso, ISO_W, ISO_H, ISO_Z });
