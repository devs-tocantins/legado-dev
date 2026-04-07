export type Level = {
  name: string;
  minXp: number;
  maxXp: number;
  color: string;
};

export const LEVELS: Level[] = [
  { name: "Novato", minXp: 0, maxXp: 99, color: "text-slate-400" },
  { name: "Contribuidor", minXp: 100, maxXp: 499, color: "text-emerald-400" },
  { name: "Colaborador Ativo", minXp: 500, maxXp: 1499, color: "text-sky-400" },
  { name: "Referência", minXp: 1500, maxXp: 3999, color: "text-blue-400" },
  { name: "Mentor", minXp: 4000, maxXp: 9999, color: "text-amber-400" },
  { name: "Lenda", minXp: 10000, maxXp: Infinity, color: "text-rose-400" },
];

export function getLevel(totalXp: number): Level {
  return LEVELS.findLast((l) => totalXp >= l.minXp) ?? LEVELS[0];
}

export function getLevelProgress(totalXp: number): number {
  const level = getLevel(totalXp);
  if (level.maxXp === Infinity) return 100;
  const range = level.maxXp - level.minXp;
  const progress = totalXp - level.minXp;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function getNextLevelXp(totalXp: number): number {
  const level = getLevel(totalXp);
  return level.maxXp === Infinity ? totalXp : level.maxXp + 1;
}

export function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}
