"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, Pencil, Plus, X } from "lucide-react";
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
import {
  ProjectIdea,
  ProjectIdeaStatus,
  ProjectParticipant,
  ProjectUserSummary,
} from "@/services/api/types/project";
import { RoleEnum } from "@/services/api/types/role";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { cn, getApiError } from "@/lib/utils";
import { projectRoleFromLabel, projectUserName } from "@/lib/project-labels";
import { FIELD_CLASS } from "../project-components";

const MAX_STACK = 4;
const MAX_NAMES = 3;

const AVATAR_COLORS = [
  "bg-[#2f5fd8]",
  "bg-[#b4540a]",
  "bg-[#0f7b6c]",
  "bg-[#8a3fd1]",
  "bg-[#c0357a]",
  "bg-[#4d6b1f]",
];

function avatarColor(userId: number): string {
  return AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length];
}

function handleOf(user?: ProjectUserSummary | null): string {
  return user?.username ? `@${user.username}` : projectUserName(user);
}

function initialOf(user?: ProjectUserSummary | null): string {
  return projectUserName(user).charAt(0).toUpperCase();
}

function PersonAvatar({
  user,
  userId,
  className,
}: {
  user?: ProjectUserSummary | null;
  userId: number;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {user?.photo?.path && <AvatarImage src={user.photo.path} alt="" />}
      <AvatarFallback
        className={cn("font-semibold text-white", avatarColor(userId))}
      >
        {initialOf(user)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Fotos sobrepostas, no estilo do Instagram; passando do limite vira "+N". */
function AvatarStack({ participants }: { participants: ProjectParticipant[] }) {
  const visible = participants.slice(0, MAX_STACK);
  const extra = participants.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((participant, index) => (
        <PersonAvatar
          key={participant.id}
          user={participant.user}
          userId={participant.userId}
          className={cn(
            "size-14 text-lg ring-[3px] ring-card after:hidden",
            index > 0 && "-ml-4"
          )}
        />
      ))}
      {extra > 0 && (
        <span className="-ml-4 flex size-14 items-center justify-center rounded-full bg-secondary text-[15px] font-semibold ring-[3px] ring-card">
          +{extra}
        </span>
      )}
    </div>
  );
}

function EmptyStack() {
  return (
    <div className="flex items-center">
      <span
        aria-hidden="true"
        className="size-14 rounded-full border-2 border-dashed border-border"
      />
      <span
        aria-hidden="true"
        className="-ml-4 size-14 rounded-full border-2 border-dashed border-border bg-card"
      />
    </div>
  );
}

function TeamSection({ idea }: { idea: ProjectIdea }) {
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

  const [manage, setManage] = useState(false);
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
      <section className="flex flex-col gap-2">
        <h2 className="text-[26px] font-bold tracking-tight">
          Time do projeto
        </h2>
        <p className="text-[15px] text-muted-foreground">
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
    <section className="flex flex-col gap-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-[620px] flex-col gap-1.5">
          <h2 className="text-[26px] font-bold tracking-tight">
            Time do projeto
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Entre em um ou mais cargos. Quem propôs o projeto também pode atuar
            nele
            {canManage ? ", e você pode criar cargos novos." : "."}
          </p>
        </div>
        {canManage && (
          <Button
            variant="outline"
            onClick={() => setManage((value) => !value)}
            className="gap-2"
          >
            <Pencil className="size-4" />
            {manage ? "Concluir edição" : "Gerenciar cargos"}
          </Button>
        )}
      </div>

      {loadingRoles ? (
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {roles.map((role) => {
            const inRole = participants.filter((p) => p.role === role.name);
            const joined = joinedRoles.has(role.name);
            const custom = projectRoleFromLabel(role.name) === undefined;

            return (
              <article
                key={role.id}
                className={cn(
                  "flex min-h-[232px] flex-col gap-5 rounded-2xl border bg-card p-[22px] transition-colors",
                  joined
                    ? "border-primary"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-[17px] font-semibold tracking-tight">
                      {role.name}
                    </h3>
                    {custom && (
                      <span className="w-fit rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                        Cargo criado por quem propôs
                      </span>
                    )}
                  </div>
                  {manage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(role)}
                      disabled={processing}
                      aria-label={`Remover cargo ${role.name}`}
                      className="text-muted-foreground"
                    >
                      {confirmRoleId === role.id ? (
                        <span className="text-xs text-destructive">
                          Remover?
                        </span>
                      ) : (
                        <X className="size-4" />
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-center gap-3">
                  {inRole.length === 0 ? (
                    <div className="flex items-center gap-3.5">
                      <EmptyStack />
                      <span className="text-sm text-muted-foreground">
                        Ninguém ainda. Seja o primeiro.
                      </span>
                    </div>
                  ) : (
                    <>
                      <AvatarStack participants={inRole} />
                      <p className="flex flex-wrap items-center gap-x-1.5 text-sm leading-relaxed text-foreground/80">
                        {(manage ? inRole : inRole.slice(0, MAX_NAMES)).map(
                          (participant, index, list) => (
                            <span
                              key={participant.id}
                              className="inline-flex items-center gap-0.5"
                            >
                              {participant.user?.username ? (
                                <Link
                                  href={`/u/${participant.user.username}`}
                                  className="hover:text-foreground hover:underline"
                                >
                                  {handleOf(participant.user)}
                                </Link>
                              ) : (
                                handleOf(participant.user)
                              )}
                              {manage ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveParticipant(participant)
                                  }
                                  disabled={processing}
                                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                                  aria-label={`Remover ${handleOf(
                                    participant.user
                                  )}`}
                                >
                                  <X className="size-3" />
                                </button>
                              ) : (
                                index < list.length - 1 && ","
                              )}
                            </span>
                          )
                        )}
                        {!manage && inRole.length > MAX_NAMES && (
                          <span>e mais {inRole.length - MAX_NAMES}</span>
                        )}
                      </p>
                    </>
                  )}
                </div>

                <Button
                  variant={joined ? "outline" : "default"}
                  onClick={() => handleToggle(role.name, joined)}
                  disabled={processing}
                  className="h-11 w-full"
                >
                  {joined ? "Sair do cargo" : "Participar"}
                </Button>
              </article>
            );
          })}
        </div>
      )}

      {canManage && manage && (
        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <label htmlFor="novo-cargo" className="sr-only">
            Novo cargo
          </label>
          <input
            id="novo-cargo"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddRole();
              }
            }}
            maxLength={40}
            placeholder="Novo cargo, por exemplo: Mentor"
            className={cn(FIELD_CLASS, "min-w-0 flex-[1_1_280px]")}
          />
          <Button
            onClick={handleAddRole}
            disabled={processing || newRole.trim().length < 2}
            className="h-auto gap-2 px-[18px] py-3"
          >
            <Plus className="size-4" />
            Adicionar cargo
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
  const fetchRoles = useGetProjectRolesService();
  const { user } = useAuth();

  const { data: idea, isLoading } = useQuery({
    queryKey: ["project-idea", id],
    queryFn: async () => {
      const { status, data } = await fetchIdea({ id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!id,
  });

  const { data: roles } = useQuery({
    queryKey: ["project-idea-roles", id],
    queryFn: async () => {
      const { status, data } = await fetchRoles({ ideaId: id });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
    enabled: !!id && !!user,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6">
        <EmptyState
          icon={Lightbulb}
          title="Projeto não encontrado"
          description="Ele não existe ou ainda não foi aprovado."
          action={{ label: "Ver projetos", href: "/projetos" }}
        />
      </div>
    );
  }

  const open =
    idea.status === ProjectIdeaStatus.APPROVED ||
    idea.status === ProjectIdeaStatus.TEAM_FORMED;

  return (
    <div className="mx-auto flex max-w-[1160px] flex-col gap-10 px-4 pb-24 pt-8 sm:px-6">
      <header className="flex flex-col gap-5">
        <Link
          href="/projetos"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Projetos
        </Link>

        <div className="flex max-w-[860px] flex-col gap-4">
          {open && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <span
                aria-hidden="true"
                className="size-[7px] rounded-full bg-emerald-400"
              />
              Aberto a participantes
            </span>
          )}
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[44px]">
            {idea.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              user={idea.author}
              userId={idea.authorId}
              className="size-8 text-xs after:hidden"
            />
            <span className="text-sm text-muted-foreground">
              Proposto por{" "}
              <span className="font-semibold text-foreground">
                {handleOf(idea.author)}
              </span>
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">
              {idea.interestCount}
            </strong>{" "}
            {idea.interestCount === 1 ? "participante" : "participantes"}
          </span>
          {roles && (
            <span className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">
                {roles.length}
              </strong>{" "}
              {roles.length === 1 ? "cargo" : "cargos"}
            </span>
          )}
        </div>

        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {idea.teamId && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4">
          <p className="text-sm font-medium">Este projeto já tem um time.</p>
          <Button render={<Link href={`/projetos/times/${idea.teamId}`} />}>
            Ver time
          </Button>
        </div>
      )}

      <TeamSection idea={idea} />

      <section className="flex max-w-[760px] flex-col gap-6">
        <h2 className="text-[26px] font-bold tracking-tight">
          Sobre o projeto
        </h2>
        <p className="whitespace-pre-line text-base leading-[1.7] text-foreground/80">
          {idea.description}
        </p>
      </section>
    </div>
  );
}

export default ProjectIdeaDetailPageContent;
