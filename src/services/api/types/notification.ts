export type NotificationType =
  | "SUBMISSION_APPROVED"
  | "MISSION_WON"
  | "SUBMISSION_REJECTED"
  | "CONTRIBUTION_REPORT_UPHELD"
  | "CONTRIBUTION_REPORT_RECEIVED";

export type Notification = {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
};

export type NotificationPreference = {
  id: string;
  userId: number;
  emailOnSubmissionApproved: boolean;
  emailOnMissionWon: boolean;
};

export type ContributionReportStatus = "PENDING" | "DISMISSED" | "UPHELD";

export type ContributionReport = {
  id: string;
  submissionId: string;
  reporterProfileId: string;
  reason: string;
  proofUrl: string | null;
  status: ContributionReportStatus;
  adminNote: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
};
