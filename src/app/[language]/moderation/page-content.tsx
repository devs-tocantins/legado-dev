"use client";

import { useState } from "react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useGetPendingSubmissionsService,
  useReviewSubmissionService,
} from "@/services/api/services/submissions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Submission } from "@/services/api/types/submission";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";

function SubmissionItem({
  submission,
  onReviewed,
}: {
  submission: Submission;
  onReviewed: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const reviewSubmission = useReviewSubmissionService();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { status } = await reviewSubmission({
        id: submission.id,
        data: { status: "APPROVED" },
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Submissão aprovada!", { variant: "success" });
        onReviewed();
      } else {
        enqueueSnackbar("Erro ao aprovar.", { variant: "error" });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    setProcessing(true);
    try {
      const { status } = await reviewSubmission({
        id: submission.id,
        data: { status: "REJECTED", feedback: feedback.trim() },
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Submissão rejeitada.", { variant: "success" });
        onReviewed();
      } else {
        enqueueSnackbar("Erro ao rejeitar.", { variant: "error" });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">Perfil:</span>{" "}
              <span className="font-mono">
                {submission.profileId.substring(0, 8)}…
              </span>
            </span>
            <span>
              <span className="font-medium text-foreground">Atividade:</span>{" "}
              <span className="font-mono">
                {submission.activityId.substring(0, 8)}…
              </span>
            </span>
            <span>
              {new Date(submission.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {submission.proofUrl && (
            <a
              href={submission.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver comprovante
            </a>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          Pendente
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8"
          onClick={handleApprove}
          disabled={processing}
        >
          Aprovar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5 h-8"
          onClick={() => setRejectOpen((o) => !o)}
          disabled={processing}
        >
          {rejectOpen ? (
            <>
              <X className="h-3 w-3" /> Cancelar
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Rejeitar
            </>
          )}
        </Button>
      </div>

      {/* Inline reject form */}
      {rejectOpen && (
        <div className="space-y-2 border-t pt-3">
          <label className="text-xs font-medium text-muted-foreground">
            Motivo da rejeição <span className="text-destructive">*</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Explique o motivo da rejeição..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={processing || !feedback.trim()}
            className="h-8"
          >
            {processing ? "Processando..." : "Confirmar Rejeição"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ModerationPageContent() {
  const fetchPending = useGetPendingSubmissionsService();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pending-submissions", page],
    queryFn: async () => {
      const { status, data } = await fetchPending({ page, limit: 20 });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const submissions: Submission[] = data?.data ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const handleReviewed = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-submissions"] });
    refetch();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Fila de Moderação
          </h1>
          <p className="text-sm text-muted-foreground">
            Revise e aprove as submissões da comunidade
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            {submissions.length} pendente{submissions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-muted rounded-lg" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed">
          <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhuma submissão pendente</p>
          <p className="text-sm text-muted-foreground mt-1">
            Todas as submissões foram revisadas!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <SubmissionItem
              key={sub.id}
              submission={sub}
              onReviewed={handleReviewed}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (hasNextPage || page > 1) && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              className="gap-1"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Anterior
            </Button>
          )}
          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              Próxima
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(ModerationPageContent, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
