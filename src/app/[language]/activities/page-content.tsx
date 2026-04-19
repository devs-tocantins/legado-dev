"use client";

import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGetActivitiesService } from "@/services/api/services/activities";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Activity } from "@/services/api/types/activity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "@/components/link";
import { Zap, Clock, FileCheck, Search, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonActivityGrid } from "@/components/ui/skeleton-patterns";

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 pt-4 pb-2 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {activity.title}
          </h3>
          <Badge className="shrink-0 text-xs px-2">
            <Zap className="h-3 w-3 mr-1" />
            {activity.fixedReward} XP
          </Badge>
        </div>

        {activity.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {activity.description.replace(/[#*`_>~\[\]]/g, "").trim()}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {activity.cooldownHours > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {activity.cooldownHours}h cooldown
            </span>
          )}
          {activity.requiresProof && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <FileCheck className="h-3 w-3" />
              Requer comprovante
            </span>
          )}
          {activity.isHidden && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Secreta
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-2">
        <Button
          size="sm"
          className="w-full"
          render={<Link href={`/submissions/new?activityId=${activity.id}`} />}
        >
          Submeter
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActivitiesPageContent() {
  const fetch = useGetActivitiesService();
  const [search, setSearch] = useState("");

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["public-activities"],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await fetch(
          { page: pageParam, limit: 20 },
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

  const allActivities = useMemo<Activity[]>(
    () => data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [data]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allActivities;
    const q = search.toLowerCase();
    return allActivities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
    );
  }, [allActivities, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Catálogo de Atividades
        </h1>
        <p className="text-sm text-muted-foreground">
          Participe da comunidade, complete atividades e ganhe XP
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atividades..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <SkeletonActivityGrid count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Zap}
          title={
            search
              ? "Nenhuma atividade encontrada"
              : "Nenhuma atividade disponível"
          }
          description={
            search
              ? `Sua busca por "${search}" não retornou resultados.`
              : "Novas atividades serão adicionadas em breve."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
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

export default ActivitiesPageContent;
