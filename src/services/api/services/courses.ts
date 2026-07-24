import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { Course, CourseReview } from "../types/course";
import { InfinityPaginationType } from "../types/infinity-pagination";
import { RequestConfigType } from "./types/request-config";

export type CoursesRequest = {
  page: number;
  limit: number;
  trackItemId?: string;
};

export type CoursesResponse = InfinityPaginationType<Course>;

export function useGetCoursesService() {
  const fetch = useFetch();

  return useCallback(
    (data: CoursesRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/courses`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());
      if (data.trackItemId) {
        requestUrl.searchParams.append("trackItemId", data.trackItemId);
      }

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CoursesResponse>);
    },
    [fetch]
  );
}

export function useGetPendingCoursesService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { page: number; limit: number },
      requestConfig?: RequestConfigType
    ) => {
      const requestUrl = new URL(`${API_URL}/api/v1/courses/pending`);
      requestUrl.searchParams.append("page", data.page.toString());
      requestUrl.searchParams.append("limit", data.limit.toString());

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CoursesResponse>);
    },
    [fetch]
  );
}

export type ReviewCourseRequest = {
  id: string;
  status: "VERIFIED" | "REJECTED";
};

export function useReviewCourseService() {
  const fetch = useFetch();

  return useCallback(
    (data: ReviewCourseRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/courses/${data.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Course>);
    },
    [fetch]
  );
}

export function useGetCoursesByTrackItemService() {
  const fetch = useFetch();

  return useCallback(
    (trackItemId: string, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/courses`);
      requestUrl.searchParams.append("page", "1");
      requestUrl.searchParams.append("limit", "50");
      requestUrl.searchParams.append("trackItemId", trackItemId);

      return fetch(requestUrl, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CoursesResponse>);
    },
    [fetch]
  );
}

export function useGetCourseReviewsByCourseService() {
  const fetch = useFetch();

  return useCallback(
    (courseId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/course-reviews/by-course/${courseId}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CourseReview[]>);
    },
    [fetch]
  );
}

export type CreateCourseRequest = {
  title: string;
  description?: string | null;
  provider?: string | null;
  url: string;
  isFree: boolean;
  price?: number | null;
  language?: string | null;
  submittedByProfileId?: string | null;
  trackItemId?: string;
};

export function useCreateCourseService() {
  const fetch = useFetch();

  return useCallback(
    (data: CreateCourseRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/courses`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Course>);
    },
    [fetch]
  );
}

export type CreateCourseReviewRequest = {
  courseId: string;
  rating: number;
  comment?: string | null;
};

export function useCreateCourseReviewService() {
  const fetch = useFetch();

  return useCallback(
    (data: CreateCourseReviewRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/course-reviews`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CourseReview>);
    },
    [fetch]
  );
}

export function useGetCourseByIdService() {
  const fetch = useFetch();

  return useCallback(
    (courseId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/courses/${courseId}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Course>);
    },
    [fetch]
  );
}

export function useGetMyCourseReviewService() {
  const fetch = useFetch();

  return useCallback(
    (courseId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/course-reviews/my-review/${courseId}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CourseReview>);
    },
    [fetch]
  );
}

export type UpdateCourseReviewRequest = {
  id: string;
  rating?: number;
  comment?: string | null;
};

export function useUpdateCourseReviewService() {
  const fetch = useFetch();

  return useCallback(
    (data: UpdateCourseReviewRequest, requestConfig?: RequestConfigType) => {
      const { id, ...rest } = data;
      return fetch(`${API_URL}/api/v1/course-reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify(rest),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<CourseReview>);
    },
    [fetch]
  );
}

export function useDeleteCourseReviewService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/course-reviews/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<void>);
    },
    [fetch]
  );
}

export type UpdateCourseRequest = {
  id: string;
  title?: string;
  description?: string | null;
  provider?: string | null;
  url?: string;
  isFree?: boolean;
  price?: number | null;
  language?: string | null;
  trackItemId?: string | null;
  status?: "PENDING" | "VERIFIED" | "REJECTED";
};

export function useUpdateCourseService() {
  const fetch = useFetch();

  return useCallback(
    (data: UpdateCourseRequest, requestConfig?: RequestConfigType) => {
      const { id, ...rest } = data;
      return fetch(`${API_URL}/api/v1/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(rest),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Course>);
    },
    [fetch]
  );
}

export function useDeleteCourseService() {
  const fetch = useFetch();

  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/courses/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<void>);
    },
    [fetch]
  );
}
