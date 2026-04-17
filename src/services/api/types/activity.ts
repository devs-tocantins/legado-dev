export type Activity = {
  id: string;
  title: string;
  description?: string;
  fixedReward: number;
  isHidden: boolean;
  secretCode?: string | null;
  requiresProof: boolean;
  requiresDescription: boolean;
  cooldownHours: number;
  createdAt: string;
  updatedAt: string;
};
