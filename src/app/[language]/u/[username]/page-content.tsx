"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Flag,
  Medal,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "@/components/link";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { useCreateContributionReportService } from "@/services/api/services/notifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Banner presets ───────────────────────────────────────────────────────────
export const BANNER_PRESETS: Record<
  string,
  { className: string; label: string }
> = {
  default: { className: "bg-muted", label: "Padrão" },
  emerald: {
    className: "bg-gradient-to-r from-emerald-500 to-teal-600",
    label: "Esmeralda",
  },
  amber: {
    className: "bg-gradient-to-r from-amber-400 to-orange-500",
    label: "Âmbar",
  },
  purple: {
    className: "bg-gradient-to-r from-violet-600 to-purple-700",
    label: "Roxo",
  },
  blue: {
    className: "bg-gradient-to-r from-blue-500 to-sky-600",
    label: "Azul",
  },
  dark: {
    className: "bg-gradient-to-r from-slate-700 to-slate-900",
    label: "Escuro",
  },
  rose: {
    className: "bg-gradient-to-r from-rose-500 to-pink-600",
    label: "Rosa",
  },
};

// ─── Dot-grid cover pattern ───────────────────────────────────────────────────
function CoverPattern({ preset = "default" }: { preset?: string }) {
  const cfg = BANNER_PRESETS[preset] ?? BANNER_PRESETS.default;
  const isDotGrid = preset === "default";

  return (
    <div className={cn("relative h-36 w-full overflow-hidden", cfg.className)}>
      {isDotGrid && (
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
      )}
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

// ─── Level bar color (matches level.color text-* → bg-*) ─────────────────────
function levelBarColor(levelColor: string): string {
  return levelColor.replace("text-", "bg-");
}

function ReportModal({
  submissionId,
  open,
  onClose,
}: {
  submissionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const createReport = useCreateContributionReportService();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await createReport({ submissionId, reason: reason.trim() });
      if (res.status !== HTTP_CODES_ENUM.CREATED) {
        throw new Error(getApiError(res.data, "Erro ao enviar report."));
      }
    },
    onSuccess: () => {
      enqueueSnackbar("Report enviado. Nossa equipe vai analisar.", {
        variant: "success",
      });
      setReason("");
      onClose();
    },
    onError: (e: any) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            Reportar contribuição
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Descreva por que esta contribuição é inválida. Nossa equipe vai
          analisar e tomar as medidas necessárias.
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Motivo *</label>
            <span className="text-xs text-muted-foreground">
              {reason.length}/2000
            </span>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Ex: Esta contribuição não foi feita por esta pessoa. Tenho evidências de que foi realizada por outra conta..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1 gap-1.5"
            disabled={isPending || reason.trim().length < 10}
            onClick={() => mutate()}
          >
            <Flag className="h-3.5 w-3.5" />
            {isPending ? "Enviando..." : "Enviar report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const [reportingSubmissionId, setReportingSubmissionId] = useState<
    string | null
  >(null);
  const { user } = useAuth();

  const fetchByUsername = useGetGamificationProfileByUsernameService();
  const fetchApprovedSubmissions = useGetProfileApprovedSubmissionsService();
  const fetchProfiles = useGetGamificationProfilesService();
  const fetchActivities = useGetActivitiesService();
  const fetchProfileBadges = useGetProfileBadgesService();

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

  const { data: badgesData } = useQuery({
    queryKey: ["public-profile-badges", profile?.id],
    queryFn: async () => {
      const { status, data } = await fetchProfileBadges(profile!.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!profile?.id,
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
  ];

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

        {/* Badges / Conquistas */}
        {badgesData && badgesData.length > 0 && (
          <BadgesSection badges={badgesData} />
        )}

        {/* Token activity */}
        <TokenActivitySection profileId={profile.id} />

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
                        {user && (
                          <button
                            onClick={() => setReportingSubmissionId(sub.id)}
                            title="Reportar contribuição inválida"
                            className="text-muted-foreground/40 hover:text-destructive transition-colors"
                          >
                            <Flag className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {reportingSubmissionId && (
        <ReportModal
          submissionId={reportingSubmissionId}
          open={!!reportingSubmissionId}
          onClose={() => setReportingSubmissionId(null)}
        />
      )}
    </div>
  );
}

export default PublicProfilePageContent;
