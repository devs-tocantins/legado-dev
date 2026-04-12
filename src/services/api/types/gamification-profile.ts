export type GamificationProfile = {
  id: string;
  userId: number;
  username: string;
  totalXp: number;
  currentMonthlyXp: number;
  currentYearlyXp: number;
  gratitudeTokens: number;
  isBanned?: boolean;
  createdAt: string;
  updatedAt: string;
};
