export enum TrackSuggestionStatus {
  PENDING = "PENDING",
  REVIEWED = "REVIEWED",
}

export type TrackSuggestion = {
  id: string;
  profileId: string;
  trackId: string | null;
  title: string | null;
  message: string;
  status: TrackSuggestionStatus;
  reviewedByProfileId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
