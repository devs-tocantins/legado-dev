"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetMyEventsService,
  useCancelEventService,
} from "@/services/api/services/events";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Event, EventStatus } from "@/services/api/types/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { CalendarDays, Pencil, Plus, Ban, XCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_MODALITY_LABELS,
  EVENT_STATUS_LABELS,
  formatEventDate,
  timeRange,
} from "@/lib/event-labels";
import { cn } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";

const STATUS_BADGE_CLASS: Record<EventStatus, string> = {
  [EventStatus.PENDING]: "bg-accent text-accent-foreground",
  [EventStatus.APPROVED]: "bg-primary text-primary-foreground",
  [EventStatus.REJECTED]: "bg-destructive text-destructive-foreground",
  [EventStatus.CANCELLED]: "bg-muted text-muted-foreground",
};

function MyEventRow({
  event,
  onCancel,
}: {
  event: Event;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-4.5 rounded-xl border border-border bg-card p-4">
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
        style={
          event.coverImage
            ? undefined
            : {
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--secondary), var(--secondary) 6px, var(--background) 6px, var(--background) 12px)",
              }
        }
      >
        {event.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImage.path}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 font-heading text-[15px] font-semibold">
          {event.title}
        </h3>
        <div className="flex flex-wrap gap-2.5 text-xs text-muted-foreground">
          <span>{EVENT_CATEGORY_LABELS[event.category]}</span>
          <span>·</span>
          <span>{EVENT_MODALITY_LABELS[event.modality]}</span>
          <span>·</span>
          <span className="font-mono">
            {formatEventDate(event.startAt).split(",")[0]} ·{" "}
            {timeRange(event.startAt, event.endAt)}
          </span>
        </div>
        {event.status === EventStatus.REJECTED && event.rejectionReason && (
          <div className="mt-2 flex gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs">
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
            <span>
              <strong>Motivo da rejeição:</strong> {event.rejectionReason}
            </span>
          </div>
        )}
      </div>
      <Badge className={cn("shrink-0", STATUS_BADGE_CLASS[event.status])}>
        {EVENT_STATUS_LABELS[event.status]}
      </Badge>
      <div className="flex shrink-0 gap-2">
        {event.status === EventStatus.APPROVED && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onCancel(event.id)}
          >
            <Ban className="h-3.5 w-3.5" />
            Cancelar
          </Button>
        )}
        {event.status !== EventStatus.CANCELLED && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            render={<Link href={`/eventos/edit/${event.id}`} />}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}

function MyEventsPageContent() {
  const fetchMyEvents = useGetMyEventsService();
  const cancelEvent = useCancelEventService();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { confirmDialog } = useConfirmDialog();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-events", page],
    queryFn: async () => {
      const { status, data } = await fetchMyEvents({ page, limit: 20 });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const events = useMemo<Event[]>(() => data?.data ?? [], [data]);
  const hasNextPage = data?.hasNextPage ?? false;

  const stats = useMemo(
    () => ({
      total: events.length,
      approved: events.filter((e) => e.status === EventStatus.APPROVED).length,
      pending: events.filter((e) => e.status === EventStatus.PENDING).length,
    }),
    [events]
  );

  const handleCancel = async (id: string) => {
    const isConfirmed = await confirmDialog({
      title: "Cancelar evento",
      message:
        "Tem certeza que deseja cancelar este evento? Quem se inscreveu para receber atualizações será avisado por e-mail.",
    });
    if (!isConfirmed) return;

    const { status, data } = await cancelEvent({ id });
    if (status === HTTP_CODES_ENUM.OK) {
      enqueueSnackbar("Evento cancelado. Quem se inscreveu foi avisado.", {
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      refetch();
    } else {
      enqueueSnackbar("Erro ao cancelar o evento.", { variant: "error" });
      void data;
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
            Sua área
          </p>
          <h1 className="font-heading text-[28px] font-bold tracking-tight">
            Meus eventos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o status dos eventos que você divulgou.
          </p>
        </div>
        <Button className="gap-1.5" render={<Link href="/eventos/new" />}>
          <Plus className="h-3.5 w-3.5" />
          Novo
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-xl border border-border bg-card p-4">
          <div className="font-heading text-2xl font-bold">{stats.total}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Total divulgados
          </div>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card p-4">
          <div className="font-heading text-2xl font-bold">
            {stats.approved}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">Aprovados</div>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card p-4">
          <div className="font-heading text-2xl font-bold">{stats.pending}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Aguardando revisão
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Você ainda não divulgou eventos"
          description="Compartilhe eventos de TI com a comunidade."
          action={{ label: "Divulgar evento", href: "/eventos/new" }}
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <MyEventRow key={event.id} event={event} onCancel={handleCancel} />
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

export default withPageRequiredAuth(MyEventsPageContent);
