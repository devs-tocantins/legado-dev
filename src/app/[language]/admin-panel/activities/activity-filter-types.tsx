import { SortEnum } from "@/services/api/types/sort-type";
import { Activity } from "@/services/api/types/activity";

export type ActivityFilterType = Record<string, unknown>;

export type ActivitySortType = {
  orderBy: keyof Activity;
  order: SortEnum;
};
