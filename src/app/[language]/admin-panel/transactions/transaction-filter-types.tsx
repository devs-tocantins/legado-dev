import { SortEnum } from "@/services/api/types/sort-type";
import { Transaction } from "@/services/api/types/transaction";

export type TransactionFilterType = {
  category?: string;
};

export type TransactionSortType = {
  orderBy: keyof Transaction;
  order: SortEnum;
};
