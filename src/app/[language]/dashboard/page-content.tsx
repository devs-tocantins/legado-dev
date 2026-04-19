"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import SpotlightTour from "@/components/tour/spotlight-tour";
import useAuth from "@/services/auth/use-auth";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "@/components/link";
import {
  Zap,
  CalendarDays,
  TrendingUp,
  Coins,
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

function StatusIcon({ status }: { status: SubmissionStatusEnum }) {
  if (status === SubmissionStatusEnum.APPROVED)
    return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === SubmissionStatusEnum.REJECTED)
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
}

function StatusBadge({ status }: { status: SubmissionStatusEnum }) {
  if (status === SubmissionStatusEnum.APPROVED) return <Badge>Aprovado</Badge>;
  if (status === SubmissionStatusEnum.REJECTED)
    return <Badge variant="destructive">Rejeitado</Badge>;
  return <Badge variant="secondary">Pendente</Badge>;
}

const SUBMISSION_BORDER: Record<SubmissionStatusEnum, string> = {
  [SubmissionStatusEnum.APPROVED]: "border-l-emerald-500",
  [SubmissionStatusEnum.REJECTED]: "border-l-destructive",
  [SubmissionStatusEnum.PENDING]: "border-l-amber-500",
};

function DashboardPageContent() {
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
    router.replace("/dashboard");
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

  const { data: profileData } = useQuery({
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
    queryKey: ["my-badges", profileData?.id],
    queryFn: async () => {
      const { status, data } = await fetchProfileBadges(profileData!.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!profileData?.id,
  });

  const activityMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of activitiesData ?? []) {
      map.set(a.id, a.title);
    }
    return map;
  }, [activitiesData]);

  const profile = profileData;
  const totalXp = profile?.totalXp ?? 0;
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const nextLevelXp = getNextLevelXp(totalXp);
  const recentSubmissions = submissionsData ?? [];

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

  const stats = [
    {
      label: "XP Total",
      value: formatXp(profile?.totalXp ?? 0),
      icon: Zap,
    },
    {
      label: "XP Mensal",
      value: formatXp(profile?.currentMonthlyXp ?? 0),
      icon: CalendarDays,
    },
    {
      label: "XP Anual",
      value: formatXp(profile?.currentYearlyXp ?? 0),
      icon: TrendingUp,
    },
    {
      label: "Pts. Reconhecimento",
      value: profile?.gratitudeTokens ?? 0,
      icon: Coins,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {user?.firstName}!
        </h1>
      </div>

      {/* Stat cards */}
      <div ref={statsRef} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Level card */}
        <div ref={levelRef} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Seu Nível
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className={cn("text-2xl font-bold", level.color)}>
                  {level.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {level.maxXp === Infinity
                    ? "Nível máximo atingido!"
                    : `${formatXp(nextLevelXp - totalXp)} XP para o próximo nível`}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{formatXp(level.minXp)}</span>
                  <span>{progress}%</span>
                  <span>
                    {level.maxXp === Infinity ? "∞" : formatXp(level.maxXp)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
              {profile && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-mono">
                    @{profile.username}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 gap-1"
                    render={<Link href={`/u/${profile.username}`} />}
                  >
                    Ver público
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent submissions */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submissões Recentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              render={<Link href="/submissions" />}
            >
              Ver todas
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma submissão ainda.
              </p>
            ) : (
              <div className="space-y-1">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={cn(
                      "flex items-center gap-3 py-2.5 px-3 rounded-md border-l-2",
                      SUBMISSION_BORDER[sub.status]
                    )}
                  >
                    <StatusIcon status={sub.status} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {activityMap.get(sub.activityId) ?? (
                          <span className="font-mono text-xs text-muted-foreground">
                            {sub.activityId.substring(0, 8)}…
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sub.status === SubmissionStatusEnum.APPROVED && (
                        <span className="text-xs font-semibold font-mono text-emerald-500">
                          +{sub.awardedXp}
                        </span>
                      )}
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conquistas */}
      {myBadges && myBadges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Conquistas
            </h2>
            {profile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                render={<Link href={`/u/${profile.username}`} />}
              >
                Ver perfil
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
        </div>
      )}

      {/* Quick actions */}
      <div ref={actionsRef}>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Ações Rápidas
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/submissions/new" />} className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Submeter Atividade
          </Button>
          <Button
            variant="outline"
            render={<Link href="/activities" />}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Ver Atividades
          </Button>
          <Button
            variant="outline"
            render={<Link href="/leaderboard" />}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            Ver Ranking
          </Button>
          <Button
            variant="outline"
            render={<Link href="/transactions" />}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Histórico de Tokens
          </Button>
          <Button
            variant="outline"
            render={<Link href="/secret" />}
            className="gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Resgatar Código
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setTokenDialog(true)}
          >
            <Send className="h-4 w-4" />
            Reconhecer alguém
          </Button>
        </div>
      </div>

      {/* Token transfer dialog */}
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
                "Seu nível sobe conforme você acumula XP. O link do perfil público fica disponível para toda a comunidade.",
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
                <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm">
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
                      className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showDropdown && debouncedSearch.trim() && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                      {searchResults && searchResults.length > 0
                        ? searchResults.map((profile) => (
                            <button
                              key={profile.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setRecipientId(profile.id);
                                setRecipientLabel(
                                  `@${profile.username}${profile.firstName ? ` — ${profile.firstName}${profile.lastName ? " " + profile.lastName : ""}` : ""}`
                                );
                                setRecipientSearch("");
                                setShowDropdown(false);
                              }}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold font-heading">
                                {profile.firstName?.[0] ??
                                  profile.username[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {profile.firstName} {profile.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  @{profile.username}
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <textarea
                value={tokenMessage}
                onChange={(e) => setTokenMessage(e.target.value)}
                placeholder="Obrigado pela ajuda..."
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTokenDialog(false)}>
              Cancelar
            </Button>
            <Button
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

export default withPageRequiredAuth(DashboardPageContent);
