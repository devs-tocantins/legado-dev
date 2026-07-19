export enum EffortLevelEnum {
  P = "P",
  M = "M",
  G = "G",
  EPICO = "EPICO",
}

export type EffortTier = {
  level: EffortLevelEnum;
  label: string;
  example: string;
  xp: number;
};

export type Activity = {
  id: string;
  title: string;
  description?: string;
  fixedReward: number;
  auditorReward: number;
  isHidden: boolean;
  secretCode?: string | null;
  requiresProof: boolean;
  requiresDescription: boolean;
  requiresActivityDate: boolean;
  cooldownHours: number;
  effortTiers?: EffortTier[] | null;
  isFreeform?: boolean;
  createdAt: string;
  updatedAt: string;
};
