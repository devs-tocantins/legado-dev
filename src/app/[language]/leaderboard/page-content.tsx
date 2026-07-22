"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetGamificationProfilesService,
  useGetMyGamificationProfileService,
} from "@/services/api/services/gamification-profiles";
import { useGetChampionSnapshotService } from "@/services/api/services/ranking-snapshots";
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
import { BANNER_PRESETS } from "@/app/[language]/u/[username]/page-content";

const DEFAULT_BANNER = "raiz-verde";

function bannerUrl(preset?: string): string {
  return (BANNER_PRESETS[preset ?? ""] ?? BANNER_PRESETS[DEFAULT_BANNER]).url;
}

// Pílula de nível — mesma paleta de cor usada em getLevel(), só que como chip.
const LEVEL_PILL: Record<string, string> = {
  Novato: "bg-slate-400/15 text-slate-400",
  Contribuidor: "bg-emerald-400/15 text-emerald-400",
  "Colaborador Ativo": "bg-sky-400/15 text-sky-400",
  Referência: "bg-blue-400/15 text-blue-400",
  Mentor: "bg-amber-400/15 text-amber-400",
  Lenda: "bg-rose-400/15 text-rose-400",
};

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

// Paleta por posição (design "8A — Ranking"): laranja/azul/verde, sombra
// sólida deslocada (mesma linguagem hard-shadow do resto do app). Os valores
// oklch são literais — funcionam iguais em claro/escuro; só a base do cartão
// (bg-card/border/foreground) segue o tema.
const RANK_STYLE = {
  1: {
    bright: "oklch(0.7 0.17 55)",
    ring: "oklch(0.85 0.09 62)",
    shadow: "oklch(0.72 0.15 55)",
    chipBg: "oklch(0.96 0.06 62)",
    chipText: "oklch(0.55 0.16 50)",
    order: "order-2",
    label: "1º lugar · líder do mês",
  },
  2: {
    bright: "oklch(0.6 0.14 245)",
    ring: "oklch(0.86 0.06 245)",
    shadow: "oklch(0.78 0.11 245)",
    chipBg: "oklch(0.96 0.04 245)",
    chipText: "oklch(0.5 0.13 245)",
    order: "order-1",
    label: "2º lugar",
  },
  3: {
    bright: "oklch(0.56 0.13 150)",
    ring: "oklch(0.85 0.07 150)",
    shadow: "oklch(0.75 0.12 150)",
    chipBg: "oklch(0.95 0.05 150)",
    chipText: "oklch(0.46 0.13 150)",
    order: "order-3",
    label: "3º lugar",
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
  const style = RANK_STYLE[rank];

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-[24px] border bg-card pb-5 text-center"
      style={{
        borderColor: style.ring,
        boxShadow: `0 ${rank === 1 ? 13 : 9}px 0 ${style.shadow}`,
      }}
    >
      {/* banner real do usuário */}
      <div className="relative aspect-[4/1] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl(profile.bannerPreset)}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-8"
          style={{
            background: "linear-gradient(180deg, transparent, var(--card))",
          }}
        />
        {rank === 1 && (
          <>
            <Sparkle
              className="absolute left-5 top-4 h-3.5 w-3.5 text-white/85"
              strokeWidth={1.5}
            />
            <Sparkle
              className="absolute right-6 top-7 h-3 w-3 text-white/85"
              strokeWidth={1.5}
            />
            <span className="absolute left-1/2 top-0.5 -translate-x-1/2 text-lg drop-shadow">
              👑
            </span>
          </>
        )}
      </div>

      {/* avatar squircle sobrepondo o banner */}
      <div className={cn("relative -mt-[38px] z-10", rank === 1 && "-mt-11")}>
        {profile.photo?.path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photo.path}
            alt={`@${profile.username}`}
            className={cn(
              "rounded-[22px] border-[5px] border-card object-cover",
              rank === 1 ? "h-[88px] w-[88px]" : "h-20 w-20"
            )}
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center rounded-[22px] border-[5px] border-card text-2xl font-bold text-white",
              rank === 1 ? "h-[88px] w-[88px]" : "h-20 w-20"
            )}
            style={{ background: style.bright }}
          >
            {profile.username.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <span className="mt-3.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
        {style.label}
      </span>
      <Link
        href={`/u/${profile.username}`}
        className="mt-1.5 text-base font-bold text-foreground hover:underline truncate max-w-[90%]"
      >
        @{profile.username}
      </Link>
      <span
        className={cn(
          "mt-2 rounded-full px-3 py-1 font-mono text-[11px] font-bold",
          LEVEL_PILL[level.name]
        )}
      >
        {level.name}
      </span>
      <span
        className="mx-5 mt-3.5 w-[calc(100%-2.5rem)] rounded-2xl py-2.5 font-mono text-lg font-extrabold"
        style={{ background: style.chipBg, color: style.chipText }}
      >
        {formatXp(xp)}
        <small className="ml-1 text-xs font-bold opacity-70">XP</small>
      </span>
      <span className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-500">
        <Coins className="h-3 w-3" />
        {profile.gratitudeTokensReceived} reconhecimentos
      </span>
    </div>
  );
}

function ChampionCard({
  title,
  champion,
  when,
  meta,
}: {
  title: string;
  champion: GamificationProfile;
  when: string;
  meta: string;
}) {
  const level = getLevel(champion.totalXp);

  return (
    <div className="relative overflow-hidden rounded-[20px] border bg-card">
      <div className="relative aspect-[4/1] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bannerUrl(champion.bannerPreset)}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-6"
          style={{
            background: "linear-gradient(180deg, transparent, var(--card))",
          }}
        />
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-wide text-amber-950 shadow-sm">
          🏆 {title}
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 pb-4 pt-5">
        {champion.photo?.path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={champion.photo.path}
            alt={`@${champion.username}`}
            className="h-12 w-12 shrink-0 rounded-2xl border-[3px] border-card object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[3px] border-card text-sm font-bold text-white"
            style={{ background: RANK_STYLE[1].bright }}
          >
            {champion.username.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/u/${champion.username}`}
            className="block truncate font-bold text-foreground hover:underline"
          >
            @{champion.username}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">{when}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                LEVEL_PILL[level.name]
              )}
            >
              {level.name}
            </span>
            <span className="font-mono text-[10px] font-bold text-muted-foreground">
              {meta}
            </span>
          </div>
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
        <div className="flex items-center gap-3">
          {profile.photo?.path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo.path}
              alt=""
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rounded-[10px] object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-muted text-[11px] font-bold text-muted-foreground">
              {profile.username.substring(0, 2).toUpperCase()}
            </div>
          )}
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
            <span className="text-xs text-primary font-normal">(você)</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 font-mono text-[11px] font-bold",
            LEVEL_PILL[level.name]
          )}
        >
          {level.name}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-semibold font-mono">
        {formatXp(xp)}
      </td>
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        <span className="flex items-center justify-end gap-1 text-amber-500 text-xs font-mono">
          <Coins className="h-3 w-3" />
          {profile.gratitudeTokensReceived}
        </span>
      </td>
    </tr>
  );
}

function formatPeriodKey(periodKey: string): string {
  if (!periodKey) return "";
  const [yearStr, monthStr] = periodKey.split("-");
  if (yearStr && monthStr) {
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    if (!isNaN(year) && !isNaN(month)) {
      const date = new Date(year, month - 1, 1);
      return date
        .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
        .replace(/^\w/, (c) => c.toUpperCase());
    }
  }
  return periodKey;
}

function LeaderboardPageContent() {
  const [tab, setTab] = useState<Tab>("monthly");
  const { user } = useAuth();
  const fetchProfiles = useGetGamificationProfilesService();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const fetchChampionSnapshot = useGetChampionSnapshotService();

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
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Mural de Campeões — campeões do período encerrado (mês/ano passado).
  const { data: monthlyChampionSnapshot } = useQuery({
    queryKey: ["ranking-champion", "monthly"],
    queryFn: async () => {
      const { status, data } = await fetchChampionSnapshot({
        type: "monthly",
      });
      if (status === HTTP_CODES_ENUM.OK) return data ?? null;
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: yearlyChampionSnapshot } = useQuery({
    queryKey: ["ranking-champion", "yearly"],
    queryFn: async () => {
      const { status, data } = await fetchChampionSnapshot({
        type: "annual",
      });
      if (status === HTTP_CODES_ENUM.OK) return data ?? null;
      return null;
    },
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
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-amber-400/90 text-xl">
              🏆
            </span>
            Ranking da Comunidade
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Os membros mais ativos do legado.dev
          </p>
        </div>

        {/* Abas em pílula */}
        <div className="flex gap-1 rounded-2xl bg-muted p-1">
          {(Object.entries(TAB_LABELS) as [Tab, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "relative px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                  tab === key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === key && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-xl bg-card shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            )
          )}
        </div>
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

            {/* Mural de Campeões */}
            {(monthlyChampionSnapshot?.profile ||
              yearlyChampionSnapshot?.profile) && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  🏛️ Mural de Campeões
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {monthlyChampionSnapshot?.profile && (
                    <ChampionCard
                      title="Campeão do mês"
                      champion={monthlyChampionSnapshot.profile}
                      when={formatPeriodKey(monthlyChampionSnapshot.periodKey)}
                      meta={`${formatXp(monthlyChampionSnapshot.xpAtSnapshot)} XP este mês`}
                    />
                  )}
                  {yearlyChampionSnapshot?.profile && (
                    <ChampionCard
                      title="Campeão do ano"
                      champion={yearlyChampionSnapshot.profile}
                      when={formatPeriodKey(yearlyChampionSnapshot.periodKey)}
                      meta={`${formatXp(yearlyChampionSnapshot.xpAtSnapshot)} XP este ano`}
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LeaderboardPageContent;
