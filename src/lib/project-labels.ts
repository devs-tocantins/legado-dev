import {
  ProjectIdeaStatus,
  ProjectRole,
  ProjectTeamStatus,
  ProjectUserSummary,
} from "@/services/api/types/project";

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  [ProjectRole.FRONTEND]: "Front-end",
  [ProjectRole.BACKEND]: "Back-end",
  [ProjectRole.DATABASE]: "Banco de dados",
  [ProjectRole.REQUIREMENTS_ANALYST]: "Analista de requisitos",
  [ProjectRole.UX_DESIGNER]: "UX/UI Designer",
  [ProjectRole.QA]: "QA / Testes",
  [ProjectRole.DEVOPS]: "DevOps",
  [ProjectRole.MOBILE]: "Mobile",
  [ProjectRole.PROJECT_MANAGER]: "Gerente de projeto",
};

/** Cargos da ideia guardam o nome; os padrão voltam ao enum de vaga do time. */
export function projectRoleFromLabel(name: string): ProjectRole | undefined {
  return (Object.values(ProjectRole) as ProjectRole[]).find(
    (role) => PROJECT_ROLE_LABELS[role] === name
  );
}

export const PROJECT_IDEA_STATUS_LABELS: Record<ProjectIdeaStatus, string> = {
  [ProjectIdeaStatus.PENDING]: "Em análise",
  [ProjectIdeaStatus.APPROVED]: "Aberta a interessados",
  [ProjectIdeaStatus.REJECTED]: "Rejeitada",
  [ProjectIdeaStatus.TEAM_FORMED]: "Time formado",
};

export const PROJECT_TEAM_STATUS_LABELS: Record<ProjectTeamStatus, string> = {
  [ProjectTeamStatus.RECRUITING]: "Recrutando",
  [ProjectTeamStatus.IN_PROGRESS]: "Em andamento",
  [ProjectTeamStatus.COMPLETED]: "Concluído",
  [ProjectTeamStatus.CANCELLED]: "Cancelado",
};

export function projectUserName(user?: ProjectUserSummary | null): string {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return name || "Membro da comunidade";
}
