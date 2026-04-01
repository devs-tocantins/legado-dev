import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { GamificationProfile } from "../types/gamification-profile";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { SortEnum } from "../types/sort-type";
import { RequestConfigType } from "./types/request-config";

export type GamificationProfilesRequest = {
  page: number;
  limit: number;
  filters?: Record<string, unknown>;
  sort?: Array<{
    orderBy: keyof GamificationProfile;
    order: SortEnum;
  }>;
};

export type GamificationProfilesResponse =
  InfinityPaginationType<GamificationProfile>;

export function useGetGamificationProfilesService() {
  const fetch = useFetch();

  return useCallback(
    (data: GamificationProfilesRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/v1/gamification-profiles`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());
      if (data.filters) {
        requestUrl.searchParams.append("filters", JSON.stringify(data.filters));
      }
      if (data.sort) {
        requestUrl.searchParams.append("sort", JSON.stringify(data.sort));
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GamificationProfilesResponse>);
    },
    [fetch]
  );
}

export type GamificationProfileRequest = {
  id: GamificationProfile["id"];
};

export type GamificationProfileResponse = GamificationProfile;

export function useGetGamificationProfileService() {
  const fetch = useFetch();

  return useCallback(
    (data: GamificationProfileRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/gamification-profiles/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GamificationProfileResponse>);
    },
    [fetch]
  );
}

export type GamificationProfilePostRequest = {
  userId: number;
  username: string;
};

export type GamificationProfilePostResponse = GamificationProfile;

export function usePostGamificationProfileService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: GamificationProfilePostRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/v1/gamification-profiles`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GamificationProfilePostResponse>);
    },
    [fetch]
  );
}

export type GamificationProfilePatchRequest = {
  id: GamificationProfile["id"];
  data: Partial<{
    username: string;
    totalXp: number;
    gratitudeTokens: number;
  }>;
};

export type GamificationProfilePatchResponse = GamificationProfile;

export function usePatchGamificationProfileService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: GamificationProfilePatchRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/v1/gamification-profiles/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GamificationProfilePatchResponse>);
    },
    [fetch]
  );
}

export type GamificationProfileDeleteRequest = {
  id: GamificationProfile["id"];
};

export type GamificationProfileDeleteResponse = undefined;

export function useDeleteGamificationProfileService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: GamificationProfileDeleteRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/v1/gamification-profiles/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GamificationProfileDeleteResponse>);
    },
    [fetch]
  );
}

export type GamificationProfileByUsernameResponse = GamificationProfile;

export function useGetGamificationProfileByUsernameService() {
  const fetch = useFetch();

  return useCallback(
    (username: string, requestConfig?: RequestConfigType) => {
      return fetch(
        `${API_URL}/v1/gamification-profiles/by-username/${encodeURIComponent(username)}`,
        {
          method: "GET",
          ...requestConfig,
        }
      ).then(wrapperFetchJsonResponse<GamificationProfileByUsernameResponse>);
    },
    [fetch]
  );
}

export type ApprovedSubmissionsResponse = InfinityPaginationType<{
  id: string;
  activityId: string;
  awardedXp: number;
  createdAt: string;
}>;

export function useGetProfileApprovedSubmissionsService() {
  const fetch = useFetch();

  return useCallback(
    (
      profileId: string,
      params: { page: number; limit: number },
      requestConfig?: RequestConfigType
    ) => {
      const url = new URL(
        `${API_URL}/v1/gamification-profiles/${profileId}/approved-submissions`
      );
      url.searchParams.append("page", params.page.toString());
      url.searchParams.append("limit", params.limit.toString());
      return fetch(url, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ApprovedSubmissionsResponse>);
    },
    [fetch]
  );
}

export type UpdateMyGamificationProfileRequest = {
  username: string;
};

export type UpdateMyGamificationProfileResponse = GamificationProfile;

export function useUpdateMyGamificationProfileService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: UpdateMyGamificationProfileRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/v1/gamification-profiles/me`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<UpdateMyGamificationProfileResponse>);
    },
    [fetch]
  );
}

export type MyGamificationProfileResponse = GamificationProfile;

export function useGetMyGamificationProfileService() {
  const fetch = useFetch();

  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/gamification-profiles/me`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MyGamificationProfileResponse>);
    },
    [fetch]
  );
}

// POST /gamification-profiles/transfer - P2P token transfer
export type TransferTokensRequest = {
  recipientProfileId: string;
  amount: number;
  message?: string;
};

export type TransferTokensResponse = GamificationProfile;

export function useTransferTokensService() {
  const fetch = useFetch();

  return useCallback(
    (data: TransferTokensRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/gamification-profiles/transfer`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<TransferTokensResponse>);
    },
    [fetch]
  );
}
