"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetLearningTrackOverviewService,
  useGetLearningTrackProgressService,
  useEnrollTrackService,
} from "@/services/api/services/learning-tracks";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { TrackItem } from "@/services/api/types/learning-track";
import {
  LEARNING_TRACK_TIER_LABELS,
  TRACK_ITEM_TYPE_LABELS,
} from "@/lib/learning-track-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Lock,
  Map,
  PlayCircle,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ItemStatus = "done" | "current" | "locked";

function ItemRow({
  item,
  status,
  trackId,
}: {
  item: TrackItem;
  status: ItemStatus;
  trackId: string;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors",
        status === "current" && "border-primary bg-primary/5 shadow-sm",
        status === "done" && "border-border bg-card hover:bg-secondary/40",
        status === "locked" && "border-border/60 bg-muted/30"
      )}
    >
      {status === "done" && (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
      )}
      {status === "current" && (
        <Circle className="h-5 w-5 shrink-0 fill-primary/20 text-primary" />
      )}
      {status === "locked" && (
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}

      <div className="flex flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm font-semibold leading-snug",
            status === "locked" && "text-muted-foreground"
          )}
        >
          {item.title}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{TRACK_ITEM_TYPE_LABELS[item.type]}</span>
          {item.journeyXp > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />+{item.journeyXp} XP de Jornada
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (status === "locked") return content;

  return <Link href={`/trilhas/${trackId}/marcos/${item.id}`}>{content}</Link>;
}

function TrackDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [enrolling, setEnrolling] = useState(false);

  const fetchOverview = useGetLearningTrackOverviewService();
  const fetchProgress = useGetLearningTrackProgressService();
  const enrollTrack = useEnrollTrackService();

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["learning-track-overview", id],
    queryFn: async () => {
      const { status, data } = await fetchOverview({ id });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!id,
  });

  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["learning-track-progress", id],
    queryFn: async () => {
      const { status, data } = await fetchProgress({ id });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!id,
  });

  const items = useMemo(
    () => overview?.sections.flatMap((s) => s.items) ?? [],
    [overview]
  );

  const currentIndex = useMemo(() => {
    if (!progress) return -1;
    if (progress.isCompleted) return items.length;
    if (!progress.currentItemId) return -1;
    return items.findIndex((item) => item.id === progress.currentItemId);
  }, [items, progress]);

  const completedCount = currentIndex < 0 ? 0 : currentIndex;
  const isLoading = isLoadingOverview || isLoadingProgress;

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollTrack({ trackId: id });
      enqueueSnackbar("Trilha iniciada! Bora percorrer os marcos.", {
        variant: "success",
      });
      await queryClient.invalidateQueries({
        queryKey: ["learning-track-progress", id],
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={Map}
          title="Trilha não encontrada"
          description="Esta trilha não existe ou não está mais disponível."
          action={{ label: "Voltar para trilhas", href: "/trilhas" }}
        />
      </div>
    );
  }

  const { track, sections } = overview;
  const isCompleted = !!progress?.isCompleted;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-20">
      <Link
        href="/trilhas"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para trilhas
      </Link>

      <div className="mb-3.5 flex flex-wrap gap-2">
        <Badge variant="secondary">
          {LEARNING_TRACK_TIER_LABELS[track.tier]}
        </Badge>
        <Badge variant="secondary" className="uppercase tracking-wide">
          {track.area}
        </Badge>
      </div>
      <h1 className="mb-3 font-heading text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
        {track.title}
      </h1>
      {track.description && (
        <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {track.description}
        </p>
      )}

      <div className="mb-8 rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>
            {completedCount} de {items.length} marcos concluídos
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-accent">
              <Trophy className="h-4 w-4" />
              Concluída
            </span>
          )}
        </div>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${items.length ? (completedCount / items.length) * 100 : 0}%`,
            }}
          />
        </div>

        {!progress?.enrollment ? (
          <Button onClick={handleEnroll} disabled={enrolling} className="gap-2">
            <PlayCircle className="h-4 w-4" />
            {enrolling ? "Iniciando..." : "Começar trilha"}
          </Button>
        ) : !isCompleted && progress.currentItemId ? (
          <Button
            className="gap-2"
            render={
              <Link href={`/trilhas/${id}/marcos/${progress.currentItemId}`} />
            }
          >
            <PlayCircle className="h-4 w-4" />
            Continuar de onde parou
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-8">
        {sections.map(({ section, items: sectionItems }) => (
          <div key={section.id}>
            <div className="mb-3 border-b border-border pb-2.5">
              <h2 className="font-heading text-base font-bold">
                {section.title}
              </h2>
              {section.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {section.description}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              {sectionItems.map((item) => {
                const index = items.findIndex((i) => i.id === item.id);
                const status: ItemStatus =
                  index < currentIndex
                    ? "done"
                    : index === currentIndex
                      ? "current"
                      : "locked";
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    status={status}
                    trackId={id}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(TrackDetailPageContent);
