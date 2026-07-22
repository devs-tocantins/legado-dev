"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGetProofPortfolioService } from "@/services/api/services/learning-tracks";
import { useGetProfileApprovedSubmissionsService } from "@/services/api/services/gamification-profiles";
import { useGetProfileRankingHistoryService } from "@/services/api/services/ranking-snapshots";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { useGetPublicSubmissionDetailService } from "@/services/api/services/submissions";
import { useCreateContributionReportService } from "@/services/api/services/notifications";
import { PublicSubmissionDetail } from "@/services/api/types/submission";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError, cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  Zap,
  CalendarDays,
  Paperclip,
  FileText,
  ChevronDown,
  Flag,
} from "lucide-react";

export type HistoryEventType = "trilha" | "voluntariado" | "ranking";

export interface HistoryEventItem {
  id: string;
  type: HistoryEventType;
  date: string;
  title: string;
  subtitle?: string;
  xp?: number;
  position?: number;
  periodKey?: string;
  submissionId?: string;
}

export function formatPeriodKey(periodKey: string): string {
  if (!periodKey) return "";
  if (periodKey.includes("-")) {
    const [year, monthStr] = periodKey.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} de ${year}`;
    }
  }
  return periodKey;
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
    onError: (e: Error) => enqueueSnackbar(e.message, { variant: "error" }),
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

function SubmissionDetailModal({
  submissionId,
  activityTitle,
  awardedXp,
  open,
  onClose,
}: {
  submissionId: string;
  activityTitle: string;
  awardedXp: number;
  open: boolean;
  onClose: () => void;
}) {
  const fetchDetail = useGetPublicSubmissionDetailService();

  const { data, isLoading } = useQuery<PublicSubmissionDetail | null>({
    queryKey: ["submission-public-detail", submissionId],
    queryFn: async () => {
      const { status, data } = await fetchDetail({ id: submissionId });
      if (status === HTTP_CODES_ENUM.OK) return data as PublicSubmissionDetail;
      return null;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base leading-snug">
            <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
            {activityTitle}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 animate-pulse py-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground py-2">
            Não foi possível carregar os detalhes.
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold font-mono text-emerald-500">
                <Zap className="h-3.5 w-3.5" />+{awardedXp} XP
              </span>
              {data.activityDate && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(data.activityDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {data.hasProof && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  Arquivo enviado
                </span>
              )}
            </div>

            {data.description && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Relato da pessoa
                </p>
                <div className="rounded-lg border bg-muted/40 px-3 py-2.5 max-h-48 overflow-y-auto">
                  <MarkdownContent
                    content={data.description}
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sobre esta atividade
              </p>
              <div className="rounded-lg border bg-muted/40 px-3 py-2.5 max-h-36 overflow-y-auto">
                <MarkdownContent
                  content={data.activityDescription}
                  className="text-xs text-muted-foreground"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Aprovado em{" "}
              {data.reviewedAt
                ? new Date(data.reviewedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : new Date(data.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ProfileHistoryTimelineProps {
  profileId: string;
  className?: string;
}

export function ProfileHistoryTimeline({
  profileId,
  className,
}: ProfileHistoryTimelineProps) {
  const { user } = useAuth();
  const [reportingSubmissionId, setReportingSubmissionId] = useState<
    string | null
  >(null);
  const [detailSubmission, setDetailSubmission] = useState<{
    id: string;
    activityTitle: string;
    awardedXp: number;
  } | null>(null);

  const fetchProofPortfolio = useGetProofPortfolioService();
  const fetchApprovedSubmissions = useGetProfileApprovedSubmissionsService();
  const fetchRankingHistory = useGetProfileRankingHistoryService();
  const fetchActivities = useGetActivitiesService();

  const { data: proofPortfolio, isLoading: loadingPortfolio } = useQuery({
    queryKey: ["public-profile-portfolio", profileId],
    queryFn: async () => {
      const { status, data } = await fetchProofPortfolio(profileId);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!profileId,
  });

  const { data: submissionsData, isLoading: loadingSubmissions } = useQuery({
    queryKey: ["public-profile-submissions", profileId],
    queryFn: async () => {
      const { status, data } = await fetchApprovedSubmissions(profileId, {
        page: 1,
        limit: 50,
      });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    enabled: !!profileId,
  });

  const { data: rankingHistoryData, isLoading: loadingRanking } = useQuery({
    queryKey: ["profile-ranking-history", profileId],
    queryFn: async () => {
      const { status, data } = await fetchRankingHistory(profileId);
      if (status === HTTP_CODES_ENUM.OK && Array.isArray(data)) return data;
      return [];
    },
    enabled: !!profileId,
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
    for (const a of activitiesData ?? []) map.set(a.id, a.title);
    return map;
  }, [activitiesData]);

  const combinedEvents = useMemo(() => {
    const events: HistoryEventItem[] = [];

    // 1. Trilha: do portfólio (excluir isTestOut true)
    if (proofPortfolio) {
      for (const item of proofPortfolio) {
        if (item.isTestOut) continue;
        events.push({
          id: `trilha-${item.itemId}`,
          type: "trilha",
          date: item.completedAt,
          title: item.itemTitle,
          subtitle: `${item.trackTitle} · ${item.sectionTitle}`,
        });
      }
    }

    // 2. Voluntariado: submissões aprovadas
    if (submissionsData) {
      for (const sub of submissionsData) {
        const title =
          activityMap.get(sub.activityId) ??
          sub.activityId.substring(0, 8) + "…";
        events.push({
          id: `voluntariado-${sub.id}`,
          type: "voluntariado",
          date: sub.createdAt,
          title,
          xp: sub.awardedXp,
          submissionId: sub.id,
        });
      }
    }

    // 3. Ranking: apenas position <= 3
    if (rankingHistoryData) {
      for (const snapshot of rankingHistoryData) {
        if (snapshot.position > 3) continue;
        events.push({
          id: `ranking-${snapshot.id}`,
          type: "ranking",
          date: snapshot.createdAt,
          title: `${snapshot.position}º lugar — ${formatPeriodKey(snapshot.periodKey)}`,
          subtitle:
            snapshot.periodType === "monthly"
              ? "Ranking Mensal"
              : "Ranking Anual",
          position: snapshot.position,
          periodKey: snapshot.periodKey,
        });
      }
    }

    // Ordenar por data decrescente (mais recente primeiro)
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return events;
  }, [proofPortfolio, submissionsData, rankingHistoryData, activityMap]);

  const isLoading = loadingPortfolio || loadingSubmissions || loadingRanking;

  const EVENT_ICON: Record<HistoryEventType, string> = {
    trilha: "🎓",
    voluntariado: "🙌",
    ranking: "🏆",
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground font-mono uppercase tracking-wide">
          Histórico
        </h2>
      </div>

      {isLoading ? (
        <div className="relative pl-9 space-y-6">
          <div className="absolute left-[13px] top-3 bottom-3 w-px bg-border" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative flex items-center gap-3 animate-pulse"
            >
              <div className="absolute left-[-36px] top-0.5 h-7 w-7 rounded-full bg-muted border border-border" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-muted rounded w-48" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : combinedEvents.length === 0 ? (
        <EmptyState
          icon={History}
          title="Ainda não há nada no histórico"
          description="Conclua marcos de trilhas ou participe de atividades de voluntariado para registrar suas conquistas aqui."
          className="py-10"
        />
      ) : (
        <div className="relative pl-9">
          {/* Linha vertical da timeline */}
          <div className="absolute left-[13px] top-3 bottom-3 w-px bg-border" />

          <div className="space-y-5">
            {combinedEvents.map((event, i) => {
              const isLast = i === combinedEvents.length - 1;
              const formattedDate = new Date(event.date).toLocaleDateString(
                "pt-BR",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              );

              return (
                <div
                  key={event.id}
                  className={cn(
                    "relative flex items-start justify-between gap-3",
                    !isLast && "pb-1"
                  )}
                >
                  {/* Dot/Ícone com círculo */}
                  <div
                    className={cn(
                      "absolute left-[-36px] top-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm text-xs select-none"
                    )}
                  >
                    {EVENT_ICON[event.type]}
                  </div>

                  {/* Conteúdo */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {event.type === "voluntariado" && event.submissionId ? (
                      <button
                        onClick={() =>
                          setDetailSubmission({
                            id: event.submissionId!,
                            activityTitle: event.title,
                            awardedXp: event.xp ?? 0,
                          })
                        }
                        className="text-left group inline-flex items-center gap-1 hover:text-primary transition-colors max-w-full"
                      >
                        <p className="text-sm font-semibold leading-snug group-hover:underline underline-offset-2 truncate">
                          {event.title}
                        </p>
                        <ChevronDown className="h-3 w-3 text-muted-foreground/60 shrink-0 -rotate-90" />
                      </button>
                    ) : (
                      <p className="text-sm font-semibold leading-snug">
                        {event.title}
                      </p>
                    )}

                    {event.subtitle && (
                      <p className="text-xs text-muted-foreground leading-snug truncate">
                        {event.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Badge de XP / Posição + Data */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {typeof event.xp === "number" && event.xp > 0 && (
                      <span className="text-xs font-semibold font-mono text-emerald-500">
                        +{event.xp} XP
                      </span>
                    )}

                    <span className="text-xs text-muted-foreground font-mono">
                      {formattedDate}
                    </span>

                    {event.type === "voluntariado" &&
                      event.submissionId &&
                      user && (
                        <button
                          onClick={() =>
                            setReportingSubmissionId(event.submissionId!)
                          }
                          title="Reportar contribuição inválida"
                          className="text-muted-foreground/40 hover:text-destructive transition-colors ml-0.5"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reportingSubmissionId && (
        <ReportModal
          submissionId={reportingSubmissionId}
          open={!!reportingSubmissionId}
          onClose={() => setReportingSubmissionId(null)}
        />
      )}

      {detailSubmission && (
        <SubmissionDetailModal
          submissionId={detailSubmission.id}
          activityTitle={detailSubmission.activityTitle}
          awardedXp={detailSubmission.awardedXp}
          open={!!detailSubmission}
          onClose={() => setDetailSubmission(null)}
        />
      )}
    </div>
  );
}
