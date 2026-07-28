export type NotificationType =
  | "SUBMISSION_APPROVED"
  | "MISSION_WON"
  | "SUBMISSION_REJECTED"
  | "CONTRIBUTION_REPORT_UPHELD"
  | "CONTRIBUTION_REPORT_RECEIVED"
  | "NEW_SUBMISSION_PENDING"
  | "EVENT_UPDATED"
  | "EVENT_CANCELLED"
  | "TRACK_MILESTONE_APPROVED"
  | "TRACK_BADGE_GRANTED"
  | "LEGAL_DOCUMENT_UPDATED";

export type Notification = {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedId: string | null;
  payload?: Record<string, unknown> | null;
  link?: string | null;
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
