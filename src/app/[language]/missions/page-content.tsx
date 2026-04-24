"use client";

import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGetMissionsService } from "@/services/api/services/missions";
import { Mission } from "@/services/api/types/mission";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "@/components/link";
import {
  Zap,
  Target,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "card" | "list";

function MissionCard({ mission }: { mission: Mission }) {
  const isClosed = mission.status === "CLOSED";
  return (
    <Card className={cn("flex flex-col", isClosed && "opacity-60")}>
      <CardContent className="flex-1 pt-4 pb-2 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {mission.title}
          </h3>
          <Badge
            variant={isClosed ? "secondary" : "default"}
            className="shrink-0 text-xs px-2"
          >
            {isClosed ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Encerrada
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                {mission.xpReward} XP
              </>
            )}
          </Badge>
        </div>
        {mission.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {mission.description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-amber-500">
          <Target className="h-3 w-3" />
          <span>Missão única — apenas um vencedor</span>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-2">
        <Link
          href={`/missions/${mission.id}`}
          className={cn(
            "w-full inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            isClosed
              ? "bg-muted text-muted-foreground cursor-default pointer-events-none"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {isClosed ? "Ver detalhes" : "Participar"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function MissionRow({ mission }: { mission: Mission }) {
  const isClosed = mission.status === "CLOSED";
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors",
        isClosed && "opacity-60"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{mission.title}</p>
        {mission.description && (
          <p className="text-xs text-muted-foreground truncate">
            {mission.description}
          </p>
        )}
      </div>
      <Badge
        variant={isClosed ? "secondary" : "default"}
        className="shrink-0 text-xs"
      >
        {isClosed ? (
          <>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Encerrada
          </>
        ) : (
          <>
            <Zap className="h-3 w-3 mr-1" />
            {mission.xpReward} XP
          </>
        )}
      </Badge>
      <Link
        href={`/missions/${mission.id}`}
        className={cn(
          "shrink-0 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          isClosed
            ? "bg-muted text-muted-foreground cursor-default pointer-events-none"
            : "bg-primary text-primary-foreground hover:opacity-90"
        )}
      >
        {isClosed ? "Ver" : "Participar"}
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export default function MissionsPageContent() {
  const getMissions = useGetMissionsService();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["missions", search],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await getMissions(
          { page: pageParam, limit: 12, search: search || undefined },
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

  const allMissions = useMemo<Mission[]>(
    () => data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [data]
  );

  const open = allMissions.filter((m) => m.status === "OPEN");
  const closed = allMissions.filter((m) => m.status === "CLOSED");
  const isEmpty = !isLoading && open.length === 0 && closed.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Missões
        </h1>
        <p className="text-sm text-muted-foreground">
          Desafios únicos. Apenas uma pessoa pode vencer cada missão.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar missões..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center border border-input rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "card"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
            title="Visualização em cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
            title="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === "card" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted animate-pulse" />
            ))}
          </div>
        )
      ) : isEmpty ? (
        <div className="text-center py-20 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search
              ? "Nenhuma missão encontrada para sua busca."
              : "Nenhuma missão disponível no momento."}
          </p>
          <p className="text-sm mt-1">
            {search ? "" : "Volte em breve para novos desafios."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Abertas ({open.length})
              </h2>
              {viewMode === "card" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {open.map((m) => (
                    <MissionCard key={m.id} mission={m} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border divide-y">
                  {open.map((m) => (
                    <MissionRow key={m.id} mission={m} />
                  ))}
                </div>
              )}
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Encerradas ({closed.length})
              </h2>
              {viewMode === "card" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {closed.map((m) => (
                    <MissionCard key={m.id} mission={m} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border divide-y">
                  {closed.map((m) => (
                    <MissionRow key={m.id} mission={m} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            <ChevronDown
              className={cn("h-4 w-4", isFetchingNextPage && "animate-bounce")}
            />
            {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
