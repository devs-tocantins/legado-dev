import { SortEnum } from "@/services/api/types/sort-type";
import { Activity } from "@/services/api/types/activity";

export type ActivityFilterType = {
  type?: string;
};

export type ActivitySortType = {
  orderBy: keyof Activity;
  order: SortEnum;
};
