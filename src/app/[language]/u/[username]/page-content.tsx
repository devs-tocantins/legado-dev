"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  useGetGamificationProfileByUsernameService,
  useGetProfileApprovedSubmissionsService,
  useGetGamificationProfilesService,
} from "@/services/api/services/gamification-profiles";
import { useGetProfileTokenTransactionsService } from "@/services/api/services/transactions";
import {
  Transaction,
  TransactionCategoryEnum,
} from "@/services/api/types/transaction";
import {
  useGetProfileBadgesService,
  BadgeCategoryEnum,
  GamificationProfileBadge,
} from "@/services/api/services/badges";
import {
  useGetLearningTracksService,
  useGetLearningTrackOverviewService,
  useGetProofPortfolioService,
} from "@/services/api/services/learning-tracks";
import {
  LearningTrackOverview,
  LearningTrackStatus,
} from "@/services/api/types/learning-track";
import { ProfileHistoryTimeline } from "@/components/profile-history-timeline";
import { getTrackColor } from "@/lib/track-colors";
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
  Medal,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "@/components/link";

// ─── Banner presets ───────────────────────────────────────────────────────────
// Banners temáticos (TI + cores do Tocantins + identidade legado.dev),
// gerados como SVG e hospedados no R2. "raiz-verde" é o padrão.
const BANNER_BASE =
  "https://pub-902e55385b5f4a268555827946cd271d.r2.dev/banners";

export const BANNER_PRESETS: Record<string, { url: string; label: string }> = {
  "raiz-verde": { url: `${BANNER_BASE}/raiz-verde.svg`, label: "Raiz Verde" },
  "raiz-dourada": {
    url: `${BANNER_BASE}/raiz-dourada.svg`,
    label: "Raiz Dourada",
  },
  "raiz-azul": { url: `${BANNER_BASE}/raiz-azul.svg`, label: "Raiz Azul" },
  "raiz-clara": { url: `${BANNER_BASE}/raiz-clara.svg`, label: "Raiz Clara" },
  "terminal-verde": {
    url: `${BANNER_BASE}/terminal-verde.svg`,
    label: "Terminal Verde",
  },
  "terminal-ambar": {
    url: `${BANNER_BASE}/terminal-ambar.svg`,
    label: "Terminal Âmbar",
  },
  "terminal-azul": {
    url: `${BANNER_BASE}/terminal-azul.svg`,
    label: "Terminal Azul",
  },
  "commits-tricolor": {
    url: `${BANNER_BASE}/commits-tricolor.svg`,
    label: "Commits Tricolor",
  },
  "commits-noturno": {
    url: `${BANNER_BASE}/commits-noturno.svg`,
    label: "Commits Noturno",
  },
  "commits-claro": {
    url: `${BANNER_BASE}/commits-claro.svg`,
    label: "Commits Claro",
  },
  "hex-cerrado": {
    url: `${BANNER_BASE}/hex-cerrado.svg`,
    label: "Chip Cerrado",
  },
  "hex-dourado": {
    url: `${BANNER_BASE}/hex-dourado.svg`,
    label: "Chip Dourado",
  },
  "hex-profundo": {
    url: `${BANNER_BASE}/hex-profundo.svg`,
    label: "Chip Profundo",
  },
  "rio-agua": { url: `${BANNER_BASE}/rio-agua.svg`, label: "Rio Digital" },
  "rio-dourado": {
    url: `${BANNER_BASE}/rio-dourado.svg`,
    label: "Rio Dourado",
  },
  "rio-noturno": {
    url: `${BANNER_BASE}/rio-noturno.svg`,
    label: "Rio Noturno",
  },
  "cerrado-noite": {
    url: `${BANNER_BASE}/cerrado-noite.svg`,
    label: "Céu do Cerrado",
  },
  "cerrado-amanhecer": {
    url: `${BANNER_BASE}/cerrado-amanhecer.svg`,
    label: "Amanhecer Dourado",
  },
  "cerrado-dia": {
    url: `${BANNER_BASE}/cerrado-dia.svg`,
    label: "Cerrado Azul",
  },
  "binario-verde": {
    url: `${BANNER_BASE}/binario-verde.svg`,
    label: "Binário Verde",
  },
  "binario-dourado": {
    url: `${BANNER_BASE}/binario-dourado.svg`,
    label: "Binário Dourado",
  },
  "bandeira-dia": {
    url: `${BANNER_BASE}/bandeira-dia.svg`,
    label: "Bandeira Dia",
  },
  "bandeira-noite": {
    url: `${BANNER_BASE}/bandeira-noite.svg`,
    label: "Bandeira Noite",
  },
  // Jogos
  "jogo-tetris": { url: `${BANNER_BASE}/jogo-tetris.svg`, label: "Tetris" },
  "jogo-labirinto": {
    url: `${BANNER_BASE}/jogo-labirinto.svg`,
    label: "Labirinto",
  },
  "jogo-invasores": {
    url: `${BANNER_BASE}/jogo-invasores.svg`,
    label: "Invasores",
  },
  "jogo-cobrinha": {
    url: `${BANNER_BASE}/jogo-cobrinha.svg`,
    label: "Cobrinha",
  },
  "jogo-xadrez": { url: `${BANNER_BASE}/jogo-xadrez.svg`, label: "Xadrez" },
  "jogo-pong": { url: `${BANNER_BASE}/jogo-pong.svg`, label: "Pong" },
  "jogo-voxel": {
    url: `${BANNER_BASE}/jogo-voxel.svg`,
    label: "Mundo de Blocos",
  },
  "jogo-plataforma": {
    url: `${BANNER_BASE}/jogo-plataforma.svg`,
    label: "Plataforma 8-bit",
  },
  "jogo-ritmo": { url: `${BANNER_BASE}/jogo-ritmo.svg`, label: "Ritmo" },
  "jogo-fliperama": {
    url: `${BANNER_BASE}/jogo-fliperama.svg`,
    label: "Fliperama",
  },
  // Linguagens e tecnologias
  "tech-java": { url: `${BANNER_BASE}/tech-java.svg`, label: "Java" },
  "tech-python": { url: `${BANNER_BASE}/tech-python.svg`, label: "Python" },
  "tech-rust": { url: `${BANNER_BASE}/tech-rust.svg`, label: "Rust" },
  "tech-javascript": {
    url: `${BANNER_BASE}/tech-javascript.svg`,
    label: "JavaScript",
  },
  "tech-go": { url: `${BANNER_BASE}/tech-go.svg`, label: "Go" },
  "tech-cpp": { url: `${BANNER_BASE}/tech-cpp.svg`, label: "C++" },
  "tech-csharp": { url: `${BANNER_BASE}/tech-csharp.svg`, label: "C#" },
  "tech-php": { url: `${BANNER_BASE}/tech-php.svg`, label: "PHP" },
  "tech-ruby": { url: `${BANNER_BASE}/tech-ruby.svg`, label: "Ruby" },
  "tech-typescript": {
    url: `${BANNER_BASE}/tech-typescript.svg`,
    label: "TypeScript",
  },
};

const DEFAULT_BANNER = "raiz-verde";

// ─── Banner de capa (imagem temática) ─────────────────────────────────────────
function CoverPattern({ preset = DEFAULT_BANNER }: { preset?: string }) {
  const cfg = BANNER_PRESETS[preset] ?? BANNER_PRESETS[DEFAULT_BANNER];

  return (
    <div className="relative aspect-[4/1] w-full overflow-hidden bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cfg.url}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
      />
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
  photoPath,
  size = 64,
}: {
  username: string;
  photoPath?: string | null;
  size?: number;
}) {
  const color = avatarColor(username);
  const initials = username.substring(0, 2).toUpperCase();

  if (photoPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoPath}
        alt={`@${username}`}
        className="shrink-0 rounded-full border-4 border-background object-cover relative z-10"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-4 border-background font-bold font-heading text-white relative z-10",
        color
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.3) }}
    >
      {initials}
    </div>
  );
}

// ─── Level bar color (matches level name → bg-* literal class) ────────────────
const LEVEL_BAR_COLOR: Record<string, string> = {
  Novato: "bg-slate-400",
  Contribuidor: "bg-emerald-400",
  "Colaborador Ativo": "bg-sky-400",
  Referência: "bg-blue-400",
  Mentor: "bg-amber-400",
  Lenda: "bg-rose-400",
};

// ─── Selos de trilha (conquistado / em progresso / bloqueado) ─────────────────

type SealState = "conquistado" | "em-progresso" | "bloqueado";

type TrilhaSeal = {
  sectionId: string;
  sectionTitle: string;
  trackId: string;
  trackTitle: string;
  state: SealState;
};

function useTrilhaSeals(
  ownedBadgeIds: Set<string>,
  activeTrackIds: Set<string>
): TrilhaSeal[] {
  const fetchTracks = useGetLearningTracksService();
  const fetchOverview = useGetLearningTrackOverviewService();

  const { data: tracks } = useQuery({
    queryKey: ["public-profile-tracks"],
    queryFn: async () => {
      const { status, data } = await fetchTracks({ page: 1, limit: 50 });
      if (status === HTTP_CODES_ENUM.OK)
        return data.data.filter(
          (t) => t.status === LearningTrackStatus.PUBLISHED
        );
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const overviewQueries = useQueries({
    queries: (tracks ?? []).map((track) => ({
      queryKey: ["learning-track-overview", track.id],
      queryFn: async () => {
        const { status, data } = await fetchOverview({ id: track.id });
        if (status === HTTP_CODES_ENUM.OK) return data as LearningTrackOverview;
        return null;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const seals: TrilhaSeal[] = [];
    for (const query of overviewQueries) {
      const overview = query.data;
      if (!overview) continue;
      for (const { section } of overview.sections) {
        if (!section.badgeId) continue;
        const state: SealState = ownedBadgeIds.has(section.badgeId)
          ? "conquistado"
          : activeTrackIds.has(overview.track.id)
            ? "em-progresso"
            : "bloqueado";
        seals.push({
          sectionId: section.id,
          sectionTitle: section.title,
          trackId: overview.track.id,
          trackTitle: overview.track.title,
          state,
        });
      }
    }
    return seals;
  }, [overviewQueries, ownedBadgeIds, activeTrackIds]);
}

const SEAL_STATE_LABEL: Record<SealState, string> = {
  conquistado: "Conquistado",
  "em-progresso": "Em progresso",
  bloqueado: "Bloqueado",
};

function TrilhaSealsRow({ seals }: { seals: TrilhaSeal[] }) {
  if (seals.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Selos de trilha
      </h2>
      <div className="flex flex-wrap gap-3">
        {seals.map((seal) => {
          const color = getTrackColor(seal.trackId);
          const locked = seal.state === "bloqueado";
          const inProgress = seal.state === "em-progresso";
          return (
            <div
              key={seal.sectionId}
              className="group relative flex flex-col items-center gap-1.5 text-center w-16"
            >
              <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block w-48">
                <div className="rounded-md bg-popover border border-border shadow-md px-3 py-2 text-left">
                  <p className="text-xs font-semibold leading-tight mb-0.5">
                    {seal.sectionTitle}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {seal.trackTitle} · {SEAL_STATE_LABEL[seal.state]}
                  </p>
                </div>
                <div className="mx-auto w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
              </div>

              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border",
                  locked
                    ? "bg-muted border-border"
                    : "border-transparent text-white"
                )}
                style={!locked ? { background: color.bg } : undefined}
              >
                {locked ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ShieldCheck
                    className={cn("h-5 w-5", inProgress && "opacity-60")}
                  />
                )}
              </div>
              <p className="text-xs leading-tight text-muted-foreground line-clamp-2">
                {seal.sectionTitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CATEGORY_ORDER: BadgeCategoryEnum[] = [
  "MILESTONE",
  "RANKING",
  "PARTICIPATION",
  "SPECIAL",
];
const CATEGORY_LABEL: Record<BadgeCategoryEnum, string> = {
  MILESTONE: "Marcos",
  RANKING: "Ranking",
  PARTICIPATION: "Participação",
  SPECIAL: "Especiais",
};

function BadgeItem({ pb }: { pb: GamificationProfileBadge }) {
  const badge = pb.badge;
  return (
    <div className="group relative flex flex-col items-center gap-1.5 text-center w-16">
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block w-48">
        <div className="rounded-md bg-popover border border-border shadow-md px-3 py-2 text-left">
          <p className="text-xs font-semibold leading-tight mb-0.5">
            {badge.name}
          </p>
          {badge.description && (
            <p className="text-xs text-muted-foreground leading-snug">
              {badge.description}
            </p>
          )}
        </div>
        <div className="mx-auto w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
      </div>

      {badge.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={badge.imageUrl}
          alt={badge.name}
          className="h-12 w-12 rounded-full object-cover border border-border"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted border border-border">
          <Medal className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <p className="text-xs leading-tight text-muted-foreground line-clamp-2">
        {badge.name}
      </p>
    </div>
  );
}

function BadgesSection({ badges }: { badges: GamificationProfileBadge[] }) {
  const grouped = CATEGORY_ORDER.reduce<
    Record<string, GamificationProfileBadge[]>
  >((acc, cat) => {
    const items = badges.filter((pb) => pb.badge?.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  if (!Object.keys(grouped).length) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Conquistas
      </h2>
      <div className="space-y-4">
        {(Object.keys(grouped) as BadgeCategoryEnum[]).map((cat) => (
          <div key={cat}>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {CATEGORY_LABEL[cat]}
            </p>
            <div className="flex flex-wrap gap-3">
              {grouped[cat].map((pb) => (
                <BadgeItem key={pb.id} pb={pb} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenActivityRow({ tx }: { tx: Transaction }) {
  const isSent = tx.category === TransactionCategoryEnum.TOKEN_TRANSFER;
  const Icon = isSent ? ArrowUpRight : ArrowDownLeft;
  const label = isSent ? "Reconhecimento enviado" : "Reconhecimento recebido";
  const amountCls = isSent ? "text-muted-foreground" : "text-amber-500";
  const sign = isSent ? "" : "+";
  const iconBg = isSent ? "bg-muted" : "bg-amber-500/10";
  const iconCls = isSent ? "text-muted-foreground" : "text-amber-500";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          iconBg
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconCls)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {tx.description && (
          <p className="text-xs text-muted-foreground truncate">
            {tx.description}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right space-y-0.5">
        <p
          className={cn(
            "text-sm font-semibold font-mono tabular-nums",
            amountCls
          )}
        >
          {sign}
          {tx.amount} Pts
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>
    </div>
  );
}

function TokenActivitySection({ profileId }: { profileId: string }) {
  const fetchTokenTxs = useGetProfileTokenTransactionsService();

  const { data, isLoading } = useQuery({
    queryKey: ["profile-token-txs", profileId],
    queryFn: async () => {
      const { status, data } = await fetchTokenTxs({
        profileId,
        page: 1,
        limit: 10,
      });
      if (status === 200) return data.data as Transaction[];
      return [] as Transaction[];
    },
    enabled: !!profileId,
    staleTime: 60_000,
  });

  const txs = data ?? [];

  if (!isLoading && txs.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">
        Tokens de Gratidão
      </h2>
      {isLoading ? (
        <div className="rounded-lg border bg-card divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse px-4 py-3 flex items-center gap-3"
            >
              <div className="h-8 w-8 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted rounded w-36" />
                <div className="h-3 bg-muted rounded w-52" />
              </div>
              <div className="h-4 bg-muted rounded w-12" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {txs.map((tx) => (
            <TokenActivityRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

function PublicProfilePageContent() {
  const params = useParams<{ username: string }>();
  const username = params?.username ?? "";
  const [copied, setCopied] = useState(false);

  const fetchByUsername = useGetGamificationProfileByUsernameService();
  const fetchApprovedSubmissions = useGetProfileApprovedSubmissionsService();
  const fetchProfiles = useGetGamificationProfilesService();
  const fetchProfileBadges = useGetProfileBadgesService();
  const fetchProofPortfolio = useGetProofPortfolioService();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      const { status, data } = await fetchByUsername(username);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!username,
  });

  const { data: submissionsData } = useQuery({
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

  const { data: badgesData } = useQuery({
    queryKey: ["public-profile-badges", profile?.id],
    queryFn: async () => {
      const { status, data } = await fetchProfileBadges(profile!.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!profile?.id,
  });

  const { data: proofPortfolio } = useQuery({
    queryKey: ["public-profile-portfolio", profile?.id],
    queryFn: async () => {
      const { status, data } = await fetchProofPortfolio(profile!.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!profile?.id,
  });
  const portfolio = useMemo(() => proofPortfolio ?? [], [proofPortfolio]);

  const ownedBadgeIds = useMemo(
    () => new Set((badgesData ?? []).map((pb) => pb.badgeId)),
    [badgesData]
  );
  const activeTrackIds = useMemo(
    () => new Set(portfolio.map((p) => p.trackId)),
    [portfolio]
  );
  const trilhaSeals = useTrilhaSeals(ownedBadgeIds, activeTrackIds);

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
        <CoverPattern preset={profile.bannerPreset} />
        <div className="px-4 md:px-6">
          <div className="-mt-4 mb-3">
            <div
              className="shrink-0 rounded-full border-4 border-background bg-muted"
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

  const stats: Array<{
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
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
    {
      label: "Provas concluídas",
      value: portfolio.length,
      icon: ShieldCheck,
    },
  ];

  const fullName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const shouldShowFullName = profile.showFullName === true && Boolean(fullName);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Cover */}
      <CoverPattern preset={profile.bannerPreset} />

      {/* Avatar + header */}
      <div className="px-4 md:px-6">
        {/* Avatar overlapping cover */}
        <div className="-mt-4 mb-3">
          <ProfileAvatar
            username={profile.username}
            photoPath={profile.photo?.path}
            size={72}
          />
        </div>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-1">
            {shouldShowFullName ? (
              <>
                <h1 className="text-xl font-bold tracking-tight">{fullName}</h1>
                <p className="font-mono text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              </>
            ) : (
              <h1 className="text-xl font-bold font-mono leading-tight">
                @{profile.username}
              </h1>
            )}
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
              className={cn("h-full rounded-full", LEVEL_BAR_COLOR[level.name])}
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

        {/* Selos de trilha */}
        <TrilhaSealsRow seals={trilhaSeals} />

        {/* Badges / Conquistas */}
        {badgesData && badgesData.length > 0 && (
          <BadgesSection badges={badgesData} />
        )}

        {/* Token activity */}
        <TokenActivitySection profileId={profile.id} />

        {/* Histórico timeline */}
        <ProfileHistoryTimeline profileId={profile.id} className="mb-8" />
      </div>
    </div>
  );
}

export default PublicProfilePageContent;
