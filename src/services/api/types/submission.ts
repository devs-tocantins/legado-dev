export enum SubmissionStatusEnum {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum GithubRepoTargetEnum {
  FRONT = "FRONT",
  API = "API",
}

export enum GithubIssueCategoryEnum {
  BUG = "BUG",
  MELHORIA = "MELHORIA",
  DUVIDA = "DUVIDA",
  OUTRO = "OUTRO",
}

export type Submission = {
  id: string;
  profileId: string;
  activityId: string;
  proofUrl?: string | null;
  description?: string | null;
  customTitle?: string | null;
  activityDate?: string | null;
  githubRepo?: GithubRepoTargetEnum | null;
  issueCategory?: GithubIssueCategoryEnum | null;
  githubIssueUrl?: string | null;
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
