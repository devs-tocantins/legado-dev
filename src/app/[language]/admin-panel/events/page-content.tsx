"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import {
  useGetPendingEventsService,
  usePatchReviewEventService,
} from "@/services/api/services/events";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Event, EventModality } from "@/services/api/types/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CalendarDays,
  MapPin,
  Video,
  User,
} from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_MODALITY_LABELS,
  formatEventDate,
} from "@/lib/event-labels";

function ModerationCard({
  event,
  onReviewed,
}: {
  event: Event;
  onReviewed: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const reviewEvent = usePatchReviewEventService();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { status, data } = await reviewEvent({
        id: event.id,
        status: "APPROVED",
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Evento aprovado!", { variant: "success" });
        onReviewed();
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
    if (!rejectionReason.trim()) return;
    setProcessing(true);
    try {
      const { status, data } = await reviewEvent({
        id: event.id,
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Evento rejeitado.", { variant: "success" });
        onReviewed();
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-[17px] font-semibold">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Organizador: {event.organizerId}
          </div>
        </div>
        <Badge className="shrink-0 bg-accent text-accent-foreground">
          Pendente
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>{EVENT_CATEGORY_LABELS[event.category]}</span>
        <span className="flex items-center gap-1">
          {event.modality === EventModality.ONLINE ? (
            <Video className="h-3 w-3" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {EVENT_MODALITY_LABELS[event.modality]}
        </span>
        <span className="flex items-center gap-1 font-mono text-foreground">
          <CalendarDays className="h-3 w-3" />
          {formatEventDate(event.startAt)}
        </span>
      </div>

      <p className="mb-3 text-[13.5px] leading-relaxed text-muted-foreground">
        {event.description}
      </p>

      <div className="mt-3.5 flex gap-2.5 border-t border-border pt-3.5">
        <Button
          className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={handleApprove}
          disabled={processing}
        >
          <CheckCircle2 className="h-4 w-4" />
          Aprovar
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => setRejectOpen((o) => !o)}
          disabled={processing}
        >
          <XCircle className="h-4 w-4" />
          {rejectOpen ? "Cancelar" : "Rejeitar"}
        </Button>
      </div>

      {rejectOpen && (
        <div className="mt-3 flex flex-col gap-2.5 rounded-lg bg-secondary p-3.5">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explique o motivo da rejeição (ex: fora do foco de TI, informações incompletas...)"
            rows={3}
            maxLength={500}
            className="rounded-lg border border-border bg-card px-2.5 py-2 text-[13px] resize-none"
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
              onClick={handleReject}
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

function AdminEventsPageContent() {
  const fetchPending = useGetPendingEventsService();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pending-events", page],
    queryFn: async () => {
      const { status, data } = await fetchPending({ page, limit: 20 });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const events = data?.data ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const handleReviewed = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-events"] });
    refetch();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Moderação
        </p>
        <h1 className="flex items-center gap-2 font-heading text-[28px] font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Fila de eventos pendentes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revise os eventos enviados pela comunidade antes que entrem na agenda
          pública.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum evento pendente no momento 🎉"
        />
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <ModerationCard
              key={event.id}
              event={event}
              onReviewed={handleReviewed}
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
            >
              Anterior
            </Button>
          )}
          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(AdminEventsPageContent, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
