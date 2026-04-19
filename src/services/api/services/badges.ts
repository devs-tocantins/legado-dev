import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

export type BadgeCriteriaTypeEnum = "AUTOMATIC" | "MANUAL";
export type BadgeCategoryEnum =
  | "MILESTONE"
  | "RANKING"
  | "PARTICIPATION"
  | "SPECIAL";

export type Badge = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  category: BadgeCategoryEnum;
  criteriaType: BadgeCriteriaTypeEnum;
  criteriaConfig?: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GamificationProfileBadge = {
  id: string;
  profileId: string;
  badgeId: string;
  badge: Badge;
  grantedAt: string;
  grantedByUserId?: number | null;
  isAutomatic: boolean;
};

// GET /badges/all — admin only
export function useGetAllBadgesService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/badges/all`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Badge[]>);
    },
    [fetch]
  );
}

// GET /badges — public (active only)
export function useGetActiveBadgesService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/badges`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Badge[]>);
    },
    [fetch]
  );
}

export type CreateBadgeRequest = {
  name: string;
  description: string;
  imageUrl?: string;
  category: BadgeCategoryEnum;
  criteriaType: BadgeCriteriaTypeEnum;
  criteriaConfig?: Record<string, unknown>;
};

// POST /badges — admin only
export function usePostBadgeService() {
  const fetch = useFetch();
  return useCallback(
    (data: CreateBadgeRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/badges`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Badge>);
    },
    [fetch]
  );
}

export type UpdateBadgeRequest = Partial<CreateBadgeRequest> & {
  isActive?: boolean;
  category?: BadgeCategoryEnum;
};

// PATCH /badges/:id — admin only
export function usePatchBadgeService() {
  const fetch = useFetch();
  return useCallback(
    (
      id: string,
      data: UpdateBadgeRequest,
      requestConfig?: RequestConfigType
    ) => {
      return fetch(`${API_URL}/api/v1/badges/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<Badge>);
    },
    [fetch]
  );
}

// DELETE /badges/:id — admin only
export function useDeleteBadgeService() {
  const fetch = useFetch();
  return useCallback(
    (id: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/badges/${id}`, {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<void>);
    },
    [fetch]
  );
}

export type GrantBadgeRequest = {
  badgeId: string;
  profileId: string;
};

// POST /badges/grant — admin only
export function useGrantBadgeService() {
  const fetch = useFetch();
  return useCallback(
    (data: GrantBadgeRequest, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/badges/grant`, {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GamificationProfileBadge>);
    },
    [fetch]
  );
}

// GET /badges/profile/:profileId — public
export function useGetProfileBadgesService() {
  const fetch = useFetch();
  return useCallback(
    (profileId: string, requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/badges/profile/${profileId}`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<GamificationProfileBadge[]>);
    },
    [fetch]
  );
}

// GET /admin/metrics — admin only
export type AdminMetrics = {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  submissionsPending: number;
  submissionsApprovedThisMonth: number;
  submissionsRejectedThisMonth: number;
  totalXpDistributed: number;
  tokensInCirculation: number;
};

export function useGetAdminMetricsService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/admin/metrics`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AdminMetrics>);
    },
    [fetch]
  );
}

// GET /admin/health — admin only
export type ServiceHealth = { ok: boolean; error?: string };
export type AdminHealth = {
  database: ServiceHealth;
  smtp: ServiceHealth;
  storage: ServiceHealth;
  allOk: boolean;
};

export function useGetAdminHealthService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) => {
      return fetch(`${API_URL}/api/v1/admin/health`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<AdminHealth>);
    },
    [fetch]
  );
}
