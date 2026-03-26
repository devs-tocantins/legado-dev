import { User } from "./user";

export enum TransactionTypeEnum {
  CREDIT = "credit",
  DEBIT = "debit",
}

export type Transaction = {
  id: string;
  user?: User;
  points: number;
  type: TransactionTypeEnum;
  description?: string;
  createdAt: string;
  updatedAt: string;
};
