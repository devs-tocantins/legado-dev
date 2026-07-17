export enum LearningTrackTier {
  ALICERCE = "ALICERCE",
  PILAR = "PILAR",
  ARCO = "ARCO",
}

export enum LearningTrackStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export type LearningTrack = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  area: string;
  tier: LearningTrackTier;
  status: LearningTrackStatus;
  requiresTrackId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export enum TrackSectionStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export type TrackSection = {
  id: string;
  trackId: string;
  title: string;
  description?: string | null;
  position: number;
  status: TrackSectionStatus;
  badgeId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export enum TrackItemType {
  RESOURCE = "RESOURCE",
  TEXT = "TEXT",
  PROOF = "PROOF",
  COURSE_COMPLETION = "COURSE_COMPLETION",
  EVENT = "EVENT",
  MISSION = "MISSION",
  CHECKPOINT = "CHECKPOINT",
}

export enum TrackItemStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export type TrackItem = {
  id: string;
  trackId: string;
  sectionId: string;
  type: TrackItemType;
  title: string;
  body?: string | null;
  position: number;
  status: TrackItemStatus;
  isOptional: boolean;
  allowsTestOut: boolean;
  journeyXp: number;
  grantsCommunityXp: boolean;
  activityId?: string | null;
  missionId?: string | null;
  courseId?: string | null;
  config?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export enum TrackEnrollmentStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ABANDONED = "ABANDONED",
}

export type TrackEnrollment = {
  id: string;
  trackId: string;
  profileId: string;
  status: TrackEnrollmentStatus;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export enum TrackItemCompletionStatus {
  COMPLETED = "COMPLETED",
  SKIPPED_TESTOUT = "SKIPPED_TESTOUT",
  IN_REVIEW = "IN_REVIEW",
}

export type TrackItemCompletion = {
  id: string;
  itemId: string;
  profileId: string;
  status: TrackItemCompletionStatus;
  submissionId?: string | null;
  awardedJourneyXp: number;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LearningTrackOverviewSection = {
  section: TrackSection;
  items: TrackItem[];
};

export type LearningTrackOverview = {
  track: LearningTrack;
  sections: LearningTrackOverviewSection[];
};

export type LearningTrackProgress = {
  enrollment: TrackEnrollment | null;
  currentSectionId: string | null;
  currentItemId: string | null;
  isCompleted: boolean;
};
