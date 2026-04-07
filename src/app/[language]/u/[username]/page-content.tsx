"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap,
  CalendarDays,
  TrendingUp,
  Coins,
  Trophy,
  CheckCircle2,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "@/components/link";

function PublicProfilePageContent() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? "";

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
    queryKey: ["leaderboard", "alltime"],
    queryFn: async () => {
      const { status, data } = await fetchProfiles({
        page: 1,
        limit: 100,
        sort: [{ orderBy: "totalXp", order: SortEnum.DESC }],
      });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
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
    for (const a of activitiesData ?? []) {
      map.set(a.id, a.title);
    }
    return map;
  }, [activitiesData]);

  const rank = useMemo(() => {
    if (!leaderboardData || !profile) return null;
    const idx = leaderboardData.findIndex((p) => p.id === profile.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboardData, profile]);

  if (loadingProfile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

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

  const totalXp = profile.totalXp ?? 0;
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const nextLevelXp = getNextLevelXp(totalXp);
  const submissions = submissionsData ?? [];

  const stats = [
    {
      label: "XP Total",
      value: formatXp(totalXp),
      icon: Zap,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "XP Mensal",
      value: formatXp(profile.currentMonthlyXp ?? 0),
      icon: CalendarDays,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      label: "XP Anual",
      value: formatXp(profile.currentYearlyXp ?? 0),
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Tokens",
      value: profile.gratitudeTokens ?? 0,
      icon: Coins,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            @{profile.username}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={cn("text-sm font-semibold", level.color)}>
              {level.name}
            </span>
            {rank && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Trophy className="h-3 w-3 text-amber-400" />#{rank} no ranking
                geral
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="py-3">
            <CardContent className="px-4 flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  bg
                )}
              >
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Level progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Progresso de Nível
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {level.name} — {formatXp(level.minXp)} XP
            </span>
            <span>{progress}%</span>
            <span>
              {level.maxXp === Infinity
                ? "Nível máximo"
                : formatXp(level.maxXp) + " XP"}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-500", {
                "bg-slate-400": level.name === "Novato",
                "bg-emerald-500": level.name === "Contribuidor",
                "bg-sky-500": level.name === "Colaborador Ativo",
                "bg-blue-500": level.name === "Referência",
                "bg-amber-500": level.name === "Mentor",
                "bg-rose-500": level.name === "Lenda",
              })}
              style={{ width: `${progress}%` }}
            />
          </div>
          {level.maxXp !== Infinity && (
            <p className="text-xs text-muted-foreground text-right">
              {formatXp(nextLevelXp - totalXp)} XP para o próximo nível
            </p>
          )}
        </CardContent>
      </Card>

      {/* Approved submissions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Atividades Concluídas
        </h2>
        <div className="rounded-lg border bg-card">
          {loadingSubmissions ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse py-3 px-4 flex justify-between"
                >
                  <div className="h-3.5 bg-muted rounded w-40" />
                  <div className="h-3.5 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade concluída ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-medium truncate max-w-[60%]">
                    {activityMap.get(sub.activityId) ?? (
                      <span className="font-mono text-xs text-muted-foreground">
                        {sub.activityId.substring(0, 8)}…
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
                      <Zap className="h-3 w-3" />+{sub.awardedXp} XP
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicProfilePageContent;
