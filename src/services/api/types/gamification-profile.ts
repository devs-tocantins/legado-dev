import { FileEntity } from "./file-entity";

export type GamificationProfile = {
  id: string;
  userId: number;
  username: string;
  totalXp: number;
  currentMonthlyXp: number;
  currentYearlyXp: number;
  gratitudeTokens: number;
  githubUsername?: string | null;
  whatsappNumber?: string | null;
  bannerPreset?: string;
  avatarConfig?: string | null;
  avatarSvg?: string | null;
  isBanned?: boolean;
  firstName?: string;
  lastName?: string;
  photo?: FileEntity | null;
  createdAt: string;
  updatedAt: string;
};
