import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import {
  Notification,
  NotificationPreference,
  ContributionReport,
} from "../types/notification";
import { RequestConfigType } from "./types/request-config";

export function useGetNotificationsService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/notifications`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Notification[]>),
    [fetch]
  );
}

export function useGetUnreadCountService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/notifications/unread-count`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<{ count: number }>),
    [fetch]
  );
}

export function useMarkAllReadService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: "PATCH",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<void>),
    [fetch]
  );
}

export function useMarkReadService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
        method: "PATCH",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<void>),
    [fetch]
  );
}

export function useGetNotificationPreferencesService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/notifications/preferences`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<NotificationPreference>),
    [fetch]
  );
}

export function useUpdateNotificationPreferencesService() {
  const fetch = useFetch();
  return useCallback(
    (
      data: Partial<
        Pick<
          NotificationPreference,
          "emailOnSubmissionApproved" | "emailOnMissionWon"
        >
      >,
      requestConfig?: RequestConfigType
    ) =>
      fetch(`${API_URL}/api/v1/notifications/preferences`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<NotificationPreference>),
    [fetch]
  );
}

export function useCreateContributionReportService() {
  const fetch = useFetch();
  return useCallback(
    (
      data: { submissionId: string; reason: string; proofUrl?: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(`${API_URL}/api/v1/contribution-reports`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ContributionReport>),
    [fetch]
  );
}

export function useGetPendingReportsService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/contribution-reports/admin/pending`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ContributionReport[]>),
    [fetch]
  );
}

export function useReviewReportService() {
  const fetch = useFetch();
  return useCallback(
    (
      id: string,
      data: { status: "DISMISSED" | "UPHELD"; adminNote?: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(`${API_URL}/api/v1/contribution-reports/admin/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ContributionReport>),
    [fetch]
  );
}
