"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  useGetGamificationProfileByUsernameService,
  useGetProfileApprovedSubmissionsService,
  useGetGamificationProfilesService,
} from "@/services/api/services/gamification-profiles";
import { useGetActivitiesService } from "@/services/api/services/activities";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { SortEnum } from "@/services/api/types/sort-type";
import {
  getLevel,
  getLevelProgress,
  getNextLevelXp,
  formatXp,
} from "@/lib/gamification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  CalendarDays,
  TrendingUp,
  Trophy,
  UserCircle2,
  Share2,
  Check,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "@/components/link";

// ─── Dot-grid cover pattern ───────────────────────────────────────────────────
function CoverPattern() {
  return (
    <div className="relative h-36 w-full overflow-hidden bg-muted">
      <svg
        className="absolute inset-0 h-full w-full text-primary/10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="cover-dots"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cover-dots)" />
      </svg>
    </div>
  );
}

// ─── Avatar with deterministic color from username ────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-teal-500",
];

function avatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function ProfileAvatar({
  username,
  size = 64,
}: {
  username: string;
  size?: number;
}) {
  const color = avatarColor(username);
  const initials = username.substring(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-4 border-background font-bold font-heading text-white",
        color
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.3) }}
    >
      {initials}
    </div>
  );
}

// ─── Level bar color (matches level.color text-* → bg-*) ─────────────────────
function levelBarColor(levelColor: string): string {
  return levelColor.replace("text-", "bg-");
}

function PublicProfilePageContent() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? "";
  const [copied, setCopied] = useState(false);

  const fetchByUsername = useGetGamificationProfileByUsernameService();
  const fetchApprovedSubmissions = useGetProfileApprovedSubmissionsService();
  const fetchProfiles = useGetGamificationProfilesService();
  const fetchActivities = useGetActivitiesService();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { status, data } = await fetchByUsername(username);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!username,
  });

  const { data: submissionsData, isLoading: loadingSubmissions } = useQuery({
    queryKey: ["public-profile-submissions", profile?.id],
    queryFn: async () => {
      const { status, data } = await fetchApprovedSubmissions(profile!.id, {
        page: 1,
        limit: 10,
      });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    enabled: !!profile?.id,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ["leaderboard-alltime"],
    queryFn: async () => {
      const { status, data } = await fetchProfiles({
        page: 1,
        limit: 100,
        sort: [{ orderBy: "totalXp", order: SortEnum.DESC }],
      });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["activities-map"],
    queryFn: async () => {
      const { status, data } = await fetchActivities({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activityMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of activitiesData ?? []) map.set(a.id, a.title);
    return map;
  }, [activitiesData]);

  const rank = useMemo(() => {
    if (!leaderboardData || !profile) return null;
    const idx = leaderboardData.findIndex((p) => p.id === profile.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboardData, profile]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API indisponível
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse">
        <div className="h-36 bg-muted" />
        <div className="px-4 space-y-4 pt-12 pb-6">
          <div className="h-7 bg-muted rounded w-40" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-6 bg-muted rounded w-full" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center space-y-3">
        <UserCircle2 className="h-14 w-14 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-semibold">Perfil não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          O usuário <span className="font-mono">@{username}</span> não existe.
        </p>
        <Link
          href="/leaderboard"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Ver ranking
        </Link>
      </div>
    );
  }

  // ── Banned ───────────────────────────────────────────────────────────────────
  if (profile.isBanned) {
    return (
      <div className="mx-auto max-w-4xl">
        <CoverPattern />
        <div className="px-4 md:px-6">
          <div className="-mt-9 mb-3">
            <div
              className="flex shrink-0 items-center justify-center rounded-full border-4 border-background bg-muted"
              style={{ width: 72, height: 72 }}
            />
          </div>
          <div className="py-12 text-center space-y-4">
            <Ban className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold font-mono">@{username}</h1>
            <p className="text-sm font-medium text-destructive">
              Este perfil foi banido
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Este usuário foi removido da comunidade por violação das regras da
              plataforma.
            </p>
            <Link
              href="/leaderboard"
              className="text-sm text-primary underline-offset-4 hover:underline block"
            >
              Ver ranking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalXp = profile.totalXp ?? 0;
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const nextLevelXp = getNextLevelXp(totalXp);
  const submissions = submissionsData ?? [];
  const lastContribution = submissions[0]?.createdAt
    ? new Date(submissions[0].createdAt)
    : null;

  const stats = [
    { label: "XP Total", value: formatXp(totalXp), icon: Zap },
    {
      label: "XP Mensal",
      value: formatXp(profile.currentMonthlyXp ?? 0),
      icon: CalendarDays,
    },
    {
      label: "XP Anual",
      value: formatXp(profile.currentYearlyXp ?? 0),
      icon: TrendingUp,
    },
    {
      label: "Ranking Geral",
      value: rank ? `#${rank}` : "—",
      icon: Trophy,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Cover */}
      <CoverPattern />

      {/* Avatar + header */}
      <div className="px-4 md:px-6">
        {/* Avatar overlapping cover */}
        <div className="-mt-9 mb-3">
          <ProfileAvatar username={profile.username} size={72} />
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold font-mono leading-tight">
              @{profile.username}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "text-sm font-semibold px-2 py-0.5 rounded-md bg-muted",
                  level.color
                )}
              >
                {level.name}
              </span>
              {rank && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Trophy className="h-3 w-3 text-amber-400" />#{rank} no
                  ranking geral
                </span>
              )}
            </div>
            {lastContribution && (
              <p className="text-xs text-muted-foreground">
                Última contribuição:{" "}
                {lastContribution.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </>
            )}
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="px-4 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold font-mono leading-none">
                      {value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {label}
                    </p>
                  </div>
                  <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Level progress */}
        <div className="mb-6 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{formatXp(level.minXp)} XP</span>
            <span>{level.name}</span>
            <span>
              {level.maxXp === Infinity ? "∞" : formatXp(level.maxXp) + " XP"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", levelBarColor(level.color))}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          {level.maxXp !== Infinity && (
            <p className="text-xs text-muted-foreground text-right font-mono">
              {formatXp(nextLevelXp - totalXp)} XP para o próximo nível
            </p>
          )}
        </div>

        {/* Contributions timeline */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">
            Contribuições
          </h2>
          {loadingSubmissions ? (
            <div className="space-y-3 pl-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-3 w-3 rounded-full bg-muted mt-1 shrink-0" />
                  <div className="flex-1 h-4 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhuma contribuição aprovada ainda.
            </p>
          ) : (
            <div className="relative pl-4">
              {/* Vertical line */}
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-0">
                {submissions.map((sub, i) => (
                  <div key={sub.id} className="relative flex gap-4 pb-4">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-[-3px] top-[5px] h-3 w-3 rounded-full border-2 border-background",
                        "bg-emerald-500"
                      )}
                    />
                    <div
                      className={cn(
                        "pl-6 flex items-baseline justify-between w-full gap-2",
                        i === submissions.length - 1 && "pb-0"
                      )}
                    >
                      <p className="text-sm font-medium leading-snug">
                        {activityMap.get(sub.activityId) ?? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {sub.activityId.substring(0, 8)}…
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold font-mono text-emerald-500">
                          +{sub.awardedXp} XP
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfilePageContent;
