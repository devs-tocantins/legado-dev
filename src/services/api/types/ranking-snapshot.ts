import { GamificationProfile } from "./gamification-profile";

export type RankingSnapshotPeriodType = "monthly" | "annual";

export type RankingSnapshot = {
  id: string;
  profileId: string;
  periodType: RankingSnapshotPeriodType;
  periodKey: string;
  position: number;
  xpAtSnapshot: number;
  createdAt: string;
  profile: GamificationProfile | null;
};
