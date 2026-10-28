import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  TrackSuggestion,
  TrackSuggestionStatus,
} from "../types/track-suggestion";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { RequestConfigType } from "./types/request-config";

export type CreateTrackSuggestionRequest = {
  trackId?: string;
  title?: string;
  message: string;
};

export function useCreateTrackSuggestionService() {
  const fetch = useFetch();

  return useCallback(
    (data: CreateTrackSuggestionRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-suggestions`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackSuggestion>);
    },
    [fetch]
  );
}

export type TrackSuggestionsResponse = InfinityPaginationType<TrackSuggestion>;

export function useGetTrackSuggestionsService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { page: number; limit: number; status?: TrackSuggestionStatus },
      requestConfig?: RequestConfigType
    ) => {
      const requestUrl = new URL(`${API_URL}/api/v1/track-suggestions`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());
      if (data.status) {
        requestUrl.searchParams.append("status", data.status);
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackSuggestionsResponse>);
    },
    [fetch]
  );
}

export function useMarkTrackSuggestionReviewedService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/track-suggestions/${id}/review`, {
        method: "PATCH",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TrackSuggestion>);
    },
    [fetch]
  );
}
