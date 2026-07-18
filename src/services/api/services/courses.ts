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
};

export type CoursesResponse = InfinityPaginationType<Course>;

export function useGetCoursesService() {
  const fetch = useFetch();

  return useCallback(
    (data: CoursesRequest, requestConfig?: RequestConfigType) => {
      const requestUrl = new URL(`${API_URL}/api/v1/courses`);
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

export type CreateCourseRequest = {
  title: string;
  provider?: string | null;
  url: string;
  isFree: boolean;
  price?: number | null;
  language?: string | null;
  submittedByProfileId?: string | null;
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
