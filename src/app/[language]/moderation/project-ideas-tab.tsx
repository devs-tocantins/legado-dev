"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Lightbulb, User, XCircle } from "lucide-react";
import {
  useGetPendingProjectIdeasService,
  usePatchReviewProjectIdeaService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { ProjectIdea } from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { projectUserName } from "@/lib/project-labels";

function ProjectIdeaRow({
  idea,
  onReviewed,
}: {
  idea: ProjectIdea;
  onReviewed: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const reviewIdea = usePatchReviewProjectIdeaService();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const review = async (decision: "APPROVED" | "REJECTED") => {
    setProcessing(true);
    try {
      const { status, data } = await reviewIdea({
        id: idea.id,
        status: decision,
        rejectionReason:
          decision === "REJECTED" ? rejectionReason.trim() : undefined,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(
          decision === "APPROVED" ? "Ideia aprovada!" : "Ideia rejeitada.",
          { variant: "success" }
        );
        onReviewed();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao revisar a ideia."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <span className="text-sm font-semibold">{idea.title}</span>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            Autor: {projectUserName(idea.author)}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-xs">
          Pendente
        </Badge>
      </div>

      <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
        {idea.description}
      </p>

      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => review("APPROVED")}
          disabled={processing}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aprovar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5"
          onClick={() => setRejectOpen((open) => !open)}
          disabled={processing}
        >
          <XCircle className="h-3.5 w-3.5" />
          {rejectOpen ? "Cancelar" : "Rejeitar"}
        </Button>
      </div>

      {rejectOpen && (
        <div className="flex flex-col gap-2 rounded-lg bg-secondary p-3">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explique o motivo (ex: escopo vago, fora do foco da comunidade...)"
            rows={3}
            maxLength={500}
            className="min-h-[70px] rounded-lg border border-border bg-card px-2.5 py-2 text-[13px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRejectOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => review("REJECTED")}
              disabled={processing || !rejectionReason.trim()}
            >
              Confirmar rejeição
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectIdeasTab() {
  const fetchPending = useGetPendingProjectIdeasService();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pending-project-ideas"],
    queryFn: async () => {
      const { status, data } = await fetchPending({ page: 1, limit: 50 });
      return status === HTTP_CODES_ENUM.OK ? data.data : [];
    },
  });

  const ideas = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ideias de projeto enviadas pela comunidade antes de abrirem para
          interessados
        </p>
        {!isLoading && (
          <Badge variant="outline" className="text-xs">
            {ideas.length} pendente{ideas.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Nenhuma ideia pendente"
          description="Todas as ideias enviadas foram revisadas!"
        />
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => (
            <ProjectIdeaRow
              key={idea.id}
              idea={idea}
              onReviewed={() =>
                queryClient.invalidateQueries({
                  queryKey: ["pending-project-ideas"],
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
