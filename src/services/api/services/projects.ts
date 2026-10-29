import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  MyProjectInterest,
  ProjectIdea,
  ProjectIdeaInterest,
  ProjectGroup,
  ProjectIdeaRole,
  ProjectParticipant,
  ProjectRole,
  ProjectTeam,
  ProjectTeamStatus,
  ProjectVacancyInput,
  SuggestedVacancy,
} from "../types/project";
import { RequestConfigType } from "./types/request-config";

export type ProjectsPageRequest = {
  page: number;
  limit: number;
  status?: ProjectTeamStatus;
};

function buildUrl(path: string, data?: ProjectsPageRequest) {
  const url = new URL(`${API_URL}/api/v1/${path}`);
  if (data) {
    url.searchParams.append("page", data.page.toString());
    url.searchParams.append("limit", data.limit.toString());
    if (data.status) url.searchParams.append("status", data.status);
  }
  return url;
}

// ─── Ideias ───────────────────────────────────────────────────────────────────

function useIdeasListService(path: string) {
  const fetch = useFetch();

  return useCallback(
    (data: ProjectsPageRequest, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(path, data), { method: "GET", ...requestConfig }).then(
        wrapperFetchJsonResponse<InfinityPaginationType<ProjectIdea>>
      ),
    [fetch, path]
  );
}

export const useGetProjectIdeasService = () =>
  useIdeasListService("project-ideas");
export const useGetMyProjectIdeasService = () =>
  useIdeasListService("project-ideas/mine");
export const useGetPendingProjectIdeasService = () =>
  useIdeasListService("project-ideas/pending");

export function useGetProjectIdeaService() {
  const fetch = useFetch();

  return useCallback(
    (data: { id: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.id}`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdea>),
    [fetch]
  );
}

export function useGetProjectIdeaForManagementService() {
  const fetch = useFetch();

  return useCallback(
    (data: { id: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.id}/manage`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdea>),
    [fetch]
  );
}

export type ProjectIdeaPayload = {
  title: string;
  description: string;
  tags?: string[];
};

export function usePostProjectIdeaService() {
  const fetch = useFetch();

  return useCallback(
    (data: ProjectIdeaPayload, requestConfig?: RequestConfigType) =>
      fetch(buildUrl("project-ideas"), {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdea>),
    [fetch]
  );
}

export function usePatchProjectIdeaService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { id: string; data: Partial<ProjectIdeaPayload> },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-ideas/${data.id}`), {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdea>),
    [fetch]
  );
}

export function useDeleteProjectIdeaService() {
  const fetch = useFetch();

  return useCallback(
    (data: { id: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.id}`), {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>),
    [fetch]
  );
}

export function usePatchReviewProjectIdeaService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: {
        id: string;
        status: "APPROVED" | "REJECTED";
        rejectionReason?: string;
      },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-ideas/${data.id}/review`), {
        method: "PATCH",
        body: JSON.stringify({
          status: data.status,
          rejectionReason: data.rejectionReason,
        }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdea>),
    [fetch]
  );
}

// ─── Interesse ────────────────────────────────────────────────────────────────

export function useGetMyProjectInterestService() {
  const fetch = useFetch();

  return useCallback(
    (data: { ideaId: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/interest`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<MyProjectInterest>),
    [fetch]
  );
}

export function usePatchProjectFeatureService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { ideaId: string; featured: boolean },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/feature`), {
        method: "PATCH",
        body: JSON.stringify({ featured: data.featured }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdea>),
    [fetch]
  );
}

export function usePostProjectCallService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { ideaId: string; groupLink: string; message?: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/call`), {
        method: "POST",
        body: JSON.stringify({
          groupLink: data.groupLink,
          message: data.message,
        }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<{ notified: number }>),
    [fetch]
  );
}

export function useGetProjectGroupService() {
  const fetch = useFetch();

  return useCallback(
    (data: { ideaId: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/group`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectGroup>),
    [fetch]
  );
}

export function usePutProjectInterestService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { ideaId: string; role?: string; message?: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/interest`), {
        method: "PUT",
        body: JSON.stringify({ role: data.role, message: data.message }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdeaInterest>),
    [fetch]
  );
}

export function useDeleteProjectInterestService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { ideaId: string; role?: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(
        buildUrl(
          `project-ideas/${data.ideaId}/interest${
            data.role ? `?role=${encodeURIComponent(data.role)}` : ""
          }`
        ),
        {
          method: "DELETE",
          ...requestConfig,
        }
      ).then(wrapperFetchJsonResponse<undefined>),
    [fetch]
  );
}

export function useGetProjectInterestsService() {
  const fetch = useFetch();

  return useCallback(
    (data: { ideaId: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/interests`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdeaInterest[]>),
    [fetch]
  );
}

export function useGetProjectRolesService() {
  const fetch = useFetch();

  return useCallback(
    (data: { ideaId: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/roles`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdeaRole[]>),
    [fetch]
  );
}

export function usePostProjectRoleService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { ideaId: string; name: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/roles`), {
        method: "POST",
        body: JSON.stringify({ name: data.name }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectIdeaRole>),
    [fetch]
  );
}

export function useDeleteProjectRoleService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { ideaId: string; roleId: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/roles/${data.roleId}`), {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>),
    [fetch]
  );
}

export function useGetProjectParticipantsService() {
  const fetch = useFetch();

  return useCallback(
    (data: { ideaId: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/participants`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectParticipant[]>),
    [fetch]
  );
}

export function useDeleteProjectParticipantService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { ideaId: string; userId: number; role: string },
      requestConfig?: RequestConfigType
    ) =>
      fetch(
        buildUrl(
          `project-ideas/${data.ideaId}/participants/${
            data.userId
          }?role=${encodeURIComponent(data.role)}`
        ),
        {
          method: "DELETE",
          ...requestConfig,
        }
      ).then(wrapperFetchJsonResponse<undefined>),
    [fetch]
  );
}

export function useGetSuggestedVacanciesService() {
  const fetch = useFetch();

  return useCallback(
    (data: { ideaId: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-ideas/${data.ideaId}/suggested-vacancies`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<SuggestedVacancy[]>),
    [fetch]
  );
}

// ─── Times ────────────────────────────────────────────────────────────────────

function useTeamsListService(path: string) {
  const fetch = useFetch();

  return useCallback(
    (data: ProjectsPageRequest, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(path, data), { method: "GET", ...requestConfig }).then(
        wrapperFetchJsonResponse<InfinityPaginationType<ProjectTeam>>
      ),
    [fetch, path]
  );
}

export const useGetProjectTeamsService = () =>
  useTeamsListService("project-teams");
export const useGetMyProjectTeamsService = () =>
  useTeamsListService("project-teams/mine");

export function useGetProjectTeamService() {
  const fetch = useFetch();

  return useCallback(
    (data: { id: string }, requestConfig?: RequestConfigType) =>
      fetch(buildUrl(`project-teams/${data.id}`), {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectTeam>),
    [fetch]
  );
}

export type ProjectTeamCreatePayload = {
  ideaId: string;
  name: string;
  description?: string;
  repoUrl?: string;
  vacancies: ProjectVacancyInput[];
  members: { userId: number; role: ProjectRole }[];
};

export function usePostProjectTeamService() {
  const fetch = useFetch();

  return useCallback(
    (data: ProjectTeamCreatePayload, requestConfig?: RequestConfigType) =>
      fetch(buildUrl("project-teams"), {
        method: "POST",
        body: JSON.stringify(data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectTeam>),
    [fetch]
  );
}

export type ProjectTeamUpdatePayload = {
  name?: string;
  description?: string | null;
  repoUrl?: string | null;
  status?: ProjectTeamStatus;
  vacancies?: ProjectVacancyInput[];
};

export function usePatchProjectTeamService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { id: string; data: ProjectTeamUpdatePayload },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-teams/${data.id}`), {
        method: "PATCH",
        body: JSON.stringify(data.data),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectTeam>),
    [fetch]
  );
}

export function usePostProjectTeamMemberService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { teamId: string; userId: number; role: ProjectRole },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-teams/${data.teamId}/members`), {
        method: "POST",
        body: JSON.stringify({ userId: data.userId, role: data.role }),
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<ProjectTeam>),
    [fetch]
  );
}

export function useDeleteProjectTeamMemberService() {
  const fetch = useFetch();

  return useCallback(
    (
      data: { teamId: string; userId: number },
      requestConfig?: RequestConfigType
    ) =>
      fetch(buildUrl(`project-teams/${data.teamId}/members/${data.userId}`), {
        method: "DELETE",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<undefined>),
    [fetch]
  );
}
