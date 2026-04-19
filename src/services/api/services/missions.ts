import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Mission, MissionSubmission } from "../types/mission";
import { RequestConfigType } from "./types/request-config";

export function useGetMissionsService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Mission[]>),
    [fetch]
  );
}

export function useGetAllMissionsService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/missions/admin/all`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Mission[]>),
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
  isSecret?: boolean;
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
