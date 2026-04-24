"use client";

import { useState, useMemo } from "react";
import { MarkdownContent } from "@/components/markdown-editor";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  useGetPendingSubmissionsService,
  useReviewSubmissionService,
} from "@/services/api/services/submissions";
import {
  useGetAllMissionsService,
  useGetMissionSubmissionsService,
  useReviewMissionSubmissionService,
} from "@/services/api/services/missions";
import { useGetActivityService } from "@/services/api/services/activities";
import { useGetGamificationProfileService } from "@/services/api/services/gamification-profiles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Submission } from "@/services/api/types/submission";
import { Mission, MissionSubmission } from "@/services/api/types/mission";
import { Activity } from "@/services/api/types/activity";
import { GamificationProfile } from "@/services/api/types/gamification-profile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  User,
  FileText,
  Link2,
  CheckCircle2,
  XCircle,
  Info,
  Trophy,
  Target,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";
import { cn, getApiError } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "@/components/link";

// ─── Shared hooks ─────────────────────────────────────────────────────────────

function useActivity(activityId: string) {
  const fetch = useGetActivityService();
  return useQuery({
    queryKey: ["activity", activityId],
    queryFn: async () => {
      const { status, data } = await fetch({ id: activityId });
      if (status === HTTP_CODES_ENUM.OK) return data as Activity;
      return null;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!activityId,
  });
}

function useProfile(profileId: string) {
  const fetch = useGetGamificationProfileService();
  return useQuery({
    queryKey: ["profile", profileId],
    queryFn: async () => {
      const { status, data } = await fetch({ id: profileId });
      if (status === HTTP_CODES_ENUM.OK) return data as GamificationProfile;
      return null;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!profileId,
  });
}

// ─── Atividades: Detail modal ─────────────────────────────────────────────────

function DetailModal({
  submission,
  open,
  onClose,
  onReviewed,
}: {
  submission: Submission;
  open: boolean;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const reviewSubmission = useReviewSubmissionService();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: activity } = useActivity(submission.activityId);
  const { data: profile } = useProfile(submission.profileId);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { status, data } = await reviewSubmission({
        id: submission.id,
        data: { status: "APPROVED" },
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Submissão aprovada!", { variant: "success" });
        onReviewed();
        onClose();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao aprovar."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    setProcessing(true);
    try {
      const { status, data } = await reviewSubmission({
        id: submission.id,
        data: { status: "REJECTED", feedback: feedback.trim() },
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Submissão rejeitada.", { variant: "success" });
        onReviewed();
        onClose();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao rejeitar."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto sm:overflow-visible sm:max-h-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Revisão de Submissão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pessoa */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Pessoa
            </p>
            {profile ? (
              <>
                <p className="text-sm font-semibold font-mono">
                  @{profile.username}
                </p>
                <Link
                  href={`/u/${profile.username}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver perfil público
                </Link>
              </>
            ) : (
              <div className="h-4 bg-muted animate-pulse rounded w-32" />
            )}
          </div>

          {/* Atividade */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Atividade
            </p>
            {activity ? (
              <>
                <p className="text-sm font-semibold">{activity.title}</p>
                {activity.description && (
                  <MarkdownContent
                    content={activity.description}
                    className="text-xs text-muted-foreground"
                  />
                )}
              </>
            ) : (
              <div className="h-4 bg-muted animate-pulse rounded w-40" />
            )}
          </div>

          {/* O que foi enviado */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> O que foi enviado
            </p>
            {!submission.description && !submission.proofUrl ? (
              <p className="text-xs text-muted-foreground italic">
                Nenhum detalhe enviado.
              </p>
            ) : (
              <>
                {submission.description && (
                  <div className="bg-muted rounded-md px-3 py-2">
                    <MarkdownContent
                      content={submission.description}
                      className="text-sm"
                    />
                  </div>
                )}
                {submission.proofUrl && (
                  <a
                    href={submission.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline flex items-center gap-1.5 text-sm break-all"
                  >
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    {submission.proofUrl}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
              </>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={handleApprove}
                disabled={processing}
              >
                <CheckCircle2 className="h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-1.5"
                onClick={() => setRejectOpen((o) => !o)}
                disabled={processing}
              >
                <XCircle className="h-4 w-4" />
                {rejectOpen ? "Cancelar" : "Rejeitar"}
              </Button>
            </div>

            {rejectOpen && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">
                    Motivo da rejeição{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {feedback.length}/500
                  </span>
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Explique o motivo da rejeição..."
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleReject}
                  disabled={processing || !feedback.trim()}
                >
                  {processing ? "Processando..." : "Confirmar Rejeição"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Atividades: Row ──────────────────────────────────────────────────────────

function SubmissionRow({
  submission,
  onSelect,
}: {
  submission: Submission;
  onSelect: () => void;
}) {
  const { data: activity } = useActivity(submission.activityId);
  const { data: profile } = useProfile(submission.profileId);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          {profile ? (
            <span className="text-sm font-semibold font-mono">
              @{profile.username}
            </span>
          ) : (
            <span className="h-4 w-24 bg-muted animate-pulse rounded inline-block" />
          )}
          <span className="text-muted-foreground text-xs">→</span>
          {activity ? (
            <span className="text-sm font-medium truncate">
              {activity.title}
            </span>
          ) : (
            <span className="h-4 w-32 bg-muted animate-pulse rounded inline-block" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(submission.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {submission.proofUrl && (
            <span className="ml-2 text-primary">· tem comprovante</span>
          )}
          {submission.description && (
            <span className="ml-2 text-primary">· tem descrição</span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="shrink-0 flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
        Revisar
      </button>
    </div>
  );
}

// ─── Missões: Confirm modal ───────────────────────────────────────────────────

function ConfirmWinnerModal({
  open,
  onClose,
  onConfirm,
  processing,
  submissionProfile,
  missionTitle,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  processing: boolean;
  submissionProfile: GamificationProfile | null | undefined;
  missionTitle: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Confirmar vencedor
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 space-y-1">
            <p className="font-semibold">Esta ação é irreversível.</p>
            <p>
              Ao confirmar,{" "}
              <span className="font-mono font-semibold">
                @{submissionProfile?.username}
              </span>{" "}
              será declarado vencedor da missão{" "}
              <span className="font-semibold">&quot;{missionTitle}&quot;</span>.
              Todos os outros participantes serão notificados que não foram
              selecionados e a missão será encerrada.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={onConfirm}
              disabled={processing}
            >
              <Trophy className="h-4 w-4" />
              {processing ? "Processando..." : "Confirmar vencedor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Missões: Submission card ─────────────────────────────────────────────────

function MissionSubmissionCard({
  sub,
  index,
  onChoose,
}: {
  sub: MissionSubmission;
  index: number;
  onChoose: (sub: MissionSubmission) => void;
}) {
  const { data: profile } = useProfile(sub.profileId);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              #{index + 1}
            </span>
            {profile ? (
              <Link
                href={`/u/${profile.username}`}
                target="_blank"
                className="text-sm font-semibold font-mono text-primary hover:underline"
              >
                @{profile.username}
              </Link>
            ) : (
              <span className="h-4 w-24 bg-muted animate-pulse rounded inline-block" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          onClick={() => onChoose(sub)}
        >
          <Trophy className="h-3.5 w-3.5" />
          Escolher
        </Button>
      </div>

      {sub.description && (
        <div className="bg-muted rounded-md px-3 py-2">
          <MarkdownContent content={sub.description} className="text-sm" />
        </div>
      )}
      {sub.proofUrl && (
        <a
          href={sub.proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline flex items-center gap-1.5 text-sm break-all"
        >
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          {sub.proofUrl}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      )}
      {!sub.description && !sub.proofUrl && (
        <p className="text-xs text-muted-foreground italic">
          Nenhum detalhe enviado.
        </p>
      )}
    </div>
  );
}

// ─── Missões: Mission row (expansível) ───────────────────────────────────────

function MissionRow({
  mission,
  onReviewed,
}: {
  mission: Mission;
  onReviewed: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [chosen, setChosen] = useState<MissionSubmission | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const getMissionSubmissions = useGetMissionSubmissionsService();
  const reviewMissionSubmission = useReviewMissionSubmissionService();

  const { data: chosenProfile } = useProfile(chosen?.profileId ?? "");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["mission-submissions", mission.id],
    queryFn: async () => {
      const { status, data } = await getMissionSubmissions(mission.id);
      if (status === HTTP_CODES_ENUM.OK) return data as MissionSubmission[];
      return [] as MissionSubmission[];
    },
    enabled: expanded,
  });

  const pending = useMemo(
    () => (submissions ?? []).filter((s) => s.status === "PENDING"),
    [submissions]
  );

  const { mutate: doChoose, isPending: processing } = useMutation({
    mutationFn: async () => {
      if (!chosen) return;
      const { status, data } = await reviewMissionSubmission(
        mission.id,
        chosen.id,
        { status: "APPROVED" }
      );
      if (status !== HTTP_CODES_ENUM.OK) {
        throw new Error(getApiError(data, "Erro ao escolher vencedor."));
      }
    },
    onSuccess: () => {
      enqueueSnackbar("Vencedor escolhido! Missão encerrada.", {
        variant: "success",
      });
      setChosen(null);
      onReviewed();
    },
    onError: (e: any) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setExpanded((o) => !o)}
      >
        <Target className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{mission.title}</p>
          <p className="text-xs text-muted-foreground">
            {mission.xpReward} XP · aberta em{" "}
            {new Date(mission.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          {expanded && submissions
            ? `${pending.length} pendente${pending.length !== 1 ? "s" : ""}`
            : "ver"}
        </Badge>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-90"
          )}
        />
      </div>

      {expanded && (
        <div className="ml-4 pl-4 border-l border-border space-y-3 pb-2">
          {isLoading ? (
            <div className="space-y-2 pt-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-24 bg-muted rounded-lg"
                />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-xs text-muted-foreground italic pt-2">
              Nenhuma submissão pendente.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-muted-foreground">
                Veja todas as submissões antes de escolher. A escolha é
                irreversível.
              </p>
              {pending.map((sub, i) => (
                <MissionSubmissionCard
                  key={sub.id}
                  sub={sub}
                  index={i}
                  onChoose={setChosen}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {chosen && (
        <ConfirmWinnerModal
          open={!!chosen}
          onClose={() => setChosen(null)}
          onConfirm={() => doChoose()}
          processing={processing}
          submissionProfile={chosenProfile}
          missionTitle={mission.title}
        />
      )}
    </>
  );
}

// ─── Aba: Atividades ──────────────────────────────────────────────────────────

function AtividadesTab() {
  const fetchPending = useGetPendingSubmissionsService();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Submission | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pending-submissions", page],
    queryFn: async () => {
      const { status, data } = await fetchPending({ page, limit: 20 });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const submissions = useMemo<Submission[]>(() => data?.data ?? [], [data]);
  const hasNextPage = data?.hasNextPage ?? false;

  const handleReviewed = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-submissions"] });
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Clique em &quot;Revisar&quot; para ver os detalhes antes de decidir
        </p>
        {!isLoading && (
          <Badge variant="outline" className="text-xs">
            {submissions.length} pendente{submissions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma submissão pendente"
          description="Todas as submissões foram revisadas!"
        />
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <SubmissionRow
              key={sub.id}
              submission={sub}
              onSelect={() => setSelected(sub)}
            />
          ))}
        </div>
      )}

      {!isLoading && (hasNextPage || page > 1) && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              className="gap-1"
            >
              <ChevronUp className="h-3.5 w-3.5" /> Anterior
            </Button>
          )}
          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              Próxima <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {selected && (
        <DetailModal
          submission={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}

// ─── Aba: Missões ─────────────────────────────────────────────────────────────

function MissoesTab() {
  const fetchAllMissions = useGetAllMissionsService();
  const queryClient = useQueryClient();

  const { data: missions, isLoading } = useQuery({
    queryKey: ["moderation-missions"],
    queryFn: async () => {
      const { status, data } = await fetchAllMissions({ page: 1, limit: 50 });
      if (status === HTTP_CODES_ENUM.OK) return data.data as Mission[];
      return [] as Mission[];
    },
  });

  const openMissions = useMemo(
    () => (missions ?? []).filter((m) => m.status === "OPEN"),
    [missions]
  );

  const handleReviewed = () => {
    queryClient.invalidateQueries({ queryKey: ["moderation-missions"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Expanda uma missão para ver todas as submissões antes de escolher o
          vencedor
        </p>
        {!isLoading && (
          <Badge variant="outline" className="text-xs">
            {openMissions.length} aberta{openMissions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
          ))}
        </div>
      ) : openMissions.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma missão aberta"
          description="Todas as missões foram encerradas."
        />
      ) : (
        <div className="space-y-2">
          {openMissions.map((mission) => (
            <MissionRow
              key={mission.id}
              mission={mission}
              onReviewed={handleReviewed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "atividades" | "missoes";

function ModerationPageContent() {
  const [tab, setTab] = useState<Tab>("atividades");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Fila de Moderação
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["atividades", "missoes"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "atividades" ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" /> Atividades
              </>
            ) : (
              <>
                <Target className="h-3.5 w-3.5" /> Missões
              </>
            )}
          </button>
        ))}
      </div>

      {tab === "atividades" ? <AtividadesTab /> : <MissoesTab />}
    </div>
  );
}

export default withPageRequiredAuth(ModerationPageContent, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
