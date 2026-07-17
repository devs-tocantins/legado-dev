import {
  LearningTrackTier,
  TrackItemType,
} from "@/services/api/types/learning-track";

export type TrackColor = {
  key: string;
  bg: string;
  shadow: string;
  sealBg: string;
  sealText: string;
};

// Per-trail accent palette (oklch), mirrors the "Construtor" design direction.
// Used only as secondary/decorative accents — brand blue/orange stay primary.
const TRACK_PALETTE: TrackColor[] = [
  {
    key: "cyan",
    bg: "oklch(0.6 0.13 225)",
    shadow: "oklch(0.5 0.12 225)",
    sealBg: "oklch(0.95 0.04 225)",
    sealText: "oklch(0.42 0.13 225)",
  },
  {
    key: "coral",
    bg: "oklch(0.64 0.18 28)",
    shadow: "oklch(0.54 0.17 28)",
    sealBg: "oklch(0.95 0.05 28)",
    sealText: "oklch(0.48 0.18 28)",
  },
  {
    key: "green",
    bg: "oklch(0.58 0.15 150)",
    shadow: "oklch(0.48 0.14 150)",
    sealBg: "oklch(0.95 0.05 150)",
    sealText: "oklch(0.4 0.14 150)",
  },
  {
    key: "amber",
    bg: "oklch(0.75 0.15 78)",
    shadow: "oklch(0.64 0.15 75)",
    sealBg: "oklch(0.95 0.06 80)",
    sealText: "oklch(0.44 0.13 75)",
  },
  {
    key: "violet",
    bg: "oklch(0.55 0.2 285)",
    shadow: "oklch(0.44 0.19 285)",
    sealBg: "oklch(0.95 0.05 285)",
    sealText: "oklch(0.46 0.2 285)",
  },
  {
    key: "magenta",
    bg: "oklch(0.58 0.2 345)",
    shadow: "oklch(0.48 0.19 345)",
    sealBg: "oklch(0.95 0.05 345)",
    sealText: "oklch(0.46 0.2 345)",
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getTrackColor(trackId: string): TrackColor {
  const index = hashString(trackId) % TRACK_PALETTE.length;
  return TRACK_PALETTE[index];
}

export function getTrackAbbreviation(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const TIER_SEAL_LABEL: Record<LearningTrackTier, string> = {
  [LearningTrackTier.ALICERCE]: "Estagiário",
  [LearningTrackTier.PILAR]: "Júnior",
  [LearningTrackTier.ARCO]: "Pleno",
};

const VIOLET = TRACK_PALETTE[4];
const CORAL = TRACK_PALETTE[1];
const GREEN = TRACK_PALETTE[2];

export const TRACK_ITEM_TYPE_BADGE: Record<
  TrackItemType,
  { abbr: string; color: TrackColor }
> = {
  [TrackItemType.RESOURCE]: { abbr: "REC", color: VIOLET },
  [TrackItemType.TEXT]: { abbr: "TXT", color: VIOLET },
  [TrackItemType.PROOF]: { abbr: "PROV", color: CORAL },
  [TrackItemType.COURSE_COMPLETION]: { abbr: "CURSO", color: VIOLET },
  [TrackItemType.EVENT]: { abbr: "EVT", color: CORAL },
  [TrackItemType.MISSION]: { abbr: "MISS", color: CORAL },
  [TrackItemType.CHECKPOINT]: { abbr: "QUIZ", color: GREEN },
};
