import { Activity } from "./activity";
import { User } from "./user";

export enum SubmissionStatusEnum {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export type Submission = {
  id: string;
  user?: User;
  activity?: Activity;
  status: SubmissionStatusEnum;
  proofUrl?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
};
