"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useGetEventService,
  useGetEventSubscriptionService,
  useSubscribeEventService,
  useUnsubscribeEventService,
} from "@/services/api/services/events";
import { API_URL } from "@/services/api/config";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { EventModality, EventStatus } from "@/services/api/types/event";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import {
  CalendarDays,
  MapPin,
  Video,
  ArrowLeft,
  ExternalLink,
  CalendarPlus,
  Download,
  BellRing,
  BellOff,
  Ban,
} from "lucide-react";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_MODALITY_LABELS,
  REMINDER_OPTIONS,
  formatEventDate,
} from "@/lib/event-labels";
import { EmptyState } from "@/components/ui/empty-state";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { cn } from "@/lib/utils";

function SubscribeToggle({ eventId }: { eventId: string }) {
  const { user, isLoaded } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const getSubscription = useGetEventSubscriptionService();
  const subscribeEvent = useSubscribeEventService();
  const unsubscribeEvent = useUnsubscribeEventService();
  const [processing, setProcessing] = useState(false);

  const { data: subscribed, refetch } = useQuery({
    queryKey: ["event-subscription", eventId],
    queryFn: async () => {
      const { status, data } = await getSubscription({ id: eventId });
      if (status === HTTP_CODES_ENUM.OK) return data.subscribed;
      return false;
    },
    enabled: !!user,
  });

  if (!isLoaded) return null;

  if (!user) {
    return (
      <div className="rounded-lg bg-secondary p-3.5 text-xs text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-semibold text-primary hover:underline"
        >
          Entre na sua conta
        </Link>{" "}
        para receber avisos se este evento mudar de data, local ou for
        cancelado.
      </div>
    );
  }

  const handleToggle = async () => {
    setProcessing(true);
    try {
      if (subscribed) {
        await unsubscribeEvent({ id: eventId });
        enqueueSnackbar("Você não receberá mais avisos sobre este evento.", {
          variant: "success",
        });
      } else {
        await subscribeEvent({ id: eventId });
        enqueueSnackbar("Combinado! Você será avisado sobre mudanças.", {
          variant: "success",
        });
      }
      refetch();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-lg bg-secondary p-3.5">
      <label className="flex cursor-pointer items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={!!subscribed}
          onClick={handleToggle}
          disabled={processing}
          className={cn(
            "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
            subscribed ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              subscribed ? "translate-x-4.5 left-0.5" : "left-0.5"
            )}
          />
        </button>
        <span className="text-sm">
          <span className="flex items-center gap-1.5 font-semibold">
            {subscribed ? (
              <BellRing className="h-3.5 w-3.5 text-primary" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            Deseja receber atualizações sobre esse evento?
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Avisamos por e-mail se o evento mudar de data, local ou for
            cancelado.
          </span>
        </span>
      </label>
    </div>
  );
}

function EventDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const fetchEvent = useGetEventService();
  const [reminderMinutes, setReminderMinutes] = useState(60);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { status, data } = await fetchEvent({ id });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={CalendarDays}
          title="Evento não encontrado"
          description="Este evento não existe ou ainda não foi aprovado."
          action={{ label: "Voltar para a agenda", href: "/eventos" }}
        />
      </div>
    );
  }

  const isCancelled = event.status === EventStatus.CANCELLED;
  const icsUrl = `${API_URL}/api/v1/events/${event.id}/ics?reminderMinutes=${reminderMinutes}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/eventos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para a agenda
      </Link>

      {isCancelled && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <Ban className="h-4 w-4 shrink-0" />
          Este evento foi cancelado pelo organizador.
        </div>
      )}

      <div
        className="mb-7 h-56 rounded-[var(--radius)] sm:h-72"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--secondary), var(--secondary) 14px, var(--background) 14px, var(--background) 28px)",
        }}
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-3.5 flex flex-wrap gap-2">
            <Badge variant="secondary">
              {EVENT_CATEGORY_LABELS[event.category]}
            </Badge>
            <Badge variant="secondary">
              {EVENT_MODALITY_LABELS[event.modality]}
            </Badge>
          </div>
          <h1 className="mb-5 font-heading text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
            {event.title}
          </h1>

          <div className="mb-7 flex flex-col gap-3.5 border-y border-border py-4.5">
            <div className="flex items-start gap-3 text-sm">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <div className="font-mono text-sm font-semibold">
                  {formatEventDate(event.startAt)}
                  {event.endAt ? ` — ${formatEventDate(event.endAt)}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              {event.modality === EventModality.ONLINE ? (
                <Video className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                {event.modality === EventModality.ONLINE ? (
                  event.onlineUrl && (
                    <a
                      href={event.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline break-all"
                    >
                      {event.onlineUrl}
                    </a>
                  )
                ) : (
                  <span className="font-medium">{event.location}</span>
                )}
              </div>
            </div>
            {event.externalUrl && (
              <div className="flex items-start gap-3 text-sm">
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  Página oficial / inscrição
                </a>
              </div>
            )}
          </div>

          <div className="text-[15px] leading-relaxed whitespace-pre-line">
            {event.description}
          </div>
        </div>

        <div className="sticky top-24 h-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
            Adicionar à sua agenda
          </p>

          {isCancelled ? (
            <p className="text-sm text-muted-foreground">
              Este evento foi cancelado — não é mais possível adicioná-lo à
              agenda.
            </p>
          ) : (
            <>
              <Button
                className="w-full gap-2"
                render={
                  <a
                    href={event.googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <CalendarPlus className="h-4 w-4" />
                Adicionar ao Google Calendar
              </Button>

              <div className="my-4 rounded-lg bg-secondary p-3.5">
                <label className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Lembrete antes do evento
                </label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-sm"
                >
                  {REMINDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                render={<a href={icsUrl} />}
              >
                <Download className="h-4 w-4" />
                Baixar arquivo .ics
              </Button>
            </>
          )}

          <div className="my-4 h-px bg-border" />

          <SubscribeToggle eventId={event.id} />
        </div>
      </div>
    </div>
  );
}

export default EventDetailPageContent;
