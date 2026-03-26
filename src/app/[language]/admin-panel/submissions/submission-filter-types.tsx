import { SortEnum } from "@/services/api/types/sort-type";
import { Submission } from "@/services/api/types/submission";

export type SubmissionFilterType = {
  status?: string;
};

export type SubmissionSortType = {
  orderBy: keyof Submission;
  order: SortEnum;
};
