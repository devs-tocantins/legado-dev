"use client";

import { useState, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { useGetMissionsService } from "@/services/api/services/missions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Activity } from "@/services/api/types/activity";
import { Mission } from "@/services/api/types/mission";
import { getTrackColor } from "@/lib/track-colors";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import {
  Zap,
  Clock,
  FileCheck,
  Search,
  Lock,
  ChevronDown,
  HeartHandshake,
  Sparkles,
  Target,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

type SubTab = "atividades" | "missoes";

function formatRewardLabel(activity: Activity): string {
  if (activity.effortTiers && activity.effortTiers.length > 0) {
    const xps = activity.effortTiers.map((t) => t.xp);
    return `${Math.min(...xps)}–${Math.max(...xps)}`;
  }
  return `${activity.fixedReward}`;
}

// ─── Cartão base (hard-shadow, mesma linguagem visual da Trilhas) ──────────

function HardShadowCard({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const color = getTrackColor(id);
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_5px_0_var(--card-shadow)] transition-all hover:-translate-y-[2px] hover:shadow-[0_7px_0_var(--card-shadow)]",
        className
      )}
      style={
        {
          "--card-shadow": "var(--border)",
          "--accent-bg": color.bg,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

function XpPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 font-mono text-[11px] font-bold text-accent">
      <Zap className="h-3 w-3" />
      {children}
    </span>
  );
}

function MetaTag({
  icon: Icon,
  children,
  tone = "muted",
}: {
  icon: typeof Clock;
  children: React.ReactNode;
  tone?: "muted" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide",
        tone === "warning"
          ? "bg-amber-500/10 text-amber-600"
          : "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function FreeformActivityCard({ activity }: { activity: Activity }) {
  return (
    <HardShadowCard id={activity.id} className="border-primary/40">
      <div
        className="relative h-[52px] shrink-0"
        style={{ background: "var(--accent-bg)" }}
      >
        <span className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-primary shadow-sm">
          <Sparkles className="h-3 w-3" />
          Atividade livre
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold leading-snug">
            {activity.title}
          </h3>
          <XpPill>{formatRewardLabel(activity)} XP</XpPill>
        </div>
        <p className="flex-1 text-[13px] leading-relaxed text-muted-foreground">
          Fez uma contribuição voluntária que não está no catálogo? Conte pra
          gente, escolha a faixa de esforço e envie.
        </p>
        <Button
          size="sm"
          className="mt-2 w-full gap-1.5 rounded-xl font-bold shadow-[0_3px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.2)]"
          render={<Link href={`/submissions/new?activityId=${activity.id}`} />}
        >
          Registrar atividade
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </HardShadowCard>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <HardShadowCard id={activity.id}>
      <div
        className="relative h-[52px] shrink-0"
        style={{ background: "var(--accent-bg)" }}
      >
        <span className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold shadow-sm">
          ◆ Atividade
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold leading-snug line-clamp-2">
            {activity.title}
          </h3>
          <XpPill>{formatRewardLabel(activity)} XP</XpPill>
        </div>
        {activity.description && (
          <p className="text-[13px] text-muted-foreground line-clamp-2">
            {activity.description.replace(/[#*`_>~\[\]]/g, "").trim()}
          </p>
        )}
        <div className="flex flex-1 flex-wrap items-end gap-1.5 pt-1">
          {activity.cooldownHours > 0 && (
            <MetaTag icon={Clock}>{activity.cooldownHours}h cooldown</MetaTag>
          )}
          {activity.requiresProof && (
            <MetaTag icon={FileCheck} tone="warning">
              Requer comprovante
            </MetaTag>
          )}
          {activity.isHidden && <MetaTag icon={Lock}>Secreta</MetaTag>}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-xl font-bold"
          render={<Link href={`/submissions/new?activityId=${activity.id}`} />}
        >
          Submeter
        </Button>
      </div>
    </HardShadowCard>
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
          className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-[20px] bg-muted"
            />
          ))}
        </div>
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
                className="gap-2 rounded-xl"
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
    <HardShadowCard
      id={mission.id}
      className={cn(
        isClosed &&
          "opacity-70 hover:translate-y-0 hover:shadow-[0_5px_0_var(--card-shadow)]"
      )}
    >
      <div
        className="relative h-[52px] shrink-0"
        style={{
          background: isClosed ? "var(--muted-foreground)" : "var(--accent-bg)",
        }}
      >
        <span className="absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold shadow-sm">
          <Target className="h-3 w-3" />
          Missão
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-bold leading-snug line-clamp-2">
            {mission.title}
          </h3>
          {isClosed ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 font-mono text-[11px] font-bold text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              Encerrada
            </span>
          ) : (
            <XpPill>{mission.xpReward} XP</XpPill>
          )}
        </div>
        {mission.description && (
          <p className="text-[13px] text-muted-foreground line-clamp-2">
            {mission.description}
          </p>
        )}
        <p className="flex-1 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-600">
          Missão única — apenas um vencedor
        </p>
        <Button
          size="sm"
          variant={isClosed ? "outline" : "default"}
          disabled={isClosed}
          className="w-full gap-1.5 rounded-xl font-bold"
          render={
            isClosed ? undefined : <Link href={`/missions/${mission.id}`} />
          }
        >
          {isClosed ? "Ver detalhes" : "Participar"}
          {!isClosed && <ArrowRight className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </HardShadowCard>
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
          className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-[20px] bg-muted"
            />
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
              <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
              <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
            className="gap-2 rounded-xl"
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
    <div className="mx-auto max-w-6xl px-4 py-8 pb-20 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="flex items-center gap-2.5 text-[28px] font-bold tracking-tight">
          <HeartHandshake className="h-7 w-7 text-primary" />
          Voluntariado
        </h1>
        <p className="text-sm text-muted-foreground">
          Toda contribuição voluntária pra comunidade vale XP — de atividades do
          catálogo a desafios únicos em missões.
        </p>
      </div>

      <div className="inline-flex gap-1 rounded-2xl bg-muted p-1">
        {(Object.keys(SUB_TAB_CONFIG) as SubTab[]).map((t) => {
          const { label, icon: Icon } = SUB_TAB_CONFIG[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                tab === t
                  ? "bg-card text-foreground shadow-[0_2px_0_var(--border)]"
                  : "text-muted-foreground hover:text-foreground"
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
