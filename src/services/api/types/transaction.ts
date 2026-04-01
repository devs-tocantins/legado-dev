export enum TransactionCategoryEnum {
  XP_REWARD = "XP_REWARD",
  TOKEN_REWARD = "TOKEN_REWARD",
  TOKEN_TRANSFER = "TOKEN_TRANSFER",
  STORE_PURCHASE = "STORE_PURCHASE",
  MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT",
  MODERATOR_REWARD = "MODERATOR_REWARD",
}

export type Transaction = {
  id: string;
  profileId?: string;
  category: TransactionCategoryEnum;
  amount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
};
