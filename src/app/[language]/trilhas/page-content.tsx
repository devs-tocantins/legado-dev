"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetLearningTracksService,
  useGetLearningTrackOverviewService,
  useGetLearningTrackProgressService,
} from "@/services/api/services/learning-tracks";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  LearningTrack,
  LearningTrackOverview,
  LearningTrackProgress,
  LearningTrackStatus,
  LearningTrackTier,
} from "@/services/api/types/learning-track";
import {
  getTrackColor,
  getTrackAbbreviation,
  TIER_SEAL_LABEL,
} from "@/lib/track-colors";
import { getLevel, LEVELS } from "@/lib/gamification";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Map as MapIcon,
  ArrowRight,
  Lock,
  Trophy,
  MessageSquarePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TrackSuggestionDialog } from "@/components/track-suggestion-dialog";

const TIER_FILTERS: { key: LearningTrackTier | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: LearningTrackTier.ALICERCE, label: "Estagiar" },
  { key: LearningTrackTier.PILAR, label: "Júnior" },
  { key: LearningTrackTier.ARCO, label: "Pleno" },
];

type TrackData = {
  track: LearningTrack;
  overview: LearningTrackOverview | null;
  progress: LearningTrackProgress | null;
};

function useTracksWithProgress() {
  const fetchTracks = useGetLearningTracksService();
  const fetchOverview = useGetLearningTrackOverviewService();
  const fetchProgress = useGetLearningTrackProgressService();

  return useQuery({
    queryKey: ["learning-tracks-hub"],
    queryFn: async (): Promise<TrackData[]> => {
      const { status, data } = await fetchTracks({ page: 1, limit: 50 });
      if (status !== HTTP_CODES_ENUM.OK) return [];

      const published = data.data.filter(
        (track) => track.status === LearningTrackStatus.PUBLISHED
      );

      return Promise.all(
        published.map(async (track) => {
          const [overviewRes, progressRes] = await Promise.all([
            fetchOverview({ id: track.id }),
            fetchProgress({ id: track.id }),
          ]);
          return {
            track,
            overview:
              overviewRes.status === HTTP_CODES_ENUM.OK
                ? overviewRes.data
                : null,
            progress:
              progressRes.status === HTTP_CODES_ENUM.OK
                ? progressRes.data
                : null,
          };
        })
      );
    },
    gcTime: 0,
  });
}

function TrackArt({
  trackId,
  abbr,
  seal,
}: {
  trackId: string;
  abbr: string;
  seal: string;
}) {
  const color = getTrackColor(trackId);
  return (
    <div
      className="relative h-24 overflow-hidden p-3.5"
      style={{ background: color.bg }}
    >
      <span
        className="relative z-[1] inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold shadow-sm"
        style={{ color: color.sealText }}
      >
        ◆ {seal}
      </span>
      <span
        className="pointer-events-none absolute -bottom-8 -right-1.5 select-none font-mono text-[92px] font-bold leading-none tracking-tighter text-white/15"
        aria-hidden
      >
        {abbr}
      </span>
    </div>
  );
}

function TrackCard({
  data,
  locked,
  requiredTrackTitle,
}: {
  data: TrackData;
  locked: boolean;
  requiredTrackTitle?: string;
}) {
  const { track, overview, progress } = data;
  const color = getTrackColor(track.id);
  const abbr = getTrackAbbreviation(track.title);
  const seal = TIER_SEAL_LABEL[track.tier];
  const itemCount = overview?.sections.flatMap((s) => s.items).length ?? 0;
  const sectionCount = overview?.sections.length ?? 0;

  const cardBody = (
    <>
      <TrackArt trackId={track.id} abbr={abbr} seal={seal} />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[19px] font-bold leading-snug tracking-tight">
          {track.title}
        </h3>
        {track.description && (
          <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted-foreground line-clamp-3">
            {track.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">
            {sectionCount} etapas · {itemCount} marcos
          </span>
          {locked ? (
            <span className="flex items-center gap-1.5 rounded-xl bg-muted px-4 py-2 text-[13px] font-bold text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {requiredTrackTitle
                ? `Conclua ${requiredTrackTitle}`
                : "Bloqueada"}
            </span>
          ) : (
            <span
              className="rounded-xl px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_4px_0_var(--track-shadow)] transition-transform active:translate-y-[2px] active:shadow-[0_2px_0_var(--track-shadow)]"
              style={
                {
                  background: color.bg,
                  "--track-shadow": color.shadow,
                } as React.CSSProperties
              }
            >
              {progress?.enrollment ? "Continuar" : "Começar"}
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className = cn(
    "flex flex-col overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_6px_0_var(--card-shadow)] transition-all",
    locked
      ? "opacity-70"
      : "hover:-translate-y-[3px] hover:shadow-[0_9px_0_var(--card-shadow)]"
  );
  const style = { "--card-shadow": "var(--border)" } as React.CSSProperties;

  if (locked) {
    return (
      <div className={className} style={style}>
        {cardBody}
      </div>
    );
  }

  return (
    <Link href={`/trilhas/${track.id}`} className={className} style={style}>
      {cardBody}
    </Link>
  );
}

function TrilhasPageContent() {
  const { data: tracksData, isLoading } = useTracksWithProgress();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const [tierFilter, setTierFilter] = useState<LearningTrackTier | "all">(
    "all"
  );
  const [suggestOpen, setSuggestOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["my-gamification-profile", "trilhas-hub"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
  });

  const tracks = useMemo(() => tracksData ?? [], [tracksData]);

  const lockInfoByTrackId = useMemo(() => {
    const map = new Map<string, { locked: boolean; requiredTitle?: string }>();
    for (const { track } of tracks) {
      if (!track.requiresTrackId) {
        map.set(track.id, { locked: false });
        continue;
      }
      const required = tracks.find((t) => t.track.id === track.requiresTrackId);
      map.set(track.id, {
        locked: !required?.progress?.isCompleted,
        requiredTitle: required?.track.title,
      });
    }
    return map;
  }, [tracks]);

  const featured = useMemo(() => {
    const inProgress = tracks.find(
      (t) => t.progress?.enrollment && !t.progress.isCompleted
    );
    return inProgress ?? tracks[0] ?? null;
  }, [tracks]);

  const heroSectionBricks = useMemo(() => {
    if (!featured?.overview) return [];
    const sections = featured.overview.sections;
    const currentSectionIndex = featured.progress?.currentSectionId
      ? sections.findIndex(
          (s) => s.section.id === featured.progress?.currentSectionId
        )
      : featured.progress?.isCompleted
        ? sections.length
        : -1;
    return sections.map((s, i) => ({
      id: s.section.id,
      state:
        currentSectionIndex < 0
          ? "todo"
          : i < currentSectionIndex
            ? "done"
            : i === currentSectionIndex
              ? "cur"
              : "todo",
    }));
  }, [featured]);

  const doneCount = heroSectionBricks.filter((b) => b.state === "done").length;

  const visibleTracks = useMemo(
    () =>
      tierFilter === "all"
        ? tracks
        : tracks.filter((t) => t.track.tier === tierFilter),
    [tracks, tierFilter]
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 pb-20">
        <div className="h-64 animate-pulse rounded-[28px] bg-muted" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          icon={MapIcon}
          title="Nenhuma trilha disponível ainda"
          description="Novas trilhas de aprendizado aparecerão aqui em breve."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-20">
      {featured && (
        <div
          className="grid grid-cols-1 gap-9 rounded-[28px] bg-primary p-9 text-primary-foreground shadow-[0_11px_0_var(--hero-shadow)] sm:grid-cols-[196px_1fr]"
          style={
            {
              "--hero-shadow": "color-mix(in oklch, var(--primary) 75%, black)",
            } as React.CSSProperties
          }
        >
          <div className="relative hidden h-[196px] w-[196px] items-center justify-center overflow-hidden rounded-3xl bg-white/15 sm:flex">
            <span className="pointer-events-none absolute -bottom-6 -right-3 select-none font-mono text-[110px] font-bold leading-none tracking-tighter text-white/15">
              {getTrackAbbreviation(featured.track.title)}
            </span>
            <MapIcon className="relative z-[1] h-16 w-16 text-white/90" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/75">
              {featured.progress?.enrollment
                ? "// continuar sua trilha"
                : "// comece por aqui"}
            </p>
            <h1 className="mt-1.5 text-4xl font-bold tracking-tight">
              {featured.track.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-semibold">
                ◆ {TIER_SEAL_LABEL[featured.track.tier]}
              </span>
              <span className="text-sm text-white/85">
                {featured.progress?.isCompleted
                  ? "trilha concluída"
                  : "construindo seu selo"}
              </span>
            </div>
            {heroSectionBricks.length > 0 && (
              <>
                <div className="mt-5 flex gap-1.5">
                  {heroSectionBricks.map((b) => (
                    <span
                      key={b.id}
                      className={cn(
                        "h-4 flex-1 rounded-md",
                        b.state === "done" && "bg-white",
                        b.state === "cur" && "bg-white/55 ring-2 ring-white",
                        b.state === "todo" && "bg-white/25"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-3 font-mono text-xs text-white/85">
                  {doneCount} de {heroSectionBricks.length} etapas concluídas
                </p>
              </>
            )}
            <Link
              href={`/trilhas/${featured.track.id}`}
              className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-6 py-3 text-[15px] font-bold text-primary shadow-[0_5px_0_rgba(20,20,20,0.25)] transition-transform active:translate-y-[3px] active:shadow-[0_2px_0_rgba(20,20,20,0.25)]"
            >
              {featured.progress?.enrollment ? "Continuar" : "Começar"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-bold tracking-tight">
                Explorar trilhas
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Cada marco cumprido vira prova verificada no seu perfil público.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {TIER_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTierFilter(f.key)}
                  className={cn(
                    "rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                    tierFilter === f.key
                      ? "border-foreground/20 bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  {f.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSuggestOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3.5 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Sugerir trilha
              </button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {visibleTracks.map((data) => {
              const lockInfo = lockInfoByTrackId.get(data.track.id);
              return (
                <TrackCard
                  key={data.track.id}
                  data={data}
                  locked={lockInfo?.locked ?? false}
                  requiredTrackTitle={lockInfo?.requiredTitle}
                />
              );
            })}
          </div>
        </div>

        {profile && (
          <div className="flex flex-col gap-4">
            <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_6px_0_var(--border)]">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sua reputação
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  N{LEVELS.indexOf(getLevel(profile.totalXp)) + 1} ·{" "}
                  {getLevel(profile.totalXp).name}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                <span className="text-[26px] font-bold">{profile.totalXp}</span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Pontos de reputação construídos com contribuição para a
                comunidade.
              </p>
            </div>
            {featured && (
              <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_6px_0_var(--border)]">
                <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Próximo selo
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-center text-[11px] font-bold leading-tight text-primary">
                    ◆<br />
                    {TIER_SEAL_LABEL[featured.track.tier]}
                  </div>
                  <div>
                    <p className="text-[15px] font-bold">
                      {heroSectionBricks.length
                        ? Math.round(
                            (doneCount / heroSectionBricks.length) * 100
                          )
                        : 0}
                      % construído
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      Faltam {heroSectionBricks.length - doneCount} etapas para
                      o selo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <TrackSuggestionDialog open={suggestOpen} onOpenChange={setSuggestOpen} />
    </div>
  );
}

export default withPageRequiredAuth(TrilhasPageContent);
