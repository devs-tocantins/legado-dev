"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  useGetProofPortfolioService,
  useGetModerationHistoryService,
} from "@/services/api/services/learning-tracks";
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
  ChevronRight,
  Flag,
} from "lucide-react";

export type HistoryEventType =
  | "trilha"
  | "voluntariado"
  | "ranking"
  | "moderation";

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
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
            style={{ fieldSizing: "content" }}
            className="w-full field-sizing-content min-h-[90px] rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

const EVENT_ICON: Record<HistoryEventType, string> = {
  trilha: "🎓",
  voluntariado: "🙌",
  ranking: "🏆",
  moderation: "🛡️",
};

function CompactEventRow({
  event,
  user,
  setDetailSubmission,
  setReportingSubmissionId,
}: {
  event: HistoryEventItem;
  user: any;
  setDetailSubmission: (d: any) => void;
  setReportingSubmissionId: (id: string) => void;
}) {
  const formattedDate = new Date(event.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="relative flex items-start justify-between gap-3 pb-1">
      <div className="absolute left-[-36px] top-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm text-xs select-none">
        {EVENT_ICON[event.type]}
      </div>

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
          <p className="text-sm font-semibold leading-snug">{event.title}</p>
        )}

        {event.subtitle && (
          <p className="text-xs text-muted-foreground leading-snug truncate">
            {event.subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        {typeof event.xp === "number" && event.xp > 0 && (
          <span className="text-xs font-semibold font-mono text-emerald-500">
            +{event.xp} XP
          </span>
        )}

        <span className="text-xs text-muted-foreground font-mono">
          {formattedDate}
        </span>

        {event.type === "voluntariado" && event.submissionId && user && (
          <button
            onClick={() => setReportingSubmissionId(event.submissionId!)}
            title="Reportar contribuição inválida"
            className="text-muted-foreground/40 hover:text-destructive transition-colors ml-0.5"
          >
            <Flag className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function HighlightCard({
  event,
  setDetailSubmission,
}: {
  event: HistoryEventItem;
  setDetailSubmission: (d: any) => void;
}) {
  const formattedDate = new Date(event.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-lg border bg-surface p-4 shadow-sm space-y-2 mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">{EVENT_ICON[event.type]}</span>
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
              </button>
            ) : (
              <p className="text-sm font-semibold leading-snug truncate">
                {event.title}
              </p>
            )}
          </div>
          {event.subtitle && (
            <p className="text-xs text-muted-foreground leading-snug">
              {event.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {typeof event.xp === "number" && event.xp > 0 && (
            <span className="text-xs font-semibold font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              +{event.xp} XP
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthBlock({
  monthIndex,
  year,
  events,
  user,
  setDetailSubmission,
  setReportingSubmissionId,
}: {
  monthIndex: number;
  year: number;
  events: HistoryEventItem[];
  user: any;
  setDetailSubmission: (d: any) => void;
  setReportingSubmissionId: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

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
  const monthName = monthNames[monthIndex];

  // Highlights: top 3 ranking, moderation (no feedback data available so we just use type)
  const highlights = events.filter(
    (e) => e.type === "ranking" || e.type === "moderation"
  );
  const others = events.filter(
    (e) => e.type !== "ranking" && e.type !== "moderation"
  );

  const counts = {
    voluntariado: events.filter((e) => e.type === "voluntariado").length,
    trilha: events.filter((e) => e.type === "trilha").length,
    ranking: events.filter((e) => e.type === "ranking").length,
    moderation: events.filter((e) => e.type === "moderation").length,
  };
  const total = events.length;
  const categoriesCount = Object.values(counts).filter((c) => c > 0).length;

  return (
    <div className="mb-8 relative">
      {/* Month Header */}
      <div className="flex items-center gap-3 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-1">
        <h3 className="text-sm font-semibold capitalize whitespace-nowrap">
          {monthName} de {year}
        </h3>
        <div className="h-px bg-border flex-1" />
      </div>

      {/* Monthly Summary */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-surface-raised flex items-center justify-center border border-border shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <p className="font-semibold text-foreground">
            Enviou {total} contribuiç{total === 1 ? "ão" : "ões"} em{" "}
            {categoriesCount} categoria{categoriesCount === 1 ? "" : "s"}
          </p>
        </div>

        {/* Mini-bar */}
        <div className="flex h-2.5 w-32 rounded-full overflow-hidden bg-surface-raised border border-border">
          {counts.voluntariado > 0 && (
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${(counts.voluntariado / total) * 100}%` }}
              title={`Voluntariado: ${counts.voluntariado}`}
            />
          )}
          {counts.trilha > 0 && (
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(counts.trilha / total) * 100}%` }}
              title={`Trilha: ${counts.trilha}`}
            />
          )}
          {counts.ranking > 0 && (
            <div
              className="h-full bg-amber-500"
              style={{ width: `${(counts.ranking / total) * 100}%` }}
              title={`Ranking: ${counts.ranking}`}
            />
          )}
          {counts.moderation > 0 && (
            <div
              className="h-full bg-slate-500"
              style={{ width: `${(counts.moderation / total) * 100}%` }}
              title={`Moderação: ${counts.moderation}`}
            />
          )}
        </div>
      </div>

      <div className="relative pl-9">
        <div className="absolute left-[13px] top-2 bottom-0 w-px bg-border" />

        {/* Highlights */}
        {highlights.map((event) => (
          <HighlightCard
            key={event.id}
            event={event}
            setDetailSubmission={setDetailSubmission}
          />
        ))}

        {/* Other events (collapsible) */}
        {others.length > 0 && (
          <div className="mt-2">
            {!expanded ? (
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group py-1"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-raised group-hover:border-primary/50 absolute left-0 ml-[-1px] transition-colors z-10">
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium ml-1">
                  {others.length} outra{others.length > 1 ? "s" : ""} contribuiç
                  {others.length > 1 ? "ões" : "ão"} neste mês
                </span>
              </button>
            ) : (
              <div className="space-y-4 pt-1">
                {others.map((event) => (
                  <CompactEventRow
                    key={event.id}
                    event={event}
                    user={user}
                    setDetailSubmission={setDetailSubmission}
                    setReportingSubmissionId={setReportingSubmissionId}
                  />
                ))}
                <button
                  onClick={() => setExpanded(false)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground mt-2 pl-2"
                >
                  Ocultar contribuições
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const fetchProofPortfolio = useGetProofPortfolioService();
  const fetchApprovedSubmissions = useGetProfileApprovedSubmissionsService();
  const fetchRankingHistory = useGetProfileRankingHistoryService();
  const fetchActivities = useGetActivitiesService();
  const fetchModerationHistory = useGetModerationHistoryService();

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

  const { data: moderationHistoryData, isLoading: loadingModeration } =
    useQuery({
      queryKey: ["public-profile-moderation", profileId],
      queryFn: async () => {
        const { status, data } = await fetchModerationHistory(profileId);
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

    // 1. Trilha
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

    // 2. Voluntariado
    if (submissionsData) {
      for (const sub of submissionsData) {
        const portfolioMatch = sub.trackItemId
          ? proofPortfolio?.find((item) => item.itemId === sub.trackItemId)
          : null;
        const title =
          activityMap.get(sub.activityId) ??
          portfolioMatch?.itemTitle ??
          (sub.trackItemId
            ? "Marco de trilha concluído"
            : sub.activityId.substring(0, 8) + "…");
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

    // 3. Ranking
    if (rankingHistoryData) {
      for (const snapshot of rankingHistoryData) {
        if (snapshot.position > 3) continue;
        events.push({
          id: `ranking-${snapshot.id}`,
          type: "ranking",
          date: snapshot.createdAt,
          title: `${snapshot.position}º lugar — ${formatPeriodKey(
            snapshot.periodKey
          )}`,
          subtitle:
            snapshot.periodType === "monthly"
              ? "Ranking Mensal"
              : "Ranking Anual",
          position: snapshot.position,
          periodKey: snapshot.periodKey,
        });
      }
    }

    // 4. Moderação
    if (moderationHistoryData) {
      for (const mod of moderationHistoryData) {
        events.push({
          id: `moderation-${mod.id}`,
          type: "moderation",
          date: mod.createdAt,
          title: mod.description,
          subtitle: "Recompensa de Moderação",
          xp: mod.amount,
        });
      }
    }

    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return events;
  }, [
    proofPortfolio,
    submissionsData,
    rankingHistoryData,
    moderationHistoryData,
    activityMap,
  ]);

  const isLoading =
    loadingPortfolio ||
    loadingSubmissions ||
    loadingRanking ||
    loadingModeration;

  const groupedByYearAndMonth = useMemo(() => {
    const years = new Map<number, Map<number, HistoryEventItem[]>>();
    combinedEvents.forEach((event) => {
      const d = new Date(event.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      if (!years.has(y)) years.set(y, new Map());
      if (!years.get(y)!.has(m)) years.get(y)!.set(m, []);
      years.get(y)!.get(m)!.push(event);
    });
    return years;
  }, [combinedEvents]);

  const availableYears = Array.from(groupedByYearAndMonth.keys()).sort(
    (a, b) => b - a
  );
  const activeYear =
    selectedYear && availableYears.includes(selectedYear)
      ? selectedYear
      : availableYears[0];

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
        <div className="lg:grid lg:grid-cols-[1fr_150px] lg:gap-8 flex flex-col-reverse gap-6">
          {/* Main content column */}
          <div className="min-w-0">
            {activeYear && groupedByYearAndMonth.has(activeYear)
              ? Array.from(groupedByYearAndMonth.get(activeYear)!.keys())
                  .sort((a, b) => b - a)
                  .map((month) => (
                    <MonthBlock
                      key={`${activeYear}-${month}`}
                      monthIndex={month}
                      year={activeYear}
                      events={
                        groupedByYearAndMonth.get(activeYear)!.get(month)!
                      }
                      user={user}
                      setDetailSubmission={setDetailSubmission}
                      setReportingSubmissionId={setReportingSubmissionId}
                    />
                  ))
              : null}
          </div>

          {/* Sidebar for Years */}
          <div className="shrink-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:sticky lg:top-14 no-scrollbar">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={cn(
                    "px-4 lg:px-3 py-1.5 rounded-full lg:rounded-md text-sm font-medium transition-colors whitespace-nowrap lg:text-left",
                    activeYear === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-raised text-muted-foreground hover:bg-surface-raised/80 hover:text-foreground"
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
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
