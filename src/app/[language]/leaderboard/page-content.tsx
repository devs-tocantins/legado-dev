"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetGamificationProfilesService } from "@/services/api/services/gamification-profiles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { GamificationProfile } from "@/services/api/types/gamification-profile";
import { SortEnum } from "@/services/api/types/sort-type";
import { getLevel, formatXp } from "@/lib/gamification";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "@/components/link";

type Tab = "monthly" | "yearly" | "alltime";

const TAB_LABELS: Record<Tab, string> = {
  monthly: "Mensal",
  yearly: "Anual",
  alltime: "Geral",
};

const TAB_FIELD: Record<Tab, keyof GamificationProfile> = {
  monthly: "currentMonthlyXp",
  yearly: "currentYearlyXp",
  alltime: "totalXp",
};

function PodiumCard({
  profile,
  rank,
  xpField,
}: {
  profile: GamificationProfile;
  rank: 1 | 2 | 3;
  xpField: keyof GamificationProfile;
}) {
  const xp = profile[xpField] as number;
  const level = getLevel(profile.totalXp);

  const podiumStyles: Record<number, string> = {
    1: "bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-500/30 order-first md:order-none",
    2: "bg-gradient-to-b from-slate-400/20 to-slate-400/5 border-slate-400/30",
    3: "bg-gradient-to-b from-amber-700/20 to-amber-700/5 border-amber-700/30",
  };

  const medal =
    rank === 1 ? (
      <Trophy className="h-6 w-6 text-amber-400" />
    ) : rank === 2 ? (
      <Medal className="h-5 w-5 text-slate-400" />
    ) : (
      <Medal className="h-5 w-5 text-amber-700" />
    );

  return (
    <Card className={cn("border", podiumStyles[rank])}>
      <CardContent className="flex flex-col items-center py-4 px-3 text-center gap-1">
        <div className="mb-1">{medal}</div>
        <p className="text-2xl font-bold text-muted-foreground">#{rank}</p>
        <Link
          href={`/u/${profile.username}`}
          className="font-semibold text-sm truncate max-w-full hover:text-primary transition-colors"
        >
          @{profile.username}
        </Link>
        <p className={cn("text-xs font-medium", level.color)}>{level.name}</p>
        <p className="text-xl font-bold mt-1">{formatXp(xp)}</p>
        <p className="text-xs text-muted-foreground">XP</p>
      </CardContent>
    </Card>
  );
}

function LeaderboardPageContent() {
  const [tab, setTab] = useState<Tab>("monthly");
  const fetchProfiles = useGetGamificationProfilesService();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", tab],
    queryFn: async () => {
      const field = TAB_FIELD[tab];
      const { status, data } = await fetchProfiles({
        page: 1,
        limit: 50,
        sort: [{ orderBy: field, order: SortEnum.DESC }],
      });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
  });

  const profiles: GamificationProfile[] = data ?? [];
  const top3 = profiles.slice(0, 3);
  const rest = profiles.slice(3);
  const xpField = TAB_FIELD[tab];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-400" />
          Ranking da Comunidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Os membros mais ativos da Devs Tocantins
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-0">
        {(Object.entries(TAB_LABELS) as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-40 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum dado disponível ainda.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {top3.map((profile, i) => (
                <PodiumCard
                  key={profile.id}
                  profile={profile}
                  rank={(i + 1) as 1 | 2 | 3}
                  xpField={xpField}
                />
              ))}
            </div>
          )}

          {/* Rest of the table */}
          {rest.length > 0 && (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-12">
                      #
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Usuário
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                      Nível
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      XP
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">
                      Tokens
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rest.map((profile, i) => {
                    const level = getLevel(profile.totalXp);
                    const xp = profile[xpField] as number;
                    return (
                      <tr
                        key={profile.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {i + 4}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/u/${profile.username}`}
                            className="hover:text-primary transition-colors"
                          >
                            @{profile.username}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span
                            className={cn("text-xs font-medium", level.color)}
                          >
                            {level.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatXp(xp)}
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className="flex items-center justify-end gap-1 text-amber-500 text-xs">
                            <Coins className="h-3 w-3" />
                            {profile.gratitudeTokens}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LeaderboardPageContent;
