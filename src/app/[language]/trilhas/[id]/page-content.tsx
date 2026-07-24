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
import { TIER_SEAL_LABEL, TRACK_ITEM_TYPE_BADGE } from "@/lib/track-colors";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Map,
  PlayCircle,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrackSuggestionDialog } from "@/components/track-suggestion-dialog";

type SectionState = "done" | "current" | "locked";

function MarcoRow({
  item,
  trackId,
  isDone,
  isCurrent,
}: {
  item: TrackItem;
  trackId: string;
  isDone: boolean;
  isCurrent: boolean;
}) {
  const badge = TRACK_ITEM_TYPE_BADGE[item.type];
  return (
    <div
      className={cn(
        "flex items-center gap-4 border-b border-border/70 px-5 py-3.5 last:border-b-0",
        isCurrent && "bg-primary/5"
      )}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-mono text-[10px] font-bold tracking-wide text-white"
        style={{ background: badge.color.bg }}
      >
        {badge.abbr}
      </span>
      <div className="min-w-0 flex-1">
        {isCurrent && (
          <span className="mb-0.5 inline-block rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-primary">
            próximo passo
          </span>
        )}
        <p className="truncate text-[14.5px] font-semibold leading-snug">
          {item.title}
        </p>
        {item.journeyXp > 0 && (
          <p className="font-mono text-[11px] text-muted-foreground">
            +{item.journeyXp} XP de Jornada
          </p>
        )}
      </div>
      {isDone ? (
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-accent">
            <Check className="h-3.5 w-3.5" />
            concluído
          </span>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/trilhas/${trackId}/marcos/${item.id}`} />}
          >
            Ver
          </Button>
        </div>
      ) : isCurrent ? (
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          render={<Link href={`/trilhas/${trackId}/marcos/${item.id}`} />}
        >
          Começar
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          render={<Link href={`/trilhas/${trackId}/marcos/${item.id}`} />}
        >
          Ver
        </Button>
      )}
    </div>
  );
}

function TrackDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [enrolling, setEnrolling] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

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

  const { data: reqProgress, isLoading: isLoadingReqProgress } = useQuery({
    queryKey: ["learning-track-progress", overview?.track.requiresTrackId],
    queryFn: async () => {
      if (!overview?.track.requiresTrackId) return null;
      const { status, data } = await fetchProgress({
        id: overview.track.requiresTrackId,
      });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!overview?.track.requiresTrackId,
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

  const currentSectionIndex = useMemo(() => {
    if (!overview) return -1;
    if (!progress) return -1;
    if (progress.isCompleted) return overview.sections.length;
    if (!progress.currentSectionId) return -1;
    return overview.sections.findIndex(
      (s) => s.section.id === progress.currentSectionId
    );
  }, [overview, progress]);

  const isLoading =
    isLoadingOverview || isLoadingProgress || isLoadingReqProgress;

  const isLockedByReq = overview?.track.requiresTrackId
    ? !reqProgress?.isCompleted
    : false;

  const currentItem = useMemo(
    () => (currentIndex >= 0 ? items[currentIndex] : null),
    [items, currentIndex]
  );

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
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-52 animate-pulse rounded-[28px] bg-muted" />
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
    <div className="mx-auto max-w-5xl px-4 py-8 pb-20">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          href="/trilhas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Trilhas
        </Link>
        <button
          type="button"
          onClick={() => setSuggestOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Sugerir melhoria
        </button>
      </div>

      <div
        className="grid grid-cols-1 gap-8 rounded-[26px] bg-primary p-8 text-primary-foreground shadow-[0_11px_0_var(--hero-shadow)] sm:grid-cols-[1fr_auto]"
        style={
          {
            "--hero-shadow": "color-mix(in oklch, var(--primary) 75%, black)",
          } as React.CSSProperties
        }
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/75">
            {"// você está construindo"}
          </p>
          <h1 className="mt-1.5 text-[32px] font-bold tracking-tight">
            {track.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-semibold">
              ◆ {TIER_SEAL_LABEL[track.tier]}
            </span>
            <span className="text-sm text-white/85">
              {isCompleted
                ? "trilha concluída"
                : `etapa ${Math.min(currentSectionIndex + 1, sections.length)} de ${sections.length}`}
            </span>
          </div>
          <div className="mt-5 flex gap-1.5">
            {sections.map(({ section }, i) => (
              <span
                key={section.id}
                className={cn(
                  "h-4 flex-1 rounded-md",
                  i < currentSectionIndex && "bg-white",
                  i === currentSectionIndex && "bg-white/55 ring-2 ring-white",
                  i > currentSectionIndex && "bg-white/25"
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start justify-center gap-1.5 sm:items-end sm:text-right">
          {!progress?.enrollment ? (
            <div className="flex flex-col items-center sm:items-end gap-2">
              <Button
                onClick={handleEnroll}
                disabled={enrolling || isLockedByReq}
                className="gap-2 rounded-2xl bg-white px-6 py-6 text-[15px] font-bold text-primary shadow-[0_5px_0_rgba(20,20,20,0.25)] hover:bg-white/90 disabled:opacity-50"
              >
                {isLockedByReq ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                {enrolling ? "Iniciando..." : "Começar"}
              </Button>
              {isLockedByReq && (
                <p className="text-xs font-semibold text-white/80 bg-black/20 px-3 py-1.5 rounded-lg max-w-[200px] text-center">
                  Você precisa concluir a trilha anterior para começar.
                </p>
              )}
            </div>
          ) : !isCompleted && currentItem ? (
            <Button
              className="gap-2 rounded-2xl bg-white px-6 py-6 text-[15px] font-bold text-primary shadow-[0_5px_0_rgba(20,20,20,0.25)] hover:bg-white/90"
              render={<Link href={`/trilhas/${id}/marcos/${currentItem.id}`} />}
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {sections.map(({ section, items: sectionItems }, sectionIndex) => {
          const state: SectionState =
            sectionIndex < currentSectionIndex
              ? "done"
              : sectionIndex === currentSectionIndex
                ? "current"
                : "locked";

          const doneInSection = sectionItems.filter((sItem) => {
            const idx = items.findIndex((i) => i.id === sItem.id);
            return idx >= 0 && idx < currentIndex;
          }).length;

          return (
            <div key={section.id} className="flex gap-4">
              <div className="relative flex w-9 shrink-0 flex-col items-center">
                {sectionIndex > 0 && (
                  <div
                    className={cn(
                      "absolute -top-3 h-3 w-1 rounded-full",
                      state !== "locked" ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border-2 font-mono text-xs font-bold",
                    state === "done" && "border-primary bg-primary text-white",
                    state === "current" &&
                      "border-primary text-primary ring-4 ring-primary/15",
                    state === "locked" && "border-border text-muted-foreground"
                  )}
                >
                  {state === "done" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    String(sectionIndex + 1).padStart(2, "0")
                  )}
                </div>
                {sectionIndex < sections.length - 1 && (
                  <div
                    className={cn(
                      "mt-1 w-1 flex-1 rounded-full",
                      state === "done" ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>

              <div
                className={cn(
                  "mb-1 flex-1 overflow-hidden rounded-[20px] border bg-card shadow-[0_5px_0_var(--section-shadow)]",
                  state === "current" ? "border-primary/40" : "border-border",
                  state === "locked" && "opacity-70"
                )}
                style={
                  { "--section-shadow": "var(--border)" } as React.CSSProperties
                }
              >
                <div className="flex items-center gap-3.5 px-5 py-4">
                  <div>
                    <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                      ETAPA {String(sectionIndex + 1).padStart(2, "0")}
                    </p>
                    <p className="text-[17px] font-bold tracking-tight">
                      {section.title}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-3 py-1.5 font-mono text-[11px] font-bold",
                      state === "done" && "bg-accent/15 text-accent",
                      state === "current" && "bg-primary/10 text-primary",
                      state === "locked" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {state === "done"
                      ? "Concluída"
                      : state === "current"
                        ? `Em andamento · ${doneInSection}/${sectionItems.length}`
                        : "A seguir"}
                  </span>
                </div>

                {state === "locked" && (
                  <p className="flex items-center gap-1.5 px-5 pb-4 font-mono text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    conclua a etapa anterior para desbloquear a conclusão
                  </p>
                )}
                <div className="border-t border-border/70">
                  {sectionItems.map((item) => {
                    const globalIdx = items.findIndex((i) => i.id === item.id);
                    return (
                      <MarcoRow
                        key={item.id}
                        item={item}
                        trackId={id}
                        isDone={globalIdx < currentIndex}
                        isCurrent={globalIdx === currentIndex}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TrackSuggestionDialog
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        trackId={track.id}
        trackTitle={track.title}
      />
    </div>
  );
}

export default withPageRequiredAuth(TrackDetailPageContent);
