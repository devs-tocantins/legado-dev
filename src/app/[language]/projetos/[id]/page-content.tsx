"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, Plus, Users, X } from "lucide-react";
import {
  useDeleteProjectInterestService,
  useDeleteProjectParticipantService,
  useDeleteProjectRoleService,
  useGetMyProjectInterestService,
  useGetProjectIdeaService,
  useGetProjectParticipantsService,
  useGetProjectRolesService,
  usePostProjectRoleService,
  usePutProjectInterestService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { ProjectIdea, ProjectParticipant } from "@/services/api/types/project";
import { RoleEnum } from "@/services/api/types/role";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { projectUserName } from "@/lib/project-labels";
import { FIELD_CLASS, UserChip } from "../project-components";

const MAX_STACK = 4;

function participantLabel(participant: ProjectParticipant): string {
  return participant.user?.username
    ? `@${participant.user.username}`
    : projectUserName(participant.user);
}

/** Fotos sobrepostas, no estilo do Instagram; passando do limite vira "+N". */
function AvatarStack({ participants }: { participants: ProjectParticipant[] }) {
  const visible = participants.slice(0, MAX_STACK);
  const extra = participants.length - visible.length;

  return (
    <div className="flex items-center -space-x-3">
      {visible.map((participant) => (
        <Avatar
          key={participant.id}
          className="h-11 w-11 ring-2 ring-card"
          title={participantLabel(participant)}
        >
          {participant.user?.photo?.path && (
            <AvatarImage src={participant.user.photo.path} alt="" />
          )}
          <AvatarFallback>
            {projectUserName(participant.user).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <span className="z-10 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-xs font-semibold ring-2 ring-card">
          +{extra}
        </span>
      )}
    </div>
  );
}

function TeamCard({ idea }: { idea: ProjectIdea }) {
  const { user, isLoaded } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const fetchRoles = useGetProjectRolesService();
  const fetchParticipants = useGetProjectParticipantsService();
  const getMyInterest = useGetMyProjectInterestService();
  const putInterest = usePutProjectInterestService();
  const deleteInterest = useDeleteProjectInterestService();
  const postRole = usePostProjectRoleService();
  const deleteRole = useDeleteProjectRoleService();
  const deleteParticipant = useDeleteProjectParticipantService();

  const [newRole, setNewRole] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmRoleId, setConfirmRoleId] = useState<string | null>(null);

  const userId = user ? Number(user.id) : null;
  const roleId = Number(user?.role?.id);
  const canManage =
    userId !== null &&
    (userId === idea.authorId ||
      roleId === RoleEnum.ADMIN ||
      roleId === RoleEnum.MODERATOR);

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["project-idea-roles", idea.id],
    queryFn: async () => {
      const { status, data } = await fetchRoles({ ideaId: idea.id });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
    enabled: !!user,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["project-idea-participants", idea.id],
    queryFn: async () => {
      const { status, data } = await fetchParticipants({ ideaId: idea.id });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
    enabled: !!user,
  });

  const { data: mine } = useQuery({
    queryKey: ["my-project-interest", idea.id],
    queryFn: async () => {
      const { status, data } = await getMyInterest({ ideaId: idea.id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!user,
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["project-idea-roles", idea.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["project-idea-participants", idea.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["my-project-interest", idea.id],
    });
    queryClient.invalidateQueries({ queryKey: ["project-idea", idea.id] });
  };

  const run = async (
    action: () => Promise<{ status: number; data?: unknown }>,
    okStatuses: number[],
    errorMessage: string,
    successMessage?: string
  ) => {
    setProcessing(true);
    try {
      const { status, data } = await action();
      if (okStatuses.includes(status)) {
        if (successMessage) {
          enqueueSnackbar(successMessage, { variant: "success" });
        }
        refresh();
        return true;
      }
      enqueueSnackbar(getApiError(data, errorMessage), { variant: "error" });
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const handleToggle = (roleName: string, joined: boolean) =>
    joined
      ? run(
          () => deleteInterest({ ideaId: idea.id, role: roleName }),
          [HTTP_CODES_ENUM.NO_CONTENT],
          "Erro ao sair do cargo.",
          "Você saiu do cargo."
        )
      : run(
          () => putInterest({ ideaId: idea.id, role: roleName }),
          [HTTP_CODES_ENUM.OK, HTTP_CODES_ENUM.CREATED],
          "Erro ao entrar no cargo.",
          "Você entrou no time!"
        );

  const handleAddRole = async () => {
    const name = newRole.trim();
    if (name.length < 2) return;
    const ok = await run(
      () => postRole({ ideaId: idea.id, name }),
      [HTTP_CODES_ENUM.OK, HTTP_CODES_ENUM.CREATED],
      "Erro ao adicionar cargo.",
      "Cargo adicionado."
    );
    if (ok) setNewRole("");
  };

  const handleRemoveRole = (role: { id: string; name: string }) => {
    if (confirmRoleId !== role.id) {
      setConfirmRoleId(role.id);
      return;
    }
    setConfirmRoleId(null);
    run(
      () => deleteRole({ ideaId: idea.id, roleId: role.id }),
      [HTTP_CODES_ENUM.NO_CONTENT],
      "Erro ao remover cargo.",
      "Cargo removido."
    );
  };

  const handleRemoveParticipant = (participant: ProjectParticipant) =>
    run(
      () =>
        deleteParticipant({
          ideaId: idea.id,
          userId: participant.userId,
          role: participant.role,
        }),
      [HTTP_CODES_ENUM.NO_CONTENT],
      "Erro ao remover participante."
    );

  if (!isLoaded) return null;

  if (!user) {
    return (
      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Users className="h-5 w-5" />
          Time do projeto
        </h2>
        <p className="text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-semibold text-primary hover:underline"
          >
            Entre na sua conta
          </Link>{" "}
          para ver quem está no time e participar de um cargo.
        </p>
      </section>
    );
  }

  const joinedRoles = new Set(mine?.roles ?? []);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Users className="h-5 w-5" />
          Time do projeto
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Escolha um ou mais cargos para participar. Quem propôs o projeto
          também pode atuar nele.
        </p>
      </div>

      {loadingRoles ? (
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      ) : (
        <ul className="divide-y divide-border">
          {roles.map((role) => {
            const inRole = participants.filter((p) => p.role === role.name);
            const joined = joinedRoles.has(role.name);
            return (
              <li
                key={role.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
              >
                <div className="min-w-[9rem] flex-1">
                  <p className="text-sm font-semibold">{role.name}</p>
                  {inRole.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Vaga aberta</p>
                  ) : (
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                      {inRole.map((participant) => (
                        <span
                          key={participant.id}
                          className="inline-flex items-center gap-0.5"
                        >
                          {participant.user?.username ? (
                            <Link
                              href={`/u/${participant.user.username}`}
                              className="hover:text-foreground hover:underline"
                            >
                              {participantLabel(participant)}
                            </Link>
                          ) : (
                            participantLabel(participant)
                          )}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveParticipant(participant)
                              }
                              disabled={processing}
                              className="rounded p-0.5 hover:text-destructive"
                              aria-label={`Remover ${participantLabel(participant)}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </p>
                  )}
                </div>

                {inRole.length > 0 && <AvatarStack participants={inRole} />}

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={joined ? "outline" : "default"}
                    onClick={() => handleToggle(role.name, joined)}
                    disabled={processing}
                  >
                    {joined ? "Sair" : "Participar"}
                  </Button>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveRole(role)}
                      disabled={processing}
                      aria-label={`Remover cargo ${role.name}`}
                    >
                      {confirmRoleId === role.id ? (
                        <span className="text-xs text-destructive">
                          Remover?
                        </span>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <div className="flex gap-2 border-t border-border pt-4">
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddRole();
              }
            }}
            maxLength={40}
            placeholder="Novo cargo (ex: Mentor)"
            className={FIELD_CLASS}
          />
          <Button
            onClick={handleAddRole}
            disabled={processing || newRole.trim().length < 2}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      )}
    </section>
  );
}

function ProjectIdeaDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const fetchIdea = useGetProjectIdeaService();

  const { data: idea, isLoading } = useQuery({
    queryKey: ["project-idea", id],
    queryFn: async () => {
      const { status, data } = await fetchIdea({ id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState
          icon={Lightbulb}
          title="Projeto não encontrado"
          description="Ele não existe ou ainda não foi aprovado."
          action={{ label: "Ver projetos", href: "/projetos" }}
        />
      </div>
    );
  }

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
        <h1 className="font-heading text-[30px] font-bold leading-tight tracking-tight">
          {idea.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <UserChip user={idea.author} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {idea.interestCount}{" "}
            {idea.interestCount === 1 ? "participante" : "participantes"}
          </span>
        </div>
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <p className="whitespace-pre-line text-[15px] leading-relaxed">
        {idea.description}
      </p>

      {idea.teamId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4">
          <p className="text-sm font-medium">Este projeto já tem um time.</p>
          <Button render={<Link href={`/projetos/times/${idea.teamId}`} />}>
            Ver time
          </Button>
        </div>
      )}

      <TeamCard idea={idea} />
    </div>
  );
}

export default ProjectIdeaDetailPageContent;
