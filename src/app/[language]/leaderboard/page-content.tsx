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
import { Trophy, Coins, Sparkle } from "lucide-react";
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

// Cerimônia de pódio: medalha com brilho + faixa/estandarte + louros + base 3D.
// Tudo em CSS/SVG (nenhuma imagem), palette oklch por posição.
const RANK_STYLE = {
  1: {
    hue: 87,
    bright: "oklch(0.8 0.16 87)",
    glow: "oklch(0.8 0.16 87 / 0.55)",
    ring: "oklch(0.88 0.1 87)",
    bannerTop: "oklch(0.34 0.07 85)",
    bannerBottom: "oklch(0.15 0.03 85)",
    riserTop: "oklch(0.62 0.15 85)",
    riserBottom: "oklch(0.4 0.12 83)",
    riserHeight: 92,
    scale: 1,
    order: "order-2",
  },
  2: {
    hue: 235,
    bright: "oklch(0.82 0.02 235)",
    glow: "oklch(0.82 0.02 235 / 0.45)",
    ring: "oklch(0.88 0.012 235)",
    bannerTop: "oklch(0.32 0.015 235)",
    bannerBottom: "oklch(0.15 0.01 235)",
    riserTop: "oklch(0.68 0.02 235)",
    riserBottom: "oklch(0.46 0.015 235)",
    riserHeight: 68,
    scale: 0.88,
    order: "order-1",
  },
  3: {
    hue: 45,
    bright: "oklch(0.68 0.13 45)",
    glow: "oklch(0.68 0.13 45 / 0.45)",
    ring: "oklch(0.8 0.09 45)",
    bannerTop: "oklch(0.32 0.06 45)",
    bannerBottom: "oklch(0.15 0.03 45)",
    riserTop: "oklch(0.55 0.13 45)",
    riserBottom: "oklch(0.36 0.1 43)",
    riserHeight: 56,
    scale: 0.82,
    order: "order-3",
  },
} as const;

function LaurelBranch({
  color,
  mirror,
  scale,
}: {
  color: string;
  mirror?: boolean;
  scale: number;
}) {
  return (
    <svg
      width={30 * scale}
      height={128 * scale}
      viewBox="0 0 30 128"
      className={cn("shrink-0", mirror && "-scale-x-100")}
      style={{ color }}
    >
      <path
        d="M3 4 C 3 44, 3 84, 3 124"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.55"
      />
      {[10, 34, 58, 82, 104].map((y, i) => (
        <g key={y} transform={`translate(3 ${y}) rotate(${-58 + i * 6})`}>
          <path d="M0 0 Q 13 -5 26 1 Q 13 7 0 0 Z" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

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
  const style = RANK_STYLE[rank];

  return (
    <div className="flex flex-col items-center">
      {/* brilho ambiente + medalha */}
      <div className="relative flex items-center justify-center h-16">
        <div
          className="absolute h-20 w-20 rounded-full blur-xl"
          style={{ background: style.glow }}
        />
        {rank === 1 && (
          <>
            <Sparkle
              className="absolute -left-9 -top-1 h-4 w-4 rotate-[-12deg]"
              style={{ color: style.bright }}
            />
            <Sparkle
              className="absolute -right-8 top-2 h-3 w-3 rotate-[18deg]"
              style={{ color: style.bright }}
            />
          </>
        )}
        <div
          className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-[3px] font-mono text-xl font-black text-background"
          style={{
            background: style.bright,
            borderColor: style.ring,
            boxShadow: `0 0 18px ${style.glow}`,
          }}
        >
          {rank}
        </div>
      </div>

      {/* estandarte + louros */}
      <div className="flex items-start -mt-1">
        <LaurelBranch color={style.bright} scale={style.scale} />
        <div
          className="relative flex w-[132px] flex-col items-center gap-1 px-3 pb-6 pt-6 text-center"
          style={{
            background: `linear-gradient(180deg, ${style.bannerTop}, ${style.bannerBottom})`,
            clipPath: "polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%)",
            border: `1px solid ${style.glow}`,
          }}
        >
          <div className="relative -mt-2 mb-1">
            {profile.photo?.path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo.path}
                alt={`@${profile.username}`}
                className="h-12 w-12 rounded-full border-2 object-cover"
                style={{ borderColor: style.bright }}
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background text-xs font-extrabold text-foreground"
                style={{ borderColor: style.bright }}
              >
                {profile.username.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <Link
            href={`/u/${profile.username}`}
            className="font-bold text-xs text-white truncate max-w-full hover:underline"
          >
            @{profile.username}
          </Link>
          <span className={cn("text-[10px] font-semibold", level.color)}>
            {level.name}
          </span>
          <span
            className="mt-0.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-xs font-extrabold text-white"
            style={{
              borderColor: style.bright,
              background: "rgba(0,0,0,0.25)",
            }}
          >
            {formatXp(xp)} XP
          </span>
        </div>
        <LaurelBranch color={style.bright} mirror scale={style.scale} />
      </div>

      {/* base do pódio */}
      <div
        className="relative w-[110px] rounded-b-md"
        style={{ height: style.riserHeight }}
      >
        <div
          className="absolute inset-x-0 top-0 h-3 rounded-[50%]"
          style={{ background: style.riserTop }}
        />
        <div
          className="absolute inset-x-0 top-1.5 bottom-0 flex items-start justify-center overflow-hidden rounded-b-md pt-1"
          style={{
            background: `linear-gradient(180deg, ${style.riserTop}, ${style.riserBottom})`,
          }}
        >
          <span className="font-mono text-4xl font-black text-black/15">
            {rank}
          </span>
        </div>
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
                    <div
                      key={rank}
                      className={cn("flex-1", RANK_STYLE[rank].order)}
                    >
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
