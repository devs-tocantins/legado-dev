import { FileEntity } from "./file-entity";

export enum ProjectRole {
  FRONTEND = "FRONTEND",
  BACKEND = "BACKEND",
  DATABASE = "DATABASE",
  REQUIREMENTS_ANALYST = "REQUIREMENTS_ANALYST",
  UX_DESIGNER = "UX_DESIGNER",
  QA = "QA",
  DEVOPS = "DEVOPS",
  MOBILE = "MOBILE",
  PROJECT_MANAGER = "PROJECT_MANAGER",
}

export enum ProjectIdeaStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  TEAM_FORMED = "TEAM_FORMED",
}

export enum ProjectTeamStatus {
  RECRUITING = "RECRUITING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export type ProjectUserSummary = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  photo?: FileEntity | null;
};

export type ProjectIdea = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: ProjectIdeaStatus;
  rejectionReason: string | null;
  authorId: number;
  author?: ProjectUserSummary | null;
  reviewerId: number | null;
  reviewedAt: string | null;
  interestCount: number;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectIdeaInterest = {
  id: string;
  ideaId: string;
  userId: number;
  user?: ProjectUserSummary | null;
  role: ProjectRole;
  message: string | null;
  createdAt: string;
};

export type MyProjectInterest = {
  interested: boolean;
  role: ProjectRole | null;
  message: string | null;
};

export type SuggestedVacancy = {
  role: ProjectRole;
  quantity: number;
  interestedCount: number;
  reason: string;
};

export type ProjectVacancyInput = {
  role: ProjectRole;
  quantity: number;
};

export type ProjectTeamVacancy = ProjectVacancyInput & { filled: number };

export type ProjectTeamMember = {
  id: string;
  userId: number;
  user?: ProjectUserSummary | null;
  role: ProjectRole;
  createdAt: string;
};

export type ProjectTeam = {
  id: string;
  ideaId: string;
  ideaTitle: string;
  name: string;
  description: string | null;
  status: ProjectTeamStatus;
  repoUrl: string | null;
  ownerId: number;
  owner?: ProjectUserSummary | null;
  vacancies: ProjectTeamVacancy[];
  members: ProjectTeamMember[];
  createdAt: string;
  updatedAt: string;
};
