"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, Sparkles } from "lucide-react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetProjectIdeaForManagementService,
  useGetProjectInterestsService,
  useGetSuggestedVacanciesService,
  usePostProjectTeamService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { ProjectIdeaStatus, ProjectRole } from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { getApiError } from "@/lib/utils";
import { PROJECT_ROLE_LABELS } from "@/lib/project-labels";
import { useSnackbar } from "@/hooks/use-snackbar";
import { FIELD_CLASS, UserChip } from "../../../project-components";
import {
  VacancyCounts,
  VacancyEditor,
  emptyVacancyCounts,
  vacancyCountsFromList,
  vacancyCountsToList,
} from "../../../vacancy-editor";

function NewProjectTeamPageContent() {
  const params = useParams();
  const ideaId = params.id as string;
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const fetchIdea = useGetProjectIdeaForManagementService();
  const fetchInterests = useGetProjectInterestsService();
  const fetchSuggestions = useGetSuggestedVacanciesService();
  const postTeam = usePostProjectTeamService();

  const { data: idea, isLoading: loadingIdea } = useQuery({
    queryKey: ["project-idea-edit", ideaId],
    queryFn: async () => {
      const { status, data } = await fetchIdea({ id: ideaId });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
  });

  const { data: interests, isLoading: loadingInterests } = useQuery({
    queryKey: ["project-idea-interests", ideaId],
    queryFn: async () => {
      const { status, data } = await fetchInterests({ ideaId });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
  });

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["project-idea-suggestions", ideaId],
    queryFn: async () => {
      const { status, data } = await fetchSuggestions({ ideaId });
      return status === HTTP_CODES_ENUM.OK ? data : [];
    },
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [vacancies, setVacancies] =
    useState<VacancyCounts>(emptyVacancyCounts());
  // userId -> cargo no time. Quem não está no mapa não entra no time.
  const [assignments, setAssignments] = useState<Record<number, ProjectRole>>(
    {}
  );
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pré-preenche vagas com a sugestão e aloca cada interessado no cargo que
  // pediu, enquanto houver vaga — o autor ajusta antes de confirmar.
  useEffect(() => {
    if (initialized || !idea || !interests || !suggestions) return;

    const counts = vacancyCountsFromList(suggestions);
    const remaining = { ...counts };
    const initial: Record<number, ProjectRole> = {};
    for (const interest of interests) {
      if (remaining[interest.role] > 0) {
        initial[interest.userId] = interest.role;
        remaining[interest.role] -= 1;
      }
    }

    setName(idea.title);
    setVacancies(counts);
    setAssignments(initial);
    setInitialized(true);
  }, [initialized, idea, interests, suggestions]);

  const assignedPerRole = useMemo(() => {
    const counts = emptyVacancyCounts();
    for (const role of Object.values(assignments)) counts[role] += 1;
    return counts;
  }, [assignments]);

  const overbooked = Object.values(ProjectRole).filter(
    (role) => assignedPerRole[role] > vacancies[role]
  );
  const totalVacancies = vacancyCountsToList(vacancies).reduce(
    (sum, v) => sum + v.quantity,
    0
  );

  const toggleUser = (userId: number, requestedRole: ProjectRole) => {
    setAssignments((prev) => {
      const next = { ...prev };
      if (userId in next) {
        delete next[userId];
      } else {
        next[userId] = requestedRole;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 3) {
      setError("Dê um nome ao time (mínimo 3 caracteres).");
      return;
    }
    if (totalVacancies === 0) {
      setError("Defina ao menos uma vaga.");
      return;
    }
    if (overbooked.length > 0) {
      setError(
        `Há mais pessoas do que vagas em: ${overbooked
          .map((role) => PROJECT_ROLE_LABELS[role])
          .join(", ")}.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const { status, data } = await postTeam({
        ideaId,
        name: name.trim(),
        description: description.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        vacancies: vacancyCountsToList(vacancies),
        members: Object.entries(assignments).map(([userId, role]) => ({
          userId: Number(userId),
          role,
        })),
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Time criado!", { variant: "success" });
        router.push(`/projetos/times/${data.id}`);
      } else {
        setError(getApiError(data, "Erro ao criar o time."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingIdea || loadingInterests || loadingSuggestions) {
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
          description="Ela não existe ou você não é o autor."
          action={{ label: "Voltar", href: "/projetos/mine" }}
        />
      </div>
    );
  }

  if (idea.status !== ProjectIdeaStatus.APPROVED) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <EmptyState
          icon={Lightbulb}
          title={
            idea.status === ProjectIdeaStatus.TEAM_FORMED
              ? "Esta ideia já tem um time"
              : "A ideia ainda não foi aprovada"
          }
          description={
            idea.status === ProjectIdeaStatus.TEAM_FORMED
              ? undefined
              : "Você poderá montar o time assim que um moderador aprovar."
          }
          action={
            idea.teamId
              ? { label: "Ver time", href: `/projetos/times/${idea.teamId}` }
              : { label: "Meus projetos", href: "/projetos/mine" }
          }
        />
      </div>
    );
  }

  const interestList = interests ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 pb-20">
      <Link
        href={`/projetos/${ideaId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {idea.title}
      </Link>

      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Montar time
        </p>
        <h1 className="font-heading text-[28px] font-bold tracking-tight">
          Quem vai construir este projeto?
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Nome do time <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              className={FIELD_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className={`${FIELD_CLASS} resize-y`}
              placeholder="Como o time vai trabalhar, prazos, ritmo..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Repositório (opcional)
            </label>
            <input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className={FIELD_CLASS}
              placeholder="https://github.com/..."
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">
              Cargos e vagas
            </h2>
            {suggestions && suggestions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setVacancies(vacancyCountsFromList(suggestions))}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Usar sugestão
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            A sugestão considera o interesse demonstrado em cada cargo e o
            conteúdo da ideia. Ajuste como quiser.
          </p>
          <VacancyEditor
            value={vacancies}
            onChange={setVacancies}
            suggestions={suggestions}
          />
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">
            Interessados ({interestList.length})
          </h2>
          {interestList.length === 0 ? (
            <p className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
              Ninguém demonstrou interesse ainda. Você pode criar o time agora e
              adicionar pessoas depois, conforme elas aparecerem.
            </p>
          ) : (
            <div className="space-y-2">
              {interestList.map((interest) => {
                const selected = interest.userId in assignments;
                return (
                  <div
                    key={interest.id}
                    className="space-y-2 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex min-w-0 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleUser(interest.userId, interest.role)
                          }
                        />
                        <UserChip user={interest.user} />
                      </label>
                      {selected ? (
                        <select
                          value={assignments[interest.userId]}
                          onChange={(e) =>
                            setAssignments((prev) => ({
                              ...prev,
                              [interest.userId]: e.target.value as ProjectRole,
                            }))
                          }
                          className="rounded-lg border border-input bg-card px-2 py-1 text-sm"
                        >
                          {Object.values(ProjectRole)
                            .filter(
                              (role) =>
                                vacancies[role] > 0 ||
                                role === assignments[interest.userId]
                            )
                            .map((role) => (
                              <option key={role} value={role}>
                                {PROJECT_ROLE_LABELS[role]}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Quer atuar como {PROJECT_ROLE_LABELS[interest.role]}
                        </span>
                      )}
                    </div>
                    {interest.message && (
                      <p className="pl-7 text-[13px] leading-relaxed text-muted-foreground">
                        {interest.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {overbooked.length > 0 && (
            <p className="text-xs text-destructive">
              Mais pessoas do que vagas em:{" "}
              {overbooked.map((role) => PROJECT_ROLE_LABELS[role]).join(", ")}.
              Aumente as vagas ou desmarque alguém.
            </p>
          )}
        </section>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting || overbooked.length > 0}>
          {submitting ? "Criando..." : "Criar time"}
        </Button>
      </form>
    </div>
  );
}

export default withPageRequiredAuth(NewProjectTeamPageContent);
