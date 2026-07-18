"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useCompleteTrackItemService,
  useGetLearningTrackOverviewService,
  useGetLearningTrackProgressService,
} from "@/services/api/services/learning-tracks";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { TrackItemType } from "@/services/api/types/learning-track";
import { TRACK_ITEM_TYPE_BADGE } from "@/lib/track-colors";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Map,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AUTO_COMPLETABLE_TYPES = new Set<TrackItemType>([
  TrackItemType.RESOURCE,
  TrackItemType.TEXT,
  TrackItemType.CHECKPOINT,
]);

type CheckpointQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

function isCheckpointConfig(
  config: unknown
): config is { questions: CheckpointQuestion[] } {
  return (
    !!config &&
    typeof config === "object" &&
    Array.isArray((config as { questions?: unknown }).questions)
  );
}

function isCriteriaConfig(config: unknown): config is { criteria: string[] } {
  return (
    !!config &&
    typeof config === "object" &&
    Array.isArray((config as { criteria?: unknown }).criteria)
  );
}

function Quiz({
  questions,
  onAllCorrect,
}: {
  questions: CheckpointQuestion[];
  onAllCorrect: (allCorrect: boolean) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    const next = { ...answers, [questionIndex]: optionIndex };
    setAnswers(next);
    const allAnswered = questions.every((_, i) => next[i] !== undefined);
    const allCorrect =
      allAnswered && questions.every((q, i) => next[i] === q.correctIndex);
    onAllCorrect(allCorrect);
  };

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, qIndex) => (
        <div key={qIndex}>
          <p className="text-[15px] font-semibold">{question.question}</p>
          <div className="mt-2.5 flex flex-col gap-2">
            {question.options.map((option, oIndex) => {
              const selected = answers[qIndex] === oIndex;
              const isCorrectOption = oIndex === question.correctIndex;
              return (
                <button
                  key={oIndex}
                  type="button"
                  onClick={() => handleSelect(qIndex, oIndex)}
                  className={cn(
                    "flex items-center gap-3 rounded-[13px] border-2 px-4 py-3 text-left text-sm font-semibold transition-colors",
                    selected && isCorrectOption
                      ? "border-primary bg-primary/5 text-primary"
                      : selected
                        ? "border-destructive/50 bg-destructive/5 text-destructive"
                        : "border-border text-foreground/80 hover:bg-secondary/40"
                  )}
                >
                  <span
                    className={cn(
                      "h-5 w-5 shrink-0 rounded-full border-2",
                      selected && isCorrectOption
                        ? "border-primary bg-primary"
                        : selected
                          ? "border-destructive"
                          : "border-border"
                    )}
                  />
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompleteMilestonePageContent() {
  const params = useParams();
  const trackId = params.id as string;
  const itemId = params.itemId as string;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const fetchOverview = useGetLearningTrackOverviewService();
  const fetchProgress = useGetLearningTrackProgressService();
  const completeItem = useCompleteTrackItemService();

  const [quizPassed, setQuizPassed] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState<number | null>(null);

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["learning-track-overview", trackId],
    queryFn: async () => {
      const { status, data } = await fetchOverview({ id: trackId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!trackId,
  });

  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["learning-track-progress", trackId],
    queryFn: async () => {
      const { status, data } = await fetchProgress({ id: trackId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!trackId,
  });

  const items = useMemo(
    () => overview?.sections.flatMap((s) => s.items) ?? [],
    [overview]
  );
  const item = useMemo(
    () => items.find((i) => i.id === itemId) ?? null,
    [items, itemId]
  );
  const section = useMemo(
    () => overview?.sections.find((s) => s.section.id === item?.sectionId),
    [overview, item]
  );

  const itemIndex = item ? items.findIndex((i) => i.id === item.id) : -1;
  const currentIndex = useMemo(() => {
    if (!progress) return -1;
    if (progress.isCompleted) return items.length;
    if (!progress.currentItemId) return -1;
    return items.findIndex((i) => i.id === progress.currentItemId);
  }, [items, progress]);

  const isDone = itemIndex >= 0 && itemIndex < currentIndex;
  const isLocked = itemIndex >= 0 && itemIndex > currentIndex;
  const isLoading = isLoadingOverview || isLoadingProgress;

  const nextItem =
    itemIndex >= 0 && itemIndex + 1 < items.length
      ? items[itemIndex + 1]
      : null;
  const isTrackFinished = itemIndex >= 0 && itemIndex === items.length - 1;

  // Section-scoped progress for the sidebar brick strip.
  const sectionItems = section?.items ?? [];
  const sectionDone = sectionItems.filter((sItem) => {
    const idx = items.findIndex((i) => i.id === sItem.id);
    return idx >= 0 && idx < currentIndex;
  }).length;

  const sectionJustFinished =
    !!section?.section.badgeId &&
    sectionItems.length > 0 &&
    sectionDone === sectionItems.length;

  const handleComplete = async () => {
    if (!item) return;
    setCompleting(true);
    try {
      const { status, data } = await completeItem({ id: item.id });
      if (status === HTTP_CODES_ENUM.OK || status === HTTP_CODES_ENUM.CREATED) {
        setJustCompleted(data.awardedJourneyXp);
        enqueueSnackbar("Marco concluído!", { variant: "success" });
        await queryClient.invalidateQueries({
          queryKey: ["learning-track-progress", trackId],
        });
      } else {
        enqueueSnackbar(
          "Não foi possível concluir este marco agora. Tente novamente.",
          { variant: "error" }
        );
      }
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-52 animate-pulse rounded-[22px] bg-muted" />
      </div>
    );
  }

  if (!overview || !item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={Map}
          title="Marco não encontrado"
          description="Este marco não existe ou não pertence a esta trilha."
          action={{
            label: "Voltar para a trilha",
            href: `/trilhas/${trackId}`,
          }}
        />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={Map}
          title="Este marco ainda não foi liberado"
          description="Conclua os marcos anteriores da trilha para chegar até aqui."
          action={{
            label: "Voltar para a trilha",
            href: `/trilhas/${trackId}`,
          }}
        />
      </div>
    );
  }

  const isAutoCompletable = AUTO_COMPLETABLE_TYPES.has(item.type);
  const alreadyDone = isDone || justCompleted !== null;
  const badge = TRACK_ITEM_TYPE_BADGE[item.type];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <Link
        href={`/trilhas/${trackId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {overview.track.title}
        {section && (
          <>
            <span>/</span>
            <span className="font-semibold text-foreground">
              {section.section.title}
            </span>
          </>
        )}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-5">
          {alreadyDone ? (
            <div className="rounded-[22px] border border-border bg-card p-7 shadow-[0_6px_0_var(--border)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <Sparkles className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-lg font-bold">Marco concluído</p>
                  <p className="text-sm text-muted-foreground">
                    {justCompleted !== null && justCompleted > 0
                      ? `Você ganhou ${justCompleted} XP de Jornada.`
                      : "Este marco já faz parte da sua caminhada nesta trilha."}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                {sectionJustFinished && section && (
                  <Button
                    variant="outline"
                    className="mb-3 w-full justify-between gap-2 rounded-2xl py-6 text-[15px] font-bold border-accent/40 text-accent hover:bg-accent/5"
                    render={
                      <Link
                        href={`/trilhas/${trackId}/conquista/${section.section.id}`}
                      />
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 shrink-0" />
                      Ver selo conquistado
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                )}
                {nextItem ? (
                  <Button
                    className="w-full justify-between gap-2 rounded-2xl py-6 text-[15px] font-bold"
                    render={
                      <Link
                        href={`/trilhas/${trackId}/marcos/${nextItem.id}`}
                      />
                    }
                  >
                    <span className="flex flex-col items-start text-left">
                      <span className="font-mono text-[11px] font-normal uppercase tracking-wide text-primary-foreground/70">
                        próximo marco
                      </span>
                      {nextItem.title}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                ) : isTrackFinished ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-accent/10 p-4">
                    <Trophy className="h-6 w-6 shrink-0 text-accent" />
                    <div>
                      <p className="font-bold">Trilha concluída!</p>
                      <p className="text-sm text-muted-foreground">
                        Você percorreu todos os marcos desta trilha.
                      </p>
                    </div>
                  </div>
                ) : null}
                <Link
                  href={`/trilhas/${trackId}`}
                  className="mt-3 inline-block text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Voltar para a trilha
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-border bg-card p-7 shadow-[0_6px_0_var(--border)]">
              <span
                className="inline-block rounded-md px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-white"
                style={{ background: badge.color.bg }}
              >
                {badge.abbr}
              </span>
              <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-tight">
                {item.title}
              </h1>
              {item.body && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              )}

              {item.type === TrackItemType.CHECKPOINT &&
              isCheckpointConfig(item.config) ? (
                <div className="mt-6 flex flex-col gap-5 border-t border-border pt-6">
                  <Quiz
                    questions={item.config.questions}
                    onAllCorrect={setQuizPassed}
                  />
                  <Button
                    onClick={handleComplete}
                    disabled={!quizPassed || completing}
                    className="w-full rounded-2xl py-6 text-[15px] font-bold"
                  >
                    {completing ? "Concluindo..." : "Concluir marco"}
                  </Button>
                </div>
              ) : isAutoCompletable ? (
                <div className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-border p-4">
                  <Circle className="h-6 w-6 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">
                      Já estudei este conteúdo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Marque quando concluir para seguir na trilha.
                    </p>
                  </div>
                  <Button
                    onClick={handleComplete}
                    disabled={completing}
                    className="shrink-0 gap-1.5 rounded-xl"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {completing ? "..." : "Concluir"}
                  </Button>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-5">
                  <div className="mb-3 flex items-center gap-2.5 text-sm font-bold text-primary">
                    <ShieldCheck className="h-4.5 w-4.5" />
                    Este marco exige comprovação
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {item.type === TrackItemType.PROOF
                      ? "Marcos de prova prática são validados por um moderador da comunidade. O envio de comprovantes para esta trilha ainda está sendo integrado."
                      : "Este marco depende de uma comprovação vinculada a outro recurso da comunidade (curso, evento ou missão), que ainda está sendo integrada nesta trilha."}
                  </p>
                  {isCriteriaConfig(item.config) && (
                    <div>
                      <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        O que será avaliado
                      </p>
                      <ul className="flex flex-col gap-2 text-sm">
                        {item.config.criteria.map((criterion, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-bold text-primary">
                              {i + 1}
                            </span>
                            {criterion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {section && (
            <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_6px_0_var(--border)]">
              <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.section.title} · progresso
              </p>
              <div className="mt-3.5 flex gap-1.5">
                {sectionItems.map((sItem) => {
                  const idx = items.findIndex((i) => i.id === sItem.id);
                  const st =
                    idx < currentIndex
                      ? "done"
                      : idx === currentIndex
                        ? "cur"
                        : "todo";
                  return (
                    <span
                      key={sItem.id}
                      className={cn(
                        "h-3.5 flex-1 rounded-md",
                        st === "done" && "bg-primary",
                        st === "cur" && "bg-primary/40 ring-2 ring-primary",
                        st === "todo" && "bg-muted"
                      )}
                    />
                  );
                })}
              </div>
              <p className="mt-2.5 font-mono text-[11px] text-muted-foreground">
                {sectionDone} de {sectionItems.length} marcos concluídos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(CompleteMilestonePageContent);
