import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  LearningTrack,
  LearningTrackOverview,
  LearningTrackProgress,
  LearningTrackStatus,
  LearningTrackTier,
  TrackEnrollment,
  TrackItem,
  TrackItemCompletion,
  TrackItemStatus,
  TrackItemType,
  TrackSection,
  TrackSectionStatus,
} from "../types/learning-track";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { RequestConfigType } from "./types/request-config";

export type LearningTracksRequest = {
  page: number;
  limit: number;
};

export type LearningTracksResponse = InfinityPaginationType<LearningTrack>;

function buildLearningTracksUrl(path: string, data: LearningTracksRequest) {
  const requestUrl = new URL(`${API_URL}/api/v1/learning-tracks${path}`);
  requestUrl.searchParams.append("page", data.page.toString());
  requestUrl.searchParams.append("limit", data.limit.toString());
  return requestUrl;
}

export function useGetLearningTracksService() {
  const fetch = useFetch();

  return useCallback(
    (data: LearningTracksRequest, requestConfig?: RequestConfigType) => {
      return fetch(buildLearningTracksUrl("", data), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<LearningTracksResponse>);
    },
    [fetch]
  );
}

export type LearningTrackRequest = {
  id: LearningTrack["id"];
};

export type LearningTrackResponse = LearningTrack;

export function useGetLearningTrackService() {
  const fetch = useFetch();

  return useCallback(
    (data: LearningTrackRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/learning-tracks/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<LearningTrackResponse>);
    },
    [fetch]
  );
}

export type LearningTrackOverviewResponse = LearningTrackOverview;

export function useGetLearningTrackOverviewService() {
  const fetch = useFetch();

  return useCallback(
    (data: LearningTrackRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/learning-tracks/${data.id}/overview`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<LearningTrackOverviewResponse>);
    },
    [fetch]
  );
}

export type LearningTrackProgressResponse = LearningTrackProgress;

export function useGetLearningTrackProgressService() {
  const fetch = useFetch();

  return useCallback(
    (data: LearningTrackRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/learning-tracks/${data.id}/progress`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<LearningTrackProgressResponse>);
    },
    [fetch]
  );
}

export type EnrollTrackRequest = {
  trackId: LearningTrack["id"];
};

export type EnrollTrackResponse = TrackEnrollment;

export function useEnrollTrackService() {
  const fetch = useFetch();

  return useCallback(
    (data: EnrollTrackRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-enrollments`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<EnrollTrackResponse>);
    },
    [fetch]
  );
}

export type CompleteTrackItemRequest = {
  id: string;
};

export type CompleteTrackItemResponse = TrackItemCompletion;

export function useCompleteTrackItemService() {
  const fetch = useFetch();

  return useCallback(
    (data: CompleteTrackItemRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-items/${data.id}/complete`, {
        method: "POST",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CompleteTrackItemResponse>);
    },
    [fetch]
  );
}

export type TrackItemRequest = {
  id: string;
};

export function useGetTrackItemService() {
  const fetch = useFetch();

  return useCallback(
    (data: TrackItemRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-items/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackItem>);
    },
    [fetch]
  );
}

export type ProofPortfolioItem = {
  itemId: string;
  itemTitle: string;
  trackId: string;
  trackTitle: string;
  trackTier: LearningTrack["tier"];
  sectionId: string;
  sectionTitle: string;
  isTestOut: boolean;
  completedAt: string;
};

export function useGetProofPortfolioService() {
  const fetch = useFetch();

  return useCallback(
    (profileId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/profile-portfolio/${profileId}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProofPortfolioItem[]>);
    },
    [fetch]
  );
}

// ─── Admin: Learning Track CRUD ────────────────────────────────────────────

export type CreateLearningTrackRequest = {
  slug: string;
  title: string;
  description?: string | null;
  area: string;
  tier: LearningTrackTier;
  status?: LearningTrackStatus;
  requiresTrackId?: string | null;
};

export type UpdateLearningTrackRequest = Partial<CreateLearningTrackRequest>;

export function useCreateLearningTrackService() {
  const fetch = useFetch();
  return useCallback(
    (data: CreateLearningTrackRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/learning-tracks`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<LearningTrack>);
    },
    [fetch]
  );
}

export function useUpdateLearningTrackService() {
  const fetch = useFetch();
  return useCallback(
    (
      id: string,
      data: UpdateLearningTrackRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/api/v1/learning-tracks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<LearningTrack>);
    },
    [fetch]
  );
}

export function useDeleteLearningTrackService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/learning-tracks/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>);
    },
    [fetch]
  );
}

// ─── Admin: Track Section CRUD ─────────────────────────────────────────────

export type CreateTrackSectionRequest = {
  trackId: string;
  title: string;
  description?: string | null;
  position: number;
  status?: TrackSectionStatus;
  badgeId?: string | null;
};

export type UpdateTrackSectionRequest = Partial<CreateTrackSectionRequest>;

export function useCreateTrackSectionService() {
  const fetch = useFetch();
  return useCallback(
    (data: CreateTrackSectionRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-sections`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackSection>);
    },
    [fetch]
  );
}

export function useUpdateTrackSectionService() {
  const fetch = useFetch();
  return useCallback(
    (
      id: string,
      data: UpdateTrackSectionRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/api/v1/track-sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackSection>);
    },
    [fetch]
  );
}

export function useDeleteTrackSectionService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-sections/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>);
    },
    [fetch]
  );
}

// ─── Admin: Track Item CRUD ────────────────────────────────────────────────

export type CreateTrackItemRequest = {
  trackId: string;
  sectionId: string;
  type: TrackItemType;
  title: string;
  body?: string | null;
  position: number;
  status?: TrackItemStatus;
  isOptional?: boolean;
  allowsTestOut?: boolean;
  journeyXp?: number;
  grantsCommunityXp?: boolean;
  communityXpReward?: number;
  activityId?: string | null;
  missionId?: string | null;
  courseId?: string | null;
};

export type UpdateTrackItemRequest = Partial<CreateTrackItemRequest>;

export function useCreateTrackItemService() {
  const fetch = useFetch();
  return useCallback(
    (data: CreateTrackItemRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-items`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackItem>);
    },
    [fetch]
  );
}

export function useUpdateTrackItemService() {
  const fetch = useFetch();
  return useCallback(
    (
      id: string,
      data: UpdateTrackItemRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/api/v1/track-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackItem>);
    },
    [fetch]
  );
}

export function useDeleteTrackItemService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-items/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>);
    },
    [fetch]
  );
}
