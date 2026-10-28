"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, Users } from "lucide-react";
import {
  useDeleteProjectInterestService,
  useGetMyProjectInterestService,
  useGetProjectIdeaService,
  useGetProjectInterestsService,
  usePutProjectInterestService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  ProjectIdea,
  ProjectIdeaStatus,
  ProjectRole,
} from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { PROJECT_ROLE_LABELS } from "@/lib/project-labels";
import { FIELD_CLASS, RoleChip, UserChip } from "../project-components";

function InterestPanel({ idea }: { idea: ProjectIdea }) {
  const { user, isLoaded } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const getMyInterest = useGetMyProjectInterestService();
  const putInterest = usePutProjectInterestService();
  const deleteInterest = useDeleteProjectInterestService();

  const [role, setRole] = useState<ProjectRole>(ProjectRole.FRONTEND);
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: mine } = useQuery({
    queryKey: ["my-project-interest", idea.id],
    queryFn: async () => {
      const { status, data } = await getMyInterest({ ideaId: idea.id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (mine?.interested && mine.role) {
      setRole(mine.role);
      setMessage(mine.message ?? "");
    }
  }, [mine]);

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["my-project-interest", idea.id],
    });
    queryClient.invalidateQueries({ queryKey: ["project-idea", idea.id] });
  };

  const handleSave = async () => {
    setProcessing(true);
    try {
      const { status, data } = await putInterest({
        ideaId: idea.id,
        role,
        message: message.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.OK || status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(
          mine?.interested ? "Interesse atualizado." : "Interesse registrado!",
          { variant: "success" }
        );
        refresh();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao registrar interesse."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async () => {
    setProcessing(true);
    try {
      const { status } = await deleteInterest({ ideaId: idea.id });
      if (status === HTTP_CODES_ENUM.NO_CONTENT) {
        enqueueSnackbar("Interesse removido.", { variant: "success" });
        setMessage("");
        refresh();
      } else {
        enqueueSnackbar("Erro ao remover interesse.", { variant: "error" });
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!isLoaded) return null;

  if (!user) {
    return (
      <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-semibold text-primary hover:underline"
        >
          Entre na sua conta
        </Link>{" "}
        para dizer em qual cargo gostaria de participar.
      </div>
    );
  }

  if (Number(user.id) === idea.authorId) return null;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-heading text-base font-semibold">
          {mine?.interested
            ? "Você tem interesse neste projeto"
            : "Quero participar"}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          O autor vê a lista de interessados e escolhe quem entra no time.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold">Em qual cargo?</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as ProjectRole)}
          className={FIELD_CLASS}
        >
          {Object.values(ProjectRole).map((value) => (
            <option key={value} value={value}>
              {PROJECT_ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Mensagem para o autor (opcional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          className={`${FIELD_CLASS} resize-y`}
          placeholder="Experiência, disponibilidade de horário..."
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={processing}>
          {mine?.interested ? "Atualizar interesse" : "Tenho interesse"}
        </Button>
        {mine?.interested && (
          <Button variant="ghost" onClick={handleRemove} disabled={processing}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

function InterestsList({ ideaId }: { ideaId: string }) {
  const fetchInterests = useGetProjectInterestsService();

  const { data, isLoading } = useQuery({
    queryKey: ["project-idea-interests", ideaId],
    queryFn: async () => {
      const { status, data } = await fetchInterests({ ideaId });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
  });

  const interests = data ?? [];

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Users className="h-5 w-5" />
        Interessados ({interests.length})
      </h2>
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      ) : interests.length === 0 ? (
        <p className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
          Ninguém demonstrou interesse ainda. Compartilhe a ideia com a
          comunidade!
        </p>
      ) : (
        <div className="space-y-2">
          {interests.map((interest) => (
            <div
              key={interest.id}
              className="space-y-1.5 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <UserChip user={interest.user} />
                <RoleChip role={interest.role} />
              </div>
              {interest.message && (
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {interest.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectIdeaDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
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
          title="Ideia não encontrada"
          description="Ela não existe ou ainda não foi aprovada."
          action={{ label: "Ver projetos", href: "/projetos" }}
        />
      </div>
    );
  }

  const isAuthor = !!user && Number(user.id) === idea.authorId;

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
            {idea.interestCount === 1 ? "interessado" : "interessados"}
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
          <p className="text-sm font-medium">Esta ideia já virou um time.</p>
          <Button render={<Link href={`/projetos/times/${idea.teamId}`} />}>
            Ver time
          </Button>
        </div>
      )}

      {isAuthor && idea.status === ProjectIdeaStatus.APPROVED && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div>
            <p className="text-sm font-semibold">Pronto para montar o time?</p>
            <p className="text-xs text-muted-foreground">
              Defina os cargos e escolha entre os interessados.
            </p>
          </div>
          <Button render={<Link href={`/projetos/${idea.id}/team/new`} />}>
            Montar time
          </Button>
        </div>
      )}

      {isAuthor ? (
        <InterestsList ideaId={idea.id} />
      ) : (
        <InterestPanel idea={idea} />
      )}
    </div>
  );
}

export default ProjectIdeaDetailPageContent;
