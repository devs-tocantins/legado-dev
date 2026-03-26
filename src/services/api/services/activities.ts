import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Activity } from "../types/activity";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { SortEnum } from "../types/sort-type";
import { RequestConfigType } from "./types/request-config";

export type ActivitiesRequest = {
  page: number;
  limit: number;
  filters?: {
    type?: string;
  };
  sort?: Array<{
    orderBy: keyof Activity;
    order: SortEnum;
  }>;
};

export type ActivitiesResponse = InfinityPaginationType<Activity>;

export function useGetActivitiesService() {
  const fetch = useFetch();

  return useCallback(
    (data: ActivitiesRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/v1/activities`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());
      if (data.filters) {
        requestUrl.searchParams.append(
          "filters",
          JSON.stringify(data.filters)
        );
      }
      if (data.sort) {
        requestUrl.searchParams.append("sort", JSON.stringify(data.sort));
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ActivitiesResponse>);
    },
    [fetch]
  );
}

export type ActivityRequest = {
  id: Activity["id"];
};

export type ActivityResponse = Activity;

export function useGetActivityService() {
  const fetch = useFetch();

  return useCallback(
    (data: ActivityRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/activities/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ActivityResponse>);
    },
    [fetch]
  );
}

export type ActivityPostRequest = Pick<
  Activity,
  "name" | "description" | "points" | "type"
>;

export type ActivityPostResponse = Activity;

export function usePostActivityService() {
  const fetch = useFetch();

  return useCallback(
    (data: ActivityPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/activities`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ActivityPostResponse>);
    },
    [fetch]
  );
}

export type ActivityPatchRequest = {
  id: Activity["id"];
  data: Partial<Pick<Activity, "name" | "description" | "points" | "type">>;
};

export type ActivityPatchResponse = Activity;

export function usePatchActivityService() {
  const fetch = useFetch();

  return useCallback(
    (data: ActivityPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/activities/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ActivityPatchResponse>);
    },
    [fetch]
  );
}

export type ActivityDeleteRequest = {
  id: Activity["id"];
};

export type ActivityDeleteResponse = undefined;

export function useDeleteActivityService() {
  const fetch = useFetch();

  return useCallback(
    (data: ActivityDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/v1/activities/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ActivityDeleteResponse>);
    },
    [fetch]
  );
}
