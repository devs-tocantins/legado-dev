// cube3d.jsx — REAL 3D cube. 6 faces, all direct children of a single
// preserve-3d wrapper. NO extra nesting.
//
// Critical rules for CSS 3D to work:
//   1. Every ancestor that wraps 3D-transformed children must have
//      `transform-style: preserve-3d`.
//   2. The `transform` on that wrapper is applied, and its children's
//      transforms compose in 3D.
//   3. ANY filter/opacity/overflow-hidden/will-change on that wrapper
//      creates a new stacking context that FLATTENS the 3D.
//   4. The 6 faces must each be absolutely positioned and use translateZ
//      to pop out of the wrapper's local XY plane.

function Cube3DFaces({ size, palette }) {
  const h = size / 2;
  const edge = "rgba(0,0,0,0.22)";

  const faceStyle = {
    position: "absolute",
    width: size,
    height: size,
    left: -h,
    top: -h,
    boxShadow: `inset 0 0 0 1.5px ${edge}`,
    backfaceVisibility: "hidden",
  };

  // Six faces. Each is a div positioned at the cube's CENTER, then
  // rotated and pushed out by half-size. Order doesn't matter for 3D,
  // only for 2D stacking fallback.
  return (
    <>
      {/* Top (+Y in CSS 3D; but we flip later so +Z in world = top) */}
      <div
        style={{
          ...faceStyle,
          background: palette.top,
          transform: `translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.bottom,
          transform: `rotateY(180deg) translateZ(${h}px)`,
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
          background: palette.left,
          transform: `rotateY(-90deg) translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.front,
          transform: `rotateX(90deg) translateZ(${h}px)`,
        }}
      />
      <div
        style={{
          ...faceStyle,
          background: palette.back,
          transform: `rotateX(-90deg) translateZ(${h}px)`,
        }}
      />
    </>
  );
}

// Palettes with 6 directional shades
const PAL3D = {
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

Object.assign(window, { Cube3DFaces, PAL3D });
