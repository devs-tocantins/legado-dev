"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import useAuth from "@/services/auth/use-auth";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import SpotlightTour from "@/components/tour/spotlight-tour";
import { useQuery } from "@tanstack/react-query";
import {
  useGetMyGamificationProfileService,
  useGetGamificationProfilesService,
  useTransferTokensService,
} from "@/services/api/services/gamification-profiles";
import { useGetMySubmissionsService } from "@/services/api/services/submissions";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { useGetProfileBadgesService } from "@/services/api/services/badges";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { SubmissionStatusEnum } from "@/services/api/types/submission";
import {
  getLevel,
  getLevelProgress,
  getNextLevelXp,
  formatXp,
} from "@/lib/gamification";
import { getTrackColor } from "@/lib/track-colors";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "@/components/link";
import {
  Mail,
  Pencil,
  Zap,
  Coins,
  ExternalLink,
  CalendarDays,
  TrendingUp,
  Send,
  ClipboardList,
  BookOpen,
  Trophy,
  ArrowRight,
  Receipt,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  X,
  Loader2,
  Medal,
} from "lucide-react";
import { cn, getApiError } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import { BANNER_PRESETS } from "@/app/[language]/u/[username]/page-content";

// ─── Cartão hard-shadow (mesma linguagem visual da Trilhas) ────────────────

function HardShadowSection({
  className,
  refProp,
  children,
}: {
  className?: string;
  refProp?: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  return (
    <section
      ref={refProp}
      className={cn(
        "overflow-hidden rounded-[20px] border border-border bg-card text-card-foreground shadow-[0_5px_0_var(--card-shadow)]",
        className
      )}
      style={{ "--card-shadow": "var(--border)" } as React.CSSProperties}
    >
      {children}
    </section>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-[18px] border border-border bg-card p-4 shadow-[0_4px_0_var(--card-shadow)]"
      style={{ "--card-shadow": "var(--border)" } as React.CSSProperties}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-lg font-bold leading-none">{value}</p>
        <p className="mt-1.5 truncate font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: SubmissionStatusEnum }) {
  if (status === SubmissionStatusEnum.APPROVED)
    return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === SubmissionStatusEnum.REJECTED)
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
}

function StatusPill({ status }: { status: SubmissionStatusEnum }) {
  const style =
    status === SubmissionStatusEnum.APPROVED
      ? "bg-accent/15 text-accent"
      : status === SubmissionStatusEnum.REJECTED
        ? "bg-destructive/10 text-destructive"
        : "bg-amber-500/10 text-amber-600";
  const label =
    status === SubmissionStatusEnum.APPROVED
      ? "Aprovado"
      : status === SubmissionStatusEnum.REJECTED
        ? "Rejeitado"
        : "Pendente";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-mono text-[10px] font-bold",
        style
      )}
    >
      {label}
    </span>
  );
}

function Profile() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const fetchMySubmissions = useGetMySubmissionsService();
  const fetchActivities = useGetActivitiesService();
  const transferTokens = useTransferTokensService();
  const fetchProfiles = useGetGamificationProfilesService();
  const fetchProfileBadges = useGetProfileBadgesService();
  const searchParams = useSearchParams();
  const router = useRouter();

  const statsRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (searchParams.get("tour") === "1") {
      const timer = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleTourFinish = () => {
    setShowTour(false);
    router.replace("/profile");
  };

  const [tokenDialog, setTokenDialog] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [tokenMessage, setTokenMessage] = useState("");
  const [transferring, setTransferring] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(recipientSearch), 300);
    return () => clearTimeout(t);
  }, [recipientSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["profile-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const { status, data } = await fetchProfiles({
        page: 1,
        limit: 8,
        search: debouncedSearch,
      });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    enabled: debouncedSearch.trim().length > 0,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["my-submissions-recent"],
    queryFn: async () => {
      const { status, data } = await fetchMySubmissions({ page: 1, limit: 5 });
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

  const { data: myBadges } = useQuery({
    queryKey: ["my-badges", profile?.id],
    queryFn: async () => {
      const { status, data } = await fetchProfileBadges(profile!.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!profile?.id,
  });

  const activityMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of activitiesData ?? []) {
      map.set(a.id, a.title);
    }
    return map;
  }, [activitiesData]);

  const totalXp = profile?.totalXp ?? 0;
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const nextLevelXp = getNextLevelXp(totalXp);
  const xpToNext = Math.max(0, nextLevelXp - totalXp);
  const isMaxLevel = level.maxXp === Infinity;
  const recentSubmissions = submissionsData ?? [];
  const banner =
    BANNER_PRESETS[profile?.bannerPreset ?? "raiz-verde"] ??
    BANNER_PRESETS["raiz-verde"];

  const handleTransfer = async () => {
    if (!recipientId.trim() || tokenAmount < 1) return;
    setTransferring(true);
    try {
      const { status, data } = await transferTokens({
        recipientProfileId: recipientId.trim(),
        amount: tokenAmount,
        message: tokenMessage.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.CREATED || status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Token enviado com sucesso!", { variant: "success" });
        setTokenDialog(false);
        setRecipientId("");
        setRecipientLabel("");
        setRecipientSearch("");
        setTokenAmount(1);
        setTokenMessage("");
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao enviar token."), {
          variant: "error",
        });
      }
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      {/* Identidade */}
      <HardShadowSection className="rounded-[24px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.url}
          alt=""
          aria-hidden="true"
          className="h-28 w-full object-cover"
        />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <Avatar className="h-20 w-20 shrink-0 border-4 border-card shadow-sm">
              <AvatarImage
                src={user?.photo?.path}
                alt={`${user?.firstName} ${user?.lastName}`}
              />
              <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-wrap justify-end gap-2 pb-1">
              {profile?.username && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-xl font-bold"
                  render={<Link href={`/u/${profile.username}`} />}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Perfil público
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 rounded-xl font-bold"
                data-testid="edit-profile"
                render={<Link href="/profile/edit" />}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar perfil
              </Button>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="text-xl font-bold tracking-tight"
                data-testid="user-name"
              >
                {user?.firstName} {user?.lastName}
              </h1>
              <Badge variant="secondary">{user?.role?.name ?? "Membro"}</Badge>
            </div>
            {profile?.username && (
              <p className="font-mono text-sm text-muted-foreground">
                @{profile.username}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span data-testid="user-email" className="truncate">
                {user?.email}
              </span>
            </p>
          </div>
        </div>
      </HardShadowSection>

      {/* Stats */}
      {!profileLoading && profile && (
        <div ref={statsRef} className="grid gap-3 grid-cols-2">
          <StatTile
            icon={<Zap className="h-4 w-4 shrink-0 text-blue-500" />}
            value={formatXp(profile.totalXp)}
            label="XP Total"
          />
          <StatTile
            icon={<CalendarDays className="h-4 w-4 shrink-0 text-sky-500" />}
            value={formatXp(profile.currentMonthlyXp ?? 0)}
            label="XP Mensal"
          />
          <StatTile
            icon={<TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />}
            value={formatXp(profile.currentYearlyXp ?? 0)}
            label="XP Anual"
          />
          <StatTile
            icon={<Coins className="h-4 w-4 shrink-0 text-amber-500" />}
            value={profile.gratitudeTokens}
            label="Pts. Reconhecimento"
          />
        </div>
      )}

      {/* Progressão de nível */}
      {!profileLoading && profile && (
        <HardShadowSection refProp={levelRef} className="space-y-3 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Nível atual
              </p>
              <p className={cn("text-lg font-bold", level.color)}>
                {level.name}
              </p>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              {isMaxLevel
                ? "Nível máximo alcançado"
                : `Faltam ${formatXp(xpToNext)} XP para o próximo nível`}
            </p>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{formatXp(level.minXp)} XP</span>
            <span>{progress}%</span>
            <span>{isMaxLevel ? "∞" : `${formatXp(level.maxXp + 1)} XP`}</span>
          </div>
        </HardShadowSection>
      )}

      {/* Submissões Recentes */}
      <HardShadowSection>
        <div className="flex flex-row items-center justify-between px-5 pt-4 pb-1">
          <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Submissões Recentes
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 rounded-lg text-xs font-bold"
            render={<Link href="/submissions" />}
          >
            Ver todas
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        <div className="p-3 pt-2">
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma submissão ainda.
            </p>
          ) : (
            <div className="space-y-1.5">
              {recentSubmissions.map((sub) => {
                const color = getTrackColor(sub.activityId);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 rounded-2xl bg-muted/40 py-2.5 px-3"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: color.bg }}
                    >
                      <StatusIcon status={sub.status} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {activityMap.get(sub.activityId) ?? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {sub.activityId.substring(0, 8)}…
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sub.status === SubmissionStatusEnum.APPROVED && (
                        <span className="font-mono text-xs font-bold text-accent">
                          +{sub.awardedXp}
                        </span>
                      )}
                      <StatusPill status={sub.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </HardShadowSection>

      {/* Conquistas */}
      {myBadges && myBadges.length > 0 && (
        <HardShadowSection className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Conquistas
            </p>
            {profile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 rounded-lg px-2 text-xs font-bold"
                render={<Link href={`/u/${profile.username}`} />}
              >
                Ver perfil público
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {myBadges.map((pb) => (
              <div
                key={pb.id}
                className="flex flex-col items-center gap-1 text-center w-14"
                title={pb.badge?.name}
              >
                {pb.badge?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pb.badge.imageUrl}
                    alt={pb.badge.name}
                    className="h-10 w-10 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border">
                    <Medal className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <p className="text-xs leading-tight text-muted-foreground line-clamp-2">
                  {pb.badge?.name}
                </p>
              </div>
            ))}
          </div>
        </HardShadowSection>
      )}

      {/* Ações rápidas */}
      <div ref={actionsRef}>
        <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Ações Rápidas
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            render={<Link href="/submissions/new" />}
            className="gap-2 rounded-xl font-bold shadow-[0_3px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.2)]"
          >
            <ClipboardList className="h-4 w-4" />
            Submeter Atividade
          </Button>
          <Button
            variant="outline"
            render={<Link href="/voluntariado" />}
            className="gap-2 rounded-xl font-bold"
          >
            <BookOpen className="h-4 w-4" />
            Ver Atividades
          </Button>
          <Button
            variant="outline"
            render={<Link href="/leaderboard" />}
            className="gap-2 rounded-xl font-bold"
          >
            <Trophy className="h-4 w-4" />
            Ver Ranking
          </Button>
          <Button
            variant="outline"
            render={<Link href="/transactions" />}
            className="gap-2 rounded-xl font-bold"
          >
            <Receipt className="h-4 w-4" />
            Histórico de Tokens
          </Button>
          <Button
            variant="outline"
            render={<Link href="/secret" />}
            className="gap-2 rounded-xl font-bold"
          >
            <KeyRound className="h-4 w-4" />
            Resgatar Código
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-xl font-bold"
            onClick={() => setTokenDialog(true)}
          >
            <Send className="h-4 w-4" />
            Reconhecer alguém
          </Button>
          <Button
            variant="ghost"
            render={<Link href="/rules" />}
            className="gap-2 rounded-xl font-bold text-primary"
          >
            <BookOpen className="h-4 w-4" />
            Nossas Regras
          </Button>
        </div>
      </div>

      {showTour && (
        <SpotlightTour
          steps={[
            {
              ref: statsRef,
              title: "Seu XP e Reconhecimento",
              description:
                "Aqui você acompanha seu XP total, mensal e anual — e seus Pontos de Reconhecimento para enviar a outros devs.",
            },
            {
              ref: levelRef,
              title: "Nível e Perfil Público",
              description:
                "Seu nível sobe conforme você acumula XP. O link do perfil público, no topo, fica disponível para toda a comunidade.",
            },
            {
              ref: actionsRef,
              title: "Ações Rápidas",
              description:
                "Submeta atividades, veja o ranking, resgate códigos secretos e envie reconhecimento para quem te ajudou.",
            },
          ]}
          onFinish={handleTourFinish}
        />
      )}

      {/* Token transfer dialog */}
      <Dialog open={tokenDialog} onOpenChange={setTokenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar Pontos de Reconhecimento</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Reconheça a contribuição de alguém. Cada ponto enviado conta como
              XP para o destinatário.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Recipient combobox */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Destinatário</label>
              {recipientId ? (
                <div className="flex items-center gap-2 rounded-xl border border-input bg-muted/50 px-3 py-2 text-sm">
                  <span className="flex-1 truncate">{recipientLabel}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientId("");
                      setRecipientLabel("");
                      setRecipientSearch("");
                    }}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      value={recipientSearch}
                      onChange={(e) => {
                        setRecipientSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar por nome ou @username..."
                      className="w-full rounded-xl border border-input bg-background pl-9 pr-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showDropdown && debouncedSearch.trim() && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
                      {searchResults && searchResults.length > 0
                        ? searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setRecipientId(p.id);
                                setRecipientLabel(
                                  `@${p.username}${p.firstName ? ` — ${p.firstName}${p.lastName ? " " + p.lastName : ""}` : ""}`
                                );
                                setRecipientSearch("");
                                setShowDropdown(false);
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold font-heading">
                                {p.firstName?.[0] ??
                                  p.username[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {p.firstName} {p.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  @{p.username}
                                </p>
                              </div>
                            </button>
                          ))
                        : !searching && (
                            <p className="px-3 py-3 text-sm text-muted-foreground text-center">
                              Nenhum usuário encontrado
                            </p>
                          )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Quantidade de pontos (1–5, disponíveis:{" "}
                {profile?.gratitudeTokens ?? 0})
              </label>
              <input
                type="number"
                min={1}
                max={Math.min(5, profile?.gratitudeTokens ?? 0)}
                value={tokenAmount}
                onChange={(e) => setTokenAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <textarea
                value={tokenMessage}
                onChange={(e) => setTokenMessage(e.target.value)}
                placeholder="Obrigado pela ajuda..."
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => setTokenDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-xl font-bold"
              onClick={handleTransfer}
              disabled={transferring || !recipientId.trim()}
            >
              {transferring ? "Enviando..." : "Enviar Reconhecimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withPageRequiredAuth(Profile);
