"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Crown,
  ExternalLink,
  Lightbulb,
  LogOut,
  UserMinus,
  Users,
} from "lucide-react";
import {
  useDeleteProjectTeamMemberService,
  useGetProjectInterestsService,
  useGetProjectTeamService,
  usePatchProjectTeamService,
  usePostProjectTeamMemberService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  ProjectIdeaInterest,
  ProjectRole,
  ProjectTeam,
  ProjectTeamStatus,
} from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import useAuth from "@/services/auth/use-auth";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import {
  PROJECT_ROLE_LABELS,
  PROJECT_TEAM_STATUS_LABELS,
  projectRoleFromLabel,
} from "@/lib/project-labels";
import {
  FIELD_CLASS,
  RoleChip,
  StatusPill,
  TEAM_STATUS_CLASS,
  UserChip,
} from "../../project-components";
import {
  VacancyCounts,
  VacancyEditor,
  vacancyCountsFromList,
  vacancyCountsToList,
} from "../../vacancy-editor";

function ManagePanel({
  team,
  onChanged,
}: {
  team: ProjectTeam;
  onChanged: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const patchTeam = usePatchProjectTeamService();

  const [status, setStatus] = useState(team.status);
  const [repoUrl, setRepoUrl] = useState(team.repoUrl ?? "");
  const [vacancies, setVacancies] = useState<VacancyCounts>(
    vacancyCountsFromList(team.vacancies)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(team.status);
    setRepoUrl(team.repoUrl ?? "");
    setVacancies(vacancyCountsFromList(team.vacancies));
  }, [team]);

  const filled = team.vacancies.reduce(
    (acc, v) => ({ ...acc, [v.role]: v.filled }),
    {} as Partial<Record<ProjectRole, number>>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const { status: httpStatus, data } = await patchTeam({
        id: team.id,
        data: {
          status,
          repoUrl: repoUrl.trim() || null,
          vacancies: vacancyCountsToList(vacancies),
        },
      });
      if (httpStatus === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Time atualizado.", { variant: "success" });
        onChanged();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao atualizar o time."), {
          variant: "error",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-lg font-semibold">Gerenciar time</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectTeamStatus)}
            className={FIELD_CLASS}
          >
            {Object.values(ProjectTeamStatus).map((value) => (
              <option key={value} value={value}>
                {PROJECT_TEAM_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Repositório</label>
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className={FIELD_CLASS}
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Vagas</label>
        <VacancyEditor
          value={vacancies}
          onChange={setVacancies}
          minimums={filled}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar alterações"}
      </Button>
    </section>
  );
}

function InterestedPanel({
  team,
  onChanged,
}: {
  team: ProjectTeam;
  onChanged: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const fetchInterests = useGetProjectInterestsService();
  const addMember = usePostProjectTeamMemberService();
  const [roles, setRoles] = useState<Record<number, ProjectRole>>({});
  const [processing, setProcessing] = useState<number | null>(null);

  const { data } = useQuery({
    queryKey: ["project-idea-interests", team.ideaId],
    queryFn: async () => {
      const { status, data } = await fetchInterests({ ideaId: team.ideaId });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
  });

  const memberIds = new Set(team.members.map((m) => m.userId));
  const candidates: ProjectIdeaInterest[] = (data ?? []).filter(
    (interest) => !memberIds.has(interest.userId)
  );
  const openRoles = team.vacancies
    .filter((v) => v.filled < v.quantity)
    .map((v) => v.role);

  const roleFor = (interest: ProjectIdeaInterest): ProjectRole | "" => {
    const chosen = roles[interest.userId];
    if (chosen && openRoles.includes(chosen)) return chosen;
    const preferred = projectRoleFromLabel(interest.role);
    if (preferred && openRoles.includes(preferred)) return preferred;
    return openRoles[0] ?? "";
  };

  const handleAdd = async (interest: ProjectIdeaInterest) => {
    const role = roleFor(interest);
    if (!role) return;
    setProcessing(interest.userId);
    try {
      const { status, data } = await addMember({
        teamId: team.id,
        userId: interest.userId,
        role,
      });
      if (status === HTTP_CODES_ENUM.CREATED || status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Pessoa adicionada ao time!", { variant: "success" });
        onChanged();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao adicionar ao time."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(null);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold">
        Interessados fora do time ({candidates.length})
      </h2>
      {candidates.length === 0 ? (
        <p className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
          Nenhum interessado aguardando. Novas pessoas aparecem aqui quando
          demonstrarem interesse na ideia.
        </p>
      ) : openRoles.length === 0 ? (
        <p className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
          Todas as vagas estão preenchidas. Abra novas vagas em “Gerenciar time”
          para chamar mais gente.
        </p>
      ) : (
        <div className="space-y-2">
          {candidates.map((interest) => (
            <div
              key={interest.id}
              className="space-y-2 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <UserChip user={interest.user} />
                <div className="flex items-center gap-2">
                  <select
                    value={roleFor(interest)}
                    onChange={(e) =>
                      setRoles((prev) => ({
                        ...prev,
                        [interest.userId]: e.target.value as ProjectRole,
                      }))
                    }
                    className="rounded-lg border border-input bg-card px-2 py-1 text-sm"
                  >
                    {openRoles.map((role) => (
                      <option key={role} value={role}>
                        {PROJECT_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(interest)}
                    disabled={processing === interest.userId}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Pediu: {interest.role}
                {interest.message ? ` · ${interest.message}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectTeamPageContent() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { confirmDialog } = useConfirmDialog();
  const fetchTeam = useGetProjectTeamService();
  const removeMember = useDeleteProjectTeamMemberService();

  const { data: team, isLoading } = useQuery({
    queryKey: ["project-team", id],
    queryFn: async () => {
      const { status, data } = await fetchTeam({ id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!id,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["project-team", id] });
    queryClient.invalidateQueries({ queryKey: ["my-project-teams"] });
  };

  const handleRemove = async (userId: number, isSelf: boolean) => {
    const isConfirmed = await confirmDialog({
      title: isSelf ? "Sair do time" : "Remover membro",
      message: isSelf
        ? "Tem certeza que deseja sair deste time? A vaga volta a ficar aberta."
        : "Tem certeza que deseja remover esta pessoa do time?",
    });
    if (!isConfirmed) return;

    const { status } = await removeMember({ teamId: id, userId });
    if (status === HTTP_CODES_ENUM.NO_CONTENT) {
      enqueueSnackbar(isSelf ? "Você saiu do time." : "Membro removido.", {
        variant: "success",
      });
      refresh();
    } else {
      enqueueSnackbar("Erro ao remover o membro.", { variant: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState
          icon={Users}
          title="Time não encontrado"
          action={{ label: "Ver projetos", href: "/projetos" }}
        />
      </div>
    );
  }

  const userId = user ? Number(user.id) : null;
  const isOwner = userId !== null && userId === team.ownerId;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-20">
      <Link
        href="/projetos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Projetos
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-[30px] font-bold leading-tight tracking-tight">
            {team.name}
          </h1>
          <StatusPill
            label={PROJECT_TEAM_STATUS_LABELS[team.status]}
            className={TEAM_STATUS_CLASS[team.status]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href={`/projetos/${team.ideaId}`}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Lightbulb className="h-4 w-4" />
            {team.ideaTitle}
          </Link>
          {team.repoUrl && (
            <a
              href={team.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Repositório
            </a>
          )}
        </div>
        {team.description && (
          <p className="whitespace-pre-line text-[15px] leading-relaxed">
            {team.description}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Vagas</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {team.vacancies.map((vacancy) => {
            const full = vacancy.filled >= vacancy.quantity;
            return (
              <div
                key={vacancy.role}
                className="space-y-1.5 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {PROJECT_ROLE_LABELS[vacancy.role]}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {vacancy.filled}/{vacancy.quantity}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={
                      full ? "h-full bg-emerald-600" : "h-full bg-primary"
                    }
                    style={{
                      width: `${Math.min(100, (vacancy.filled / vacancy.quantity) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Integrantes ({team.members.length + 1})
        </h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <UserChip user={team.owner} />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <Crown className="h-3.5 w-3.5" />
              Dono do projeto
            </span>
          </div>
          {team.members.map((member) => {
            const isSelf = userId === member.userId;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <UserChip user={member.user} />
                <div className="flex shrink-0 items-center gap-2">
                  <RoleChip role={member.role} />
                  {(isOwner || isSelf) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive"
                      onClick={() => handleRemove(member.userId, isSelf)}
                    >
                      {isSelf ? (
                        <LogOut className="h-3.5 w-3.5" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                      {isSelf ? "Sair" : "Remover"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {!isOwner && team.status === ProjectTeamStatus.RECRUITING && (
          <p className="text-xs text-muted-foreground">
            Quer entrar? Demonstre interesse na{" "}
            <Link
              href={`/projetos/${team.ideaId}`}
              className="font-semibold text-primary hover:underline"
            >
              página da ideia
            </Link>{" "}
            e o dono do projeto vai avaliar.
          </p>
        )}
      </section>

      {isOwner && (
        <>
          <InterestedPanel team={team} onChanged={refresh} />
          <ManagePanel team={team} onChanged={refresh} />
        </>
      )}
    </div>
  );
}

export default ProjectTeamPageContent;
