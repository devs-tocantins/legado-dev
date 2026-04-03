import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Submission } from "../types/submission";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { SortEnum } from "../types/sort-type";
import { RequestConfigType } from "./types/request-config";

export type SubmissionsRequest = {
  page: number;
  limit: number;
  filters?: {
    status?: string;
  };
  sort?: Array<{
    orderBy: keyof Submission;
    order: SortEnum;
  }>;
};

export type SubmissionsResponse = InfinityPaginationType<Submission>;

export function useGetSubmissionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: SubmissionsRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/submissions`);
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
      }).then(wrapperFetchJsonResponse<SubmissionsResponse>);
    },
    [fetch]
  );
}

export type SubmissionRequest = {
  id: Submission["id"];
};

export type SubmissionResponse = Submission;

export function useGetSubmissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: SubmissionRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/submissions/${data.id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SubmissionResponse>);
    },
    [fetch]
  );
}

export type SubmissionPostRequest = {
  activityId: string;
  proofUrl?: string;
};

export type SubmissionPostResponse = Submission;

export function usePostSubmissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: SubmissionPostRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/submissions`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SubmissionPostResponse>);
    },
    [fetch]
  );
}

export type SubmissionPatchRequest = {
  id: Submission["id"];
  data: Partial<{
    status: string;
    feedback: string;
    proofUrl: string;
  }>;
};

export type SubmissionPatchResponse = Submission;

export function usePatchSubmissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: SubmissionPatchRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/submissions/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SubmissionPatchResponse>);
    },
    [fetch]
  );
}

export type SubmissionDeleteRequest = {
  id: Submission["id"];
};

export type SubmissionDeleteResponse = undefined;

export function useDeleteSubmissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: SubmissionDeleteRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/submissions/${data.id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SubmissionDeleteResponse>);
    },
    [fetch]
  );
}

// POST /submissions/redeem - secret code redemption
export type RedeemSecretCodeRequest = {
  secretCode: string;
};

export type RedeemSecretCodeResponse = Submission;

export function useRedeemSecretCodeService() {
  const fetch = useFetch();

  return useCallback(
    (data: RedeemSecretCodeRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/submissions/redeem`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<RedeemSecretCodeResponse>);
    },
    [fetch]
  );
}

// GET /submissions/me - personal history
export type MySubmissionsRequest = {
  page: number;
  limit: number;
};

export type MySubmissionsResponse = InfinityPaginationType<Submission>;

export function useGetMySubmissionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: MySubmissionsRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/submissions/me`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MySubmissionsResponse>);
    },
    [fetch]
  );
}

// GET /submissions/pending - moderation queue
export type PendingSubmissionsRequest = {
  page: number;
  limit: number;
};

export type PendingSubmissionsResponse = InfinityPaginationType<Submission>;

export function useGetPendingSubmissionsService() {
  const fetch = useFetch();

  return useCallback(
    (data: PendingSubmissionsRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/submissions/pending`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<PendingSubmissionsResponse>);
    },
    [fetch]
  );
}

// PATCH /submissions/:id/review - moderation action
export type ReviewSubmissionRequest = {
  id: Submission["id"];
  data: {
    status: "APPROVED" | "REJECTED";
    feedback?: string;
  };
};

export type ReviewSubmissionResponse = Submission;

export function useReviewSubmissionService() {
  const fetch = useFetch();

  return useCallback(
    (data: ReviewSubmissionRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/submissions/${data.id}/review`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ReviewSubmissionResponse>);
    },
    [fetch]
  );
}
