export type MissionStatus = "OPEN" | "CLOSED";
export type MissionSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Mission = {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  xpReward: number;
  status: MissionStatus;
  winnerId: string | null;
  isSecret: boolean;
  requiresProof: boolean;
  requiresDescription: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MissionSubmission = {
  id: string;
  missionId: string;
  profileId: string;
  proofUrl: string | null;
  description: string | null;
  status: MissionSubmissionStatus;
  feedback: string | null;
  awardedXp: number;
  reviewerId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
