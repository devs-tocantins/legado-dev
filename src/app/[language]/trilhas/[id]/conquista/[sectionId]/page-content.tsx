"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetLearningTrackOverviewService,
  useGetLearningTrackProgressService,
  useGetProofPortfolioService,
  useGetLearningTracksService,
} from "@/services/api/services/learning-tracks";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import {
  useGetProfileBadgesService,
  useGetActiveBadgesService,
  Badge,
} from "@/services/api/services/badges";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { LearningTrackStatus } from "@/services/api/types/learning-track";
import { getTrackColor } from "@/lib/track-colors";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "@/components/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Map as MapIcon,
  Medal,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function ConquistaPageContent() {
  const params = useParams();
  const trackId = params.id as string;
  const sectionId = params.sectionId as string;
  const [copied, setCopied] = useState(false);

  const fetchOverview = useGetLearningTrackOverviewService();
  const fetchProgress = useGetLearningTrackProgressService();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const fetchProfileBadges = useGetProfileBadgesService();
  const fetchActiveBadges = useGetActiveBadgesService();
  const fetchProofPortfolio = useGetProofPortfolioService();
  const fetchTracks = useGetLearningTracksService();

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["learning-track-overview", trackId],
    queryFn: async () => {
      const { status, data } = await fetchOverview({ id: trackId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!trackId,
  });

  const { data: progress } = useQuery({
    queryKey: ["learning-track-progress", trackId],
    queryFn: async () => {
      const { status, data } = await fetchProgress({ id: trackId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!trackId,
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const { data: profileBadges } = useQuery({
    queryKey: ["public-profile-badges", myProfile?.id],
    queryFn: async () => {
      const { status, data } = await fetchProfileBadges(myProfile!.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!myProfile?.id,
  });

  const { data: activeBadges } = useQuery({
    queryKey: ["active-badges"],
    queryFn: async () => {
      const { status, data } = await fetchActiveBadges();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: proofPortfolio } = useQuery({
    queryKey: ["public-profile-portfolio", myProfile?.id],
    queryFn: async () => {
      const { status, data } = await fetchProofPortfolio(myProfile!.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!myProfile?.id,
  });

  const { data: allTracks } = useQuery({
    queryKey: ["public-profile-tracks"],
    queryFn: async () => {
      const { status, data } = await fetchTracks({ page: 1, limit: 50 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(
    () => overview?.sections.flatMap((s) => s.items) ?? [],
    [overview]
  );
  const section = useMemo(
    () => overview?.sections.find((s) => s.section.id === sectionId),
    [overview, sectionId]
  );
  const sectionIndex =
    overview?.sections.findIndex((s) => s.section.id === sectionId) ?? -1;

  const currentIndex = useMemo(() => {
    if (!progress) return -1;
    if (progress.isCompleted) return items.length;
    if (!progress.currentItemId) return -1;
    return items.findIndex((i) => i.id === progress.currentItemId);
  }, [items, progress]);

  const sectionsCompleted = useMemo(() => {
    if (!overview) return 0;
    return overview.sections.filter(({ items: sectionItems }) => {
      if (sectionItems.length === 0) return false;
      return sectionItems.every((it) => {
        const idx = items.findIndex((i) => i.id === it.id);
        return idx >= 0 && idx < currentIndex;
      });
    }).length;
  }, [overview, items, currentIndex]);

  const trackPortfolio = useMemo(
    () => (proofPortfolio ?? []).filter((p) => p.trackId === trackId),
    [proofPortfolio, trackId]
  );

  const daysInTrack = useMemo(() => {
    if (!progress?.enrollment?.startedAt) return null;
    const started = new Date(progress.enrollment.startedAt).getTime();
    return Math.max(
      0,
      Math.floor((Date.now() - started) / (24 * 60 * 60 * 1000))
    );
  }, [progress]);

  const ownedBadgeIds = useMemo(
    () => new Set((profileBadges ?? []).map((pb) => pb.badgeId)),
    [profileBadges]
  );
  const activeBadgesById = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const b of activeBadges ?? []) map.set(b.id, b);
    return map;
  }, [activeBadges]);

  const badge = useMemo(() => {
    const badgeId = section?.section.badgeId;
    if (!badgeId) return undefined;
    return (
      (profileBadges ?? []).find((pb) => pb.badgeId === badgeId)?.badge ??
      activeBadgesById.get(badgeId)
    );
  }, [section, profileBadges, activeBadgesById]);

  const nextSectionWithBadge = useMemo(() => {
    if (!overview || sectionIndex < 0) return null;
    for (let i = sectionIndex + 1; i < overview.sections.length; i++) {
      const nextSection = overview.sections[i].section;
      if (nextSection.badgeId && !ownedBadgeIds.has(nextSection.badgeId)) {
        return {
          section: nextSection,
          badge: activeBadgesById.get(nextSection.badgeId),
        };
      }
    }
    return null;
  }, [overview, sectionIndex, ownedBadgeIds, activeBadgesById]);

  const unlockedTrack = useMemo(() => {
    if (!progress?.isCompleted) return null;
    return (
      (allTracks ?? []).find(
        (t) =>
          t.requiresTrackId === trackId &&
          t.status === LearningTrackStatus.PUBLISHED
      ) ?? null
    );
  }, [progress, allTracks, trackId]);

  const handleShare = async () => {
    if (!myProfile) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/u/${myProfile.username}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard API indisponível
    }
  };

  if (loadingOverview) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-72 animate-pulse rounded-[22px] bg-muted" />
      </div>
    );
  }

  if (!overview || !section) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={MapIcon}
          title="Conquista não encontrada"
          description="Esta etapa não existe ou não pertence a esta trilha."
          action={{
            label: "Voltar para a trilha",
            href: `/trilhas/${trackId}`,
          }}
        />
      </div>
    );
  }

  const color = getTrackColor(trackId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-20">
      <Link
        href={`/trilhas/${trackId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {overview.track.title}
      </Link>

      <div className="rounded-[24px] border border-border bg-card p-8 shadow-[0_8px_0_var(--border)] text-center">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-white"
          style={{ background: color.bg }}
        >
          {badge?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={badge.imageUrl}
              alt={badge.name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <Medal className="h-11 w-11" />
          )}
        </div>

        <p className="mt-5 font-mono text-xs font-bold uppercase tracking-widest text-primary">
          {"// selo conquistado"}
        </p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight tracking-tight">
          {badge?.name ?? section.section.title}
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {overview.track.title}
        </p>
        {(badge?.description ?? section.section.description) && (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {badge?.description ?? section.section.description}
          </p>
        )}

        <div className="mt-7 grid grid-cols-3 gap-3 border-t border-border pt-6">
          <div>
            <p className="text-xl font-bold font-mono">
              {sectionsCompleted}/{overview.sections.length}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              etapas concluídas
            </p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono">
              {trackPortfolio.length}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              marcos provados
            </p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono">{daysInTrack ?? "—"}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              dias de trilha
            </p>
          </div>
        </div>

        {myProfile && (
          <div className="mt-7 overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/og?username=${encodeURIComponent(myProfile.username)}`}
              alt="Card de conquista"
              className="w-full"
            />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                Link copiado!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Compartilhar conquista
              </>
            )}
          </Button>
          <Button
            className="flex-1 gap-1.5"
            render={<Link href={`/u/${myProfile?.username ?? ""}`} />}
          >
            <ShieldCheck className="h-4 w-4" />
            Ver no perfil
          </Button>
        </div>
      </div>

      {nextSectionWithBadge ? (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              próximo selo
            </p>
            <p className="font-bold">
              {nextSectionWithBadge.badge?.name ??
                nextSectionWithBadge.section.title}
            </p>
            <p className="text-sm text-muted-foreground">
              Continue na etapa &quot;{nextSectionWithBadge.section.title}
              &quot; para conquistar.
            </p>
          </div>
          <Link
            href={`/trilhas/${trackId}`}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      ) : unlockedTrack ? (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Award className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              trilha desbloqueada
            </p>
            <p className="font-bold">{unlockedTrack.title}</p>
            <p className="text-sm text-muted-foreground">
              Você já pode começar essa trilha.
            </p>
          </div>
          <Link
            href={`/trilhas/${unlockedTrack.id}`}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default withPageRequiredAuth(ConquistaPageContent);
