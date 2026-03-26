import { SortEnum } from "@/services/api/types/sort-type";
import { GamificationProfile } from "@/services/api/types/gamification-profile";

export type GamificationProfileFilterType = Record<string, unknown>;

export type GamificationProfileSortType = {
  orderBy: keyof GamificationProfile;
  order: SortEnum;
};
