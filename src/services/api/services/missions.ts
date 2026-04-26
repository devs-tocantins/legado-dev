import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Mission, MissionSubmission } from "../types/mission";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { RequestConfigType } from "./types/request-config";

export type MissionsRequest = {
  page: number;
  limit: number;
  search?: string;
};

export type MissionsResponse = InfinityPaginationType<Mission>;

export function useGetMissionsService() {
  const fetch = useFetch();
  return useCallback(
    (data: MissionsRequest, requestConfig?: RequestConfigType) => {
      const url = new URL(`${API_URL}/api/v1/missions`);
      url.searchParams.append("page", data.page.toString());
      url.searchParams.append("limit", data.limit.toString());
      if (data.search) url.searchParams.append("search", data.search);
      return fetch(url, { method: "GET", ...requestConfig }).then(
        wrapperFetchJsonResponse<MissionsResponse>
      );
    },
    [fetch]
  );
}

export function useGetAllMissionsService() {
  const fetch = useFetch();
  return useCallback(
    (data: MissionsRequest, requestConfig?: RequestConfigType) => {
      const url = new URL(`${API_URL}/api/v1/missions/admin/all`);
      url.searchParams.append("page", data.page.toString());
      url.searchParams.append("limit", data.limit.toString());
      if (data.search) url.searchParams.append("search", data.search);
      return fetch(url, { method: "GET", ...requestConfig }).then(
        wrapperFetchJsonResponse<MissionsResponse>
      );
    },
    [fetch]
  );
}

export function useGetMissionService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions/${id}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Mission>),
    [fetch]
  );
}

export type CreateMissionRequest = {
  title: string;
  description?: string | null;
  requirements?: string | null;
  xpReward: number;
  auditorReward: number;
  participantReward: number;
  isSecret?: boolean;
  requiresProof?: boolean;
  requiresDescription?: boolean;
};

export function useCreateMissionService() {
  const fetch = useFetch();
  return useCallback(
    (data: CreateMissionRequest, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Mission>),
    [fetch]
  );
}

export function useUpdateMissionService() {
  const fetch = useFetch();
  return useCallback(
    (
      id: string,
      data: Partial<CreateMissionRequest>,
      requestConfig?: RequestConfigType
    ) =>
      fetch(`${API_URL}/api/v1/missions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Mission>),
    [fetch]
  );
}

export function useDeleteMissionService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>),
    [fetch]
  );
}

export type SubmitMissionRequest = {
  proofUrl?: string | null;
  description?: string | null;
};

export function useSubmitMissionService() {
  const fetch = useFetch();
  return useCallback(
    (
      id: string,
      data: SubmitMissionRequest,
      requestConfig?: RequestConfigType
    ) =>
      fetch(`${API_URL}/api/v1/missions/${id}/submit`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MissionSubmission>),
    [fetch]
  );
}

export type MissionParticipant = {
  username: string;
  status: string;
  submittedAt: string;
};

export type MissionParticipantsResponse = {
  count: number;
  participants: MissionParticipant[];
};

export function useGetMissionParticipantsService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions/${id}/participants`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MissionParticipantsResponse>),
    [fetch]
  );
}

export function useGetMyMissionSubmissionService() {
  const fetch = useFetch();
  return useCallback(
    (missionId: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions/${missionId}/my-submission`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MissionSubmission | null>),
    [fetch]
  );
}

export function useGetMissionSubmissionsService() {
  const fetch = useFetch();
  return useCallback(
    (missionId: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions/${missionId}/submissions`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MissionSubmission[]>),
    [fetch]
  );
}

export type ReviewMissionSubmissionRequest = {
  status: "APPROVED" | "REJECTED";
  feedback?: string;
};

export function useReviewMissionSubmissionService() {
  const fetch = useFetch();
  return useCallback(
    (
      missionId: string,
      submissionId: string,
      data: ReviewMissionSubmissionRequest,
      requestConfig?: RequestConfigType
    ) =>
      fetch(
        `${API_URL}/api/v1/missions/${missionId}/submissions/${submissionId}/review`,
        { method: "PATCH", body: JSON.stringify(data), ...requestConfig }
      ).then(wrapperFetchJsonResponse<MissionSubmission>),
    [fetch]
  );
}
