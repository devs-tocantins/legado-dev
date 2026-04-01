"use client";

import { useState, useMemo } from "react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import useAuth from "@/services/auth/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  useGetMyGamificationProfileService,
  useTransferTokensService,
} from "@/services/api/services/gamification-profiles";
import { useGetMySubmissionsService } from "@/services/api/services/submissions";
import { useGetActivitiesService } from "@/services/api/services/activities";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";

function StatusBadge({ status }: { status: SubmissionStatusEnum }) {
  if (status === SubmissionStatusEnum.APPROVED) return <Badge>Aprovado</Badge>;
  if (status === SubmissionStatusEnum.REJECTED)
    return <Badge variant="destructive">Rejeitado</Badge>;
  return <Badge variant="secondary">Pendente</Badge>;
}

function DashboardPageContent() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const fetchMySubmissions = useGetMySubmissionsService();
  const fetchActivities = useGetActivitiesService();
  const transferTokens = useTransferTokensService();

  const [tokenDialog, setTokenDialog] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [tokenAmount, setTokenAmount] = useState(1);
  const [tokenMessage, setTokenMessage] = useState("");
  const [transferring, setTransferring] = useState(false);

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
      const { status } = await transferTokens({
        recipientProfileId: recipientId.trim(),
        amount: tokenAmount,
        message: tokenMessage.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.CREATED || status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Token enviado com sucesso!", { variant: "success" });
        setTokenDialog(false);
        setRecipientId("");
        setTokenAmount(1);
        setTokenMessage("");
      } else {
        enqueueSnackbar("Erro ao enviar token.", { variant: "error" });
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
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "XP Mensal",
      value: formatXp(profile?.currentMonthlyXp ?? 0),
      icon: CalendarDays,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      label: "XP Anual",
      value: formatXp(profile?.currentYearlyXp ?? 0),
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Tokens",
      value: profile?.gratitudeTokens ?? 0,
      icon: Coins,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {user?.firstName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe seu progresso na comunidade Devs Tocantins
        </p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Level card */}
        <Card className="lg:col-span-1">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatXp(level.minXp)} XP</span>
                <span>{progress}%</span>
                <span>
                  {level.maxXp === Infinity ? "∞" : formatXp(level.maxXp)} XP
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {profile && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
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
              <div className="divide-y">
                {recentSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between py-2"
                  >
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
                    <div className="flex items-center gap-2">
                      {sub.status === SubmissionStatusEnum.APPROVED && (
                        <span className="text-xs font-semibold text-emerald-500">
                          +{sub.awardedXp} XP
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

      {/* Quick actions */}
      <div>
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
            Enviar Token
          </Button>
        </div>
      </div>

      {/* Token transfer dialog */}
      <Dialog open={tokenDialog} onOpenChange={setTokenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar Token de Gratidão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                ID do Perfil Destinatário
              </label>
              <input
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="ID do perfil..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Quantidade (1–5, disponíveis: {profile?.gratitudeTokens ?? 0})
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
              {transferring ? "Enviando..." : "Enviar Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withPageRequiredAuth(DashboardPageContent);
