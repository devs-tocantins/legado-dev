export enum SubmissionStatusEnum {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type Submission = {
  id: string;
  profileId: string;
  activityId: string;
  proofUrl?: string | null;
  description?: string | null;
  status: SubmissionStatusEnum;
  feedback?: string | null;
  awardedXp: number;
  reviewerId?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
