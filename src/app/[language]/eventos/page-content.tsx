"use client";

import React, { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGetEventsService } from "@/services/api/services/events";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Event,
  EventCategory,
  EventModality,
} from "@/services/api/types/event";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Video,
  Shuffle,
  Plus,
  ClipboardList,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import useAuth from "@/services/auth/use-auth";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_MODALITY_LABELS,
  dateKey,
  dayNumber,
  monthWeekday,
  timeRange,
} from "@/lib/event-labels";

const MODALITY_ICONS: Record<
  EventModality,
  React.ComponentType<{ className?: string }>
> = {
  [EventModality.ONLINE]: Video,
  [EventModality.PRESENCIAL]: MapPin,
  [EventModality.HIBRIDO]: Shuffle,
};

function EventCard({ event }: { event: Event }) {
  const ModalityIcon = MODALITY_ICONS[event.modality];
  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className="relative h-28"
        style={
          event.coverImage
            ? undefined
            : {
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--secondary), var(--secondary) 10px, var(--background) 10px, var(--background) 20px)",
              }
        }
      >
        {event.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImage.path}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold shadow-sm">
          {EVENT_CATEGORY_LABELS[event.category]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="font-heading text-[15px] font-semibold leading-snug line-clamp-2">
          {event.title}
        </h3>
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ModalityIcon className="h-3.5 w-3.5" />
            {EVENT_MODALITY_LABELS[event.modality]}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {timeRange(event.startAt, event.endAt)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EventsPageContent() {
  const { user } = useAuth();
  const fetch = useGetEventsService();
  const [category, setCategory] = useState<EventCategory | "">("");
  const [modality, setModality] = useState<EventModality | "">("");

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["public-events", category, modality],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await fetch(
          {
            page: pageParam,
            limit: 20,
            filters: {
              category: category || undefined,
              modality: modality || undefined,
            },
          },
          { signal }
        );
        if (status === HTTP_CODES_ENUM.OK) {
          return {
            data: data.data,
            nextPage: data.hasNextPage ? pageParam + 1 : undefined,
          };
        }
        return { data: [], nextPage: undefined };
      },
      getNextPageParam: (lastPage) => lastPage?.nextPage,
      gcTime: 0,
    });

  const allEvents = useMemo<Event[]>(
    () => data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [data]
  );

  const dateGroups = useMemo(() => {
    const groups = new Map<string, Event[]>();
    for (const event of allEvents) {
      const key = dateKey(event.startAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, events]) => ({ key, events }));
  }, [allEvents]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-20">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
            Comunidade legado.dev
          </p>
          <h1 className="font-heading text-[34px] font-bold tracking-tight">
            Agenda Pública de Eventos
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Meetups, workshops, hackathons, palestras e cursos de TI organizados
            pela comunidade — todos revisados por moderadores antes de entrar na
            agenda.
          </p>
        </div>
        <div className="flex gap-2">
          {user && (
            <Button
              variant="outline"
              className="gap-2"
              render={<Link href="/eventos/mine" />}
            >
              <ClipboardList className="h-4 w-4" />
              Meus eventos
            </Button>
          )}
          <Button className="gap-2" render={<Link href="/eventos/new" />}>
            <Plus className="h-4 w-4" />
            Divulgar evento
          </Button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b border-border pb-5">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              category === ""
                ? "border-foreground bg-foreground text-background"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            Todos
          </button>
          {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategory(value as EventCategory)}
              className={cn(
                "rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                category === value
                  ? "border-foreground bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-[9px] border border-border bg-card">
          <button
            onClick={() => setModality("")}
            className={cn(
              "border-r border-border px-3.5 py-2 text-[13px] font-medium last:border-r-0",
              modality === ""
                ? "bg-secondary text-foreground"
                : "text-muted-foreground"
            )}
          >
            Todas
          </button>
          {Object.entries(EVENT_MODALITY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setModality(value as EventModality)}
              className={cn(
                "border-r border-border px-3.5 py-2 text-[13px] font-medium last:border-r-0",
                modality === value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : dateGroups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum evento encontrado"
          description="Novos eventos aparecerão aqui assim que forem aprovados."
        />
      ) : (
        <>
          <div className="flex flex-col gap-9">
            {dateGroups.map((group) => (
              <div
                key={group.key}
                className="grid grid-cols-[48px_1fr] gap-5 sm:grid-cols-[64px_1fr] sm:gap-6"
              >
                <div className="sticky top-20 flex flex-col items-center pt-0.5">
                  <div className="font-heading text-2xl font-bold leading-none sm:text-[26px]">
                    {dayNumber(group.events[0].startAt)}
                  </div>
                  <div className="mt-0.5 text-center font-mono text-[10px] uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                    {monthWeekday(group.events[0].startAt)}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4",
                    isFetchingNextPage && "animate-bounce"
                  )}
                />
                {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EventsPageContent;
