export const COURSE_PALETTES = [
  {
    bright: "oklch(0.7 0.17 55)",
    ring: "oklch(0.85 0.09 62)",
    shadow: "oklch(0.72 0.15 55)",
    chipBg: "oklch(0.96 0.06 62)",
    chipText: "oklch(0.55 0.16 50)",
  },
  {
    bright: "oklch(0.6 0.14 245)",
    ring: "oklch(0.86 0.06 245)",
    shadow: "oklch(0.78 0.11 245)",
    chipBg: "oklch(0.96 0.04 245)",
    chipText: "oklch(0.5 0.13 245)",
  },
  {
    bright: "oklch(0.56 0.13 150)",
    ring: "oklch(0.85 0.07 150)",
    shadow: "oklch(0.75 0.12 150)",
    chipBg: "oklch(0.95 0.05 150)",
    chipText: "oklch(0.46 0.13 150)",
  },
  {
    bright: "oklch(0.65 0.18 20)",
    ring: "oklch(0.85 0.10 20)",
    shadow: "oklch(0.72 0.15 20)",
    chipBg: "oklch(0.95 0.06 20)",
    chipText: "oklch(0.5 0.16 20)",
  },
  {
    bright: "oklch(0.7 0.15 100)",
    ring: "oklch(0.88 0.08 100)",
    shadow: "oklch(0.75 0.12 100)",
    chipBg: "oklch(0.96 0.05 100)",
    chipText: "oklch(0.55 0.14 100)",
  },
  {
    bright: "oklch(0.6 0.16 300)",
    ring: "oklch(0.85 0.08 300)",
    shadow: "oklch(0.7 0.14 300)",
    chipBg: "oklch(0.96 0.05 300)",
    chipText: "oklch(0.5 0.15 300)",
  },
  {
    bright: "oklch(0.65 0.14 200)",
    ring: "oklch(0.85 0.08 200)",
    shadow: "oklch(0.75 0.12 200)",
    chipBg: "oklch(0.96 0.05 200)",
    chipText: "oklch(0.5 0.13 200)",
  },
  {
    bright: "oklch(0.6 0.15 340)",
    ring: "oklch(0.85 0.08 340)",
    shadow: "oklch(0.7 0.13 340)",
    chipBg: "oklch(0.95 0.05 340)",
    chipText: "oklch(0.5 0.14 340)",
  },
  {
    bright: "oklch(0.75 0.15 75)",
    ring: "oklch(0.9 0.08 75)",
    shadow: "oklch(0.8 0.13 75)",
    chipBg: "oklch(0.97 0.04 75)",
    chipText: "oklch(0.6 0.14 75)",
  },
  {
    bright: "oklch(0.55 0.12 270)",
    ring: "oklch(0.83 0.06 270)",
    shadow: "oklch(0.7 0.1 270)",
    chipBg: "oklch(0.95 0.04 270)",
    chipText: "oklch(0.45 0.11 270)",
  },
];

export function getCoursePalette(id: string) {
  const index =
    id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    COURSE_PALETTES.length;
  return COURSE_PALETTES[index];
}
