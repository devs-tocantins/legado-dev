import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  LearningTrack,
  LearningTrackOverview,
  LearningTrackProgress,
  TrackEnrollment,
  TrackItemCompletion,
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
