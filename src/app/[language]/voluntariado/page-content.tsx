"use client";

import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { useGetMissionsService } from "@/services/api/services/missions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Activity } from "@/services/api/types/activity";
import { Mission } from "@/services/api/types/mission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "@/components/link";
import {
  Zap,
  Clock,
  FileCheck,
  Search,
  Lock,
  ChevronDown,
  ChevronRight,
  HeartHandshake,
  Sparkles,
  Target,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonActivityGrid } from "@/components/ui/skeleton-patterns";

type SubTab = "atividades" | "missoes";

function formatRewardLabel(activity: Activity): string {
  if (activity.effortTiers && activity.effortTiers.length > 0) {
    const xps = activity.effortTiers.map((t) => t.xp);
    return `${Math.min(...xps)}–${Math.max(...xps)}`;
  }
  return `${activity.fixedReward}`;
}

function FreeformActivityCard({ activity }: { activity: Activity }) {
  return (
    <Card className="flex flex-col border-2 border-primary/30 bg-primary/[0.03]">
      <CardContent className="flex-1 pt-4 pb-2 px-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <h3 className="font-semibold text-sm leading-snug">
              {activity.title}
            </h3>
          </div>
          <Badge className="shrink-0 text-xs px-2">
            <Zap className="h-3 w-3 mr-1" />
            <span className="font-mono">{formatRewardLabel(activity)}</span>
            &nbsp;XP
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Fez uma contribuição voluntária que não está no catálogo? Conte pra
          gente, escolha a faixa de esforço e envie.
        </p>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-2">
        <Button
          size="sm"
          className="w-full"
          render={<Link href={`/submissions/new?activityId=${activity.id}`} />}
        >
          Registrar atividade
        </Button>
      </CardFooter>
    </Card>
  );
}

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
            <span className="font-mono">{formatRewardLabel(activity)}</span>
            &nbsp;XP
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
          variant="outline"
          className="w-full"
          render={<Link href={`/submissions/new?activityId=${activity.id}`} />}
        >
          Submeter
        </Button>
      </CardFooter>
    </Card>
  );
}

function AtividadesTab() {
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

  const freeformActivity = allActivities.find((a) => a.isFreeform);
  const catalogActivities = allActivities.filter((a) => !a.isFreeform);

  const filtered = useMemo(() => {
    if (!search.trim()) return catalogActivities;
    const q = search.toLowerCase();
    return catalogActivities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
    );
  }, [catalogActivities, search]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar atividades..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <SkeletonActivityGrid count={6} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!search && freeformActivity && (
              <FreeformActivityCard activity={freeformActivity} />
            )}
            {filtered.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {filtered.length === 0 && (!freeformActivity || !!search) && (
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
          )}

          {hasNextPage && !search && (
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
                <span className="font-mono">{mission.xpReward}</span>&nbsp;XP
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
              : "border border-input hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {isClosed ? "Ver detalhes" : "Participar"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function MissoesTab() {
  const getMissions = useGetMissionsService();
  const [search, setSearch] = useState("");

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
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar missões..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Target}
          title={
            search
              ? "Nenhuma missão encontrada"
              : "Nenhuma missão disponível no momento"
          }
          description={search ? "" : "Volte em breve para novos desafios."}
        />
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Abertas ({open.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {open.map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Encerradas ({closed.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {closed.map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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

const SUB_TAB_CONFIG: Record<
  SubTab,
  { label: string; icon: typeof HeartHandshake }
> = {
  atividades: { label: "Atividades", icon: Zap },
  missoes: { label: "Missões", icon: Target },
};

function VoluntariadoPageContent() {
  const [tab, setTab] = useState<SubTab>("atividades");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-primary" />
          Voluntariado
        </h1>
        <p className="text-sm text-muted-foreground">
          Toda contribuição voluntária pra comunidade vale XP — de atividades do
          catálogo a desafios únicos em missões.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(Object.keys(SUB_TAB_CONFIG) as SubTab[]).map((t) => {
          const { label, icon: Icon } = SUB_TAB_CONFIG[t];
          return (
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
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          );
        })}
      </div>

      {tab === "atividades" ? <AtividadesTab /> : <MissoesTab />}
    </div>
  );
}

export default VoluntariadoPageContent;
