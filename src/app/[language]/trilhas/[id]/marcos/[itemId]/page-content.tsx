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
import { TRACK_ITEM_TYPE_LABELS } from "@/lib/learning-track-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Map,
  ShieldCheck,
  Sparkles,
  Zap,
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
    <div className="flex flex-col gap-5">
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-semibold">{question.question}</p>
          <div className="flex flex-col gap-2">
            {question.options.map((option, oIndex) => {
              const selected = answers[qIndex] === oIndex;
              const revealed = answers[qIndex] !== undefined;
              const isCorrectOption = oIndex === question.correctIndex;
              return (
                <button
                  key={oIndex}
                  type="button"
                  onClick={() => handleSelect(qIndex, oIndex)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                    selected && isCorrectOption
                      ? "border-accent bg-accent/10"
                      : selected
                        ? "border-destructive/50 bg-destructive/5"
                        : revealed && isCorrectOption
                          ? "border-accent/50"
                          : "border-border hover:bg-secondary/40"
                  )}
                >
                  {selected ? (
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isCorrectOption ? "text-accent" : "text-destructive"
                      )}
                    />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
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
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-20">
      <Link
        href={`/trilhas/${trackId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para a trilha
      </Link>

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{TRACK_ITEM_TYPE_LABELS[item.type]}</Badge>
        {item.journeyXp > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Zap className="h-3 w-3" />+{item.journeyXp} XP de Jornada
          </span>
        )}
      </div>
      <h1 className="mb-5 font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[30px]">
        {item.title}
      </h1>

      {item.body && (
        <p className="mb-7 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
          {item.body}
        </p>
      )}

      {alreadyDone ? (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <Sparkles className="h-6 w-6 shrink-0 text-accent" />
          <div>
            <p className="font-semibold">Marco concluído</p>
            <p className="text-sm text-muted-foreground">
              {justCompleted !== null && justCompleted > 0
                ? `Você ganhou ${justCompleted} XP de Jornada.`
                : "Este marco já faz parte da sua caminhada nesta trilha."}
            </p>
          </div>
        </div>
      ) : item.type === TrackItemType.CHECKPOINT &&
        isCheckpointConfig(item.config) ? (
        <div className="flex flex-col gap-5">
          <Quiz
            questions={item.config.questions}
            onAllCorrect={setQuizPassed}
          />
          <Button
            onClick={handleComplete}
            disabled={!quizPassed || completing}
            className="gap-2 self-start"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? "Concluindo..." : "Concluir marco"}
          </Button>
        </div>
      ) : isAutoCompletable ? (
        <Button
          onClick={handleComplete}
          disabled={completing}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          {completing ? "Concluindo..." : "Marcar como concluído"}
        </Button>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2.5 text-sm font-semibold">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            Este marco exige comprovação
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {item.type === TrackItemType.PROOF
              ? "Marcos de prova prática são validados por um moderador da comunidade. O envio de comprovantes para esta trilha ainda está sendo integrado — em breve você poderá enviar sua prova por aqui."
              : "Este marco depende de uma comprovação vinculada a outro recurso da comunidade (curso, evento ou missão), que ainda está sendo integrada nesta trilha."}
          </p>
          {isCriteriaConfig(item.config) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                O que será avaliado
              </p>
              <ul className="flex flex-col gap-1.5 text-sm">
                {item.config.criteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(CompleteMilestonePageContent);
