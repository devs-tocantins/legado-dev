export type GamificationProfile = {
  id: string;
  userId: number;
  username: string;
  totalXp: number;
  currentMonthlyXp: number;
  currentYearlyXp: number;
  gratitudeTokens: number;
  githubUsername?: string | null;
  isBanned?: boolean;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
};
