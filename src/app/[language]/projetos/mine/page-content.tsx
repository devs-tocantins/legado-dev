"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Pencil, Plus, Trash2, Users } from "lucide-react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useDeleteProjectIdeaService,
  useGetMyProjectIdeasService,
  useGetMyProjectTeamsService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  ProjectIdea,
  ProjectIdeaStatus,
  ProjectTeam,
} from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PROJECT_IDEA_STATUS_LABELS } from "@/lib/project-labels";
import { useSnackbar } from "@/hooks/use-snackbar";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { IDEA_STATUS_CLASS, StatusPill, TeamCard } from "../project-components";

function MyIdeaRow({
  idea,
  onDelete,
}: {
  idea: ProjectIdea;
  onDelete: (id: string) => void;
}) {
  const editable =
    idea.status === ProjectIdeaStatus.PENDING ||
    idea.status === ProjectIdeaStatus.REJECTED;
  const publicIdea =
    idea.status === ProjectIdeaStatus.APPROVED ||
    idea.status === ProjectIdeaStatus.TEAM_FORMED;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-[15px] font-semibold leading-snug">
            {idea.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {idea.interestCount}{" "}
            {idea.interestCount === 1 ? "interessado" : "interessados"}
          </p>
        </div>
        <StatusPill
          label={PROJECT_IDEA_STATUS_LABELS[idea.status]}
          className={IDEA_STATUS_CLASS[idea.status]}
        />
      </div>

      {idea.status === ProjectIdeaStatus.REJECTED && idea.rejectionReason && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Motivo da rejeição: {idea.rejectionReason}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {publicIdea && (
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/projetos/${idea.id}`} />}
          >
            Ver ideia
          </Button>
        )}
        {idea.status === ProjectIdeaStatus.APPROVED && (
          <Button
            size="sm"
            render={<Link href={`/projetos/${idea.id}/team/new`} />}
          >
            Montar time
          </Button>
        )}
        {idea.teamId && (
          <Button
            size="sm"
            render={<Link href={`/projetos/times/${idea.teamId}`} />}
          >
            Ver time
          </Button>
        )}
        {editable && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            render={<Link href={`/projetos/${idea.id}/edit`} />}
          >
            <Pencil className="h-3.5 w-3.5" />
            {idea.status === ProjectIdeaStatus.REJECTED
              ? "Corrigir e reenviar"
              : "Editar"}
          </Button>
        )}
        {idea.status !== ProjectIdeaStatus.TEAM_FORMED && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-destructive"
            onClick={() => onDelete(idea.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
}

function MyProjectsPageContent() {
  const fetchIdeas = useGetMyProjectIdeasService();
  const fetchTeams = useGetMyProjectTeamsService();
  const deleteIdea = useDeleteProjectIdeaService();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { confirmDialog } = useConfirmDialog();

  const { data: ideas, isLoading: loadingIdeas } = useQuery({
    queryKey: ["my-project-ideas"],
    queryFn: async () => {
      const { status, data } = await fetchIdeas({ page: 1, limit: 50 });
      return status === HTTP_CODES_ENUM.OK ? data.data : [];
    },
  });

  const { data: teams, isLoading: loadingTeams } = useQuery({
    queryKey: ["my-project-teams"],
    queryFn: async () => {
      const { status, data } = await fetchTeams({ page: 1, limit: 50 });
      return status === HTTP_CODES_ENUM.OK ? data.data : [];
    },
  });

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirmDialog({
      title: "Excluir ideia",
      message:
        "Tem certeza? A ideia e a lista de interessados serão removidas.",
    });
    if (!isConfirmed) return;

    const { status } = await deleteIdea({ id });
    if (status === HTTP_CODES_ENUM.NO_CONTENT) {
      enqueueSnackbar("Ideia excluída.", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["my-project-ideas"] });
    } else {
      enqueueSnackbar("Erro ao excluir a ideia.", { variant: "error" });
    }
  };

  const myIdeas: ProjectIdea[] = ideas ?? [];
  const myTeams: ProjectTeam[] = teams ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
            Projetos
          </p>
          <h1 className="font-heading text-[28px] font-bold tracking-tight">
            Meus projetos
          </h1>
        </div>
        <Button className="gap-2" render={<Link href="/projetos/new" />}>
          <Plus className="h-4 w-4" />
          Propor ideia
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Minhas ideias</h2>
        {loadingIdeas ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : myIdeas.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="Você ainda não propôs nenhuma ideia"
            action={{ label: "Propor ideia", href: "/projetos/new" }}
          />
        ) : (
          <div className="space-y-3">
            {myIdeas.map((idea) => (
              <MyIdeaRow key={idea.id} idea={idea} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Times em que participo
        </h2>
        {loadingTeams ? (
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        ) : myTeams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Você ainda não está em nenhum time"
            description="Demonstre interesse em uma ideia aprovada para ser chamado."
            action={{ label: "Ver ideias", href: "/projetos" }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myTeams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default withPageRequiredAuth(MyProjectsPageContent);
