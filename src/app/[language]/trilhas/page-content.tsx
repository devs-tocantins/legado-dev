"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useGetLearningTracksService } from "@/services/api/services/learning-tracks";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  LearningTrack,
  LearningTrackStatus,
  LearningTrackTier,
} from "@/services/api/types/learning-track";
import {
  LEARNING_TRACK_TIER_DESCRIPTIONS,
  LEARNING_TRACK_TIER_LABELS,
} from "@/lib/learning-track-labels";
import { Badge } from "@/components/ui/badge";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Map, ArrowRight } from "lucide-react";

const TIER_ORDER: LearningTrackTier[] = [
  LearningTrackTier.ALICERCE,
  LearningTrackTier.PILAR,
  LearningTrackTier.ARCO,
];

function TrackCard({ track }: { track: LearningTrack }) {
  return (
    <Link
      href={`/trilhas/${track.id}`}
      className="group flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="uppercase tracking-wide">
          {track.area}
        </Badge>
      </div>
      <h3 className="font-heading text-lg font-semibold leading-snug">
        {track.title}
      </h3>
      {track.description && (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {track.description}
        </p>
      )}
      <div className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary">
        Ver trilha
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function TrilhasPageContent() {
  const fetchTracks = useGetLearningTracksService();

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ["learning-tracks"],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { status, data } = await fetchTracks(
        { page: pageParam, limit: 50 },
        { signal }
      );
      if (status === HTTP_CODES_ENUM.OK) {
        return {
          data: data.data,
          nextPage: data.hasNextPage ? pageParam + 1 : undefined,
        };
      }
      return { data: [], nextPage: undefined };
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    gcTime: 0,
  });

  const publishedTracks = useMemo<LearningTrack[]>(
    () =>
      (data?.pages.flatMap((p) => p?.data ?? []) ?? []).filter(
        (track) => track.status === LearningTrackStatus.PUBLISHED
      ),
    [data]
  );

  const tierGroups = useMemo(() => {
    return TIER_ORDER.map((tier) => ({
      tier,
      tracks: publishedTracks.filter((track) => track.tier === tier),
    })).filter((group) => group.tracks.length > 0);
  }, [publishedTracks]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-20">
      <div className="mb-9">
        <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Comunidade legado.dev
        </p>
        <h1 className="font-heading text-[34px] font-bold tracking-tight">
          Trilhas de aprendizado
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Percorra marcos guiados, comprove seu conhecimento na prática e
          desbloqueie reconhecimento na comunidade — no seu ritmo.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : tierGroups.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Nenhuma trilha disponível ainda"
          description="Novas trilhas de aprendizado aparecerão aqui em breve."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {tierGroups.map((group) => (
            <div key={group.tier}>
              <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
                <h2 className="font-heading text-lg font-bold">
                  {LEARNING_TRACK_TIER_LABELS[group.tier]}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {LEARNING_TRACK_TIER_DESCRIPTIONS[group.tier]}
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.tracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(TrilhasPageContent);
