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
  activityDate?: string | null;
  status: SubmissionStatusEnum;
  feedback?: string | null;
  awardedXp: number;
  reviewerId?: number | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicSubmissionDetail = {
  activityTitle: string;
  activityDescription: string;
  description: string | null;
  activityDate: string | null;
  awardedXp: number;
  hasProof: boolean;
  createdAt: string;
  reviewedAt: string | null;
};
