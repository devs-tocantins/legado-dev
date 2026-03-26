import { User } from "./user";

export type GamificationProfile = {
  id: string;
  user?: User;
  totalPoints: number;
  level: number;
  createdAt: string;
  updatedAt: string;
};
