"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetGamificationProfilesService,
  useGetMyGamificationProfileService,
} from "@/services/api/services/gamification-profiles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { GamificationProfile } from "@/services/api/types/gamification-profile";
import { SortEnum } from "@/services/api/types/sort-type";
import { getLevel, formatXp } from "@/lib/gamification";
import { Trophy, Medal, Coins, Crown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLeaderboard } from "@/components/ui/skeleton-patterns";
import { cn } from "@/lib/utils";
import Link from "@/components/link";
import useAuth from "@/services/auth/use-auth";

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

const PODIUM_CONFIG = {
  1: {
    height: "h-60",
    border: "border-l-4 border-amber-400",
    bg: "bg-amber-400/5",
    rankColor: "text-amber-400",
    icon: <Crown className="h-5 w-5 text-amber-400" />,
    order: "order-2",
  },
  2: {
    height: "h-48",
    border: "border-l-4 border-slate-400",
    bg: "bg-slate-400/5",
    rankColor: "text-slate-400",
    icon: <Medal className="h-4 w-4 text-slate-400" />,
    order: "order-1",
  },
  3: {
    height: "h-44",
    border: "border-l-4 border-amber-700",
    bg: "bg-amber-700/5",
    rankColor: "text-amber-700",
    icon: <Medal className="h-4 w-4 text-amber-700" />,
    order: "order-3",
  },
} as const;

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
  const cfg = PODIUM_CONFIG[rank];

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-lg border p-3 text-center w-full",
        cfg.height,
        cfg.border,
        cfg.bg,
        cfg.order
      )}
    >
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="flex items-center justify-center">{cfg.icon}</div>
        <p className={cn("text-lg font-bold leading-none", cfg.rankColor)}>
          #{rank}
        </p>
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <Link
          href={`/u/${profile.username}`}
          className="font-semibold text-xs truncate max-w-full hover:text-primary transition-colors"
        >
          @{profile.username}
        </Link>
        <p className={cn("text-xs font-medium", level.color)}>{level.name}</p>
        <p className="text-lg font-bold font-mono mt-0.5">{formatXp(xp)}</p>
        <p className="text-xs text-muted-foreground -mt-0.5">XP</p>
      </div>
    </div>
  );
}

function TableRow({
  profile,
  position,
  xpField,
  isMe,
}: {
  profile: GamificationProfile;
  position: number;
  xpField: keyof GamificationProfile;
  isMe: boolean;
}) {
  const level = getLevel(profile.totalXp);
  const xp = profile[xpField] as number;

  return (
    <tr
      className={cn(
        "transition-colors",
        isMe ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
      )}
    >
      <td className="px-4 py-3 text-muted-foreground font-mono text-xs w-12">
        {position}
      </td>
      <td className="px-4 py-3 font-medium">
        <Link
          href={`/u/${profile.username}`}
          className={cn(
            "hover:text-primary transition-colors",
            isMe && "text-primary font-semibold"
          )}
        >
          @{profile.username}
        </Link>
        {isMe && (
          <span className="ml-2 text-xs text-primary font-normal">(você)</span>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className={cn("text-xs font-medium", level.color)}>
          {level.name}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-semibold font-mono">
        {formatXp(xp)}
      </td>
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        <span className="flex items-center justify-end gap-1 text-amber-500 text-xs font-mono">
          <Coins className="h-3 w-3" />
          {profile.gratitudeTokens}
        </span>
      </td>
    </tr>
  );
}

function LeaderboardPageContent() {
  const [tab, setTab] = useState<Tab>("monthly");
  const { user } = useAuth();
  const fetchProfiles = useGetGamificationProfilesService();
  const fetchMyProfile = useGetMyGamificationProfileService();

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

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-leaderboard"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const xpField = TAB_FIELD[tab];
  const profiles: GamificationProfile[] = (data ?? [])
    .slice()
    .sort(
      (a, b) => ((b[xpField] as number) ?? 0) - ((a[xpField] as number) ?? 0)
    );
  const top3 = profiles.slice(0, 3);
  const rest = profiles.slice(3);
  const myUsername = myProfile?.username;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-6 w-6 text-amber-400" />
          Ranking da Comunidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Os membros mais ativos do legado.dev
        </p>
      </div>

      {/* Animated tabs */}
      <div className="flex gap-0 border-b">
        {(Object.entries(TAB_LABELS) as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {tab === key && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SkeletonLeaderboard />
          </motion.div>
        ) : profiles.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={Trophy}
              title="O ranking ainda não tem dados"
              description="Seja o primeiro a contribuir!"
              action={{ label: "Ver atividades", href: "/activities" }}
            />
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Podium — aligned at base */}
            {top3.length > 0 && (
              <div className="flex items-end gap-3">
                {([2, 1, 3] as const).map((rank) => {
                  const profile = top3[rank - 1];
                  if (!profile) return null;
                  return (
                    <div key={rank} className="flex-1">
                      <PodiumCard
                        profile={profile}
                        rank={rank}
                        xpField={xpField}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest of table */}
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
                        Reconhecimento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rest.map((profile, i) => (
                      <TableRow
                        key={profile.id}
                        profile={profile}
                        position={i + 4}
                        xpField={xpField}
                        isMe={!!myUsername && profile.username === myUsername}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LeaderboardPageContent;
