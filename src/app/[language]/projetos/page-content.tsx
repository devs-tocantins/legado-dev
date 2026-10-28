"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  useGetProjectIdeasService,
  useGetProjectTeamsService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  ProjectIdea,
  ProjectTeam,
  ProjectTeamStatus,
} from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList, Lightbulb, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuth from "@/services/auth/use-auth";
import { PROJECT_TEAM_STATUS_LABELS } from "@/lib/project-labels";
import { IdeaCard, TeamCard } from "./project-components";

type Tab = "ideias" | "times";

const TABS: Record<Tab, { label: string; icon: typeof Lightbulb }> = {
  ideias: { label: "Ideias", icon: Lightbulb },
  times: { label: "Times", icon: Users },
};

function CardSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

function LoadMore({
  hasNextPage,
  fetching,
  onClick,
}: {
  hasNextPage: boolean;
  fetching: boolean;
  onClick: () => void;
}) {
  if (!hasNextPage) return null;
  return (
    <div className="mt-6 flex justify-center">
      <Button variant="outline" onClick={onClick} disabled={fetching}>
        {fetching ? "Carregando..." : "Carregar mais"}
      </Button>
    </div>
  );
}

function IdeasList() {
  const fetchIdeas = useGetProjectIdeasService();

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["public-project-ideas"],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await fetchIdeas(
          { page: pageParam, limit: 12 },
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

  const ideas = useMemo<ProjectIdea[]>(
    () => data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [data]
  );

  if (isLoading) return <CardSkeletons />;
  if (ideas.length === 0) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Nenhuma ideia publicada ainda"
        description="Seja a primeira pessoa a propor um projeto para a comunidade."
        action={{ label: "Propor ideia", href: "/projetos/new" }}
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
      <LoadMore
        hasNextPage={!!hasNextPage}
        fetching={isFetchingNextPage}
        onClick={() => fetchNextPage()}
      />
    </>
  );
}

function TeamsList() {
  const fetchTeams = useGetProjectTeamsService();
  const [statusFilter, setStatusFilter] = useState<ProjectTeamStatus | "">(
    ProjectTeamStatus.RECRUITING
  );

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["public-project-teams", statusFilter],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await fetchTeams(
          {
            page: pageParam,
            limit: 12,
            status: statusFilter || undefined,
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

  const teams = useMemo<ProjectTeam[]>(
    () => data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [data]
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {(["", ...Object.values(ProjectTeamStatus)] as const).map((value) => (
          <button
            key={value || "all"}
            onClick={() => setStatusFilter(value)}
            className={cn(
              "rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              statusFilter === value
                ? "border-foreground bg-foreground text-background"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {value ? PROJECT_TEAM_STATUS_LABELS[value] : "Todos"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <CardSkeletons />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum time por aqui"
          description="Times são montados a partir de ideias aprovadas. Demonstre interesse em uma ideia para participar."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
          <LoadMore
            hasNextPage={!!hasNextPage}
            fetching={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          />
        </>
      )}
    </>
  );
}

function ProjectsPageContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("ideias");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-20">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
            Comunidade legado.dev
          </p>
          <h1 className="font-heading text-[34px] font-bold tracking-tight">
            Projetos da comunidade
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Proponha uma ideia, veja quem quer participar e monte um time com as
            pessoas certas para cada cargo.
          </p>
        </div>
        <div className="flex gap-2">
          {user && (
            <Button
              variant="outline"
              className="gap-2"
              render={<Link href="/projetos/mine" />}
            >
              <ClipboardList className="h-4 w-4" />
              Meus projetos
            </Button>
          )}
          <Button className="gap-2" render={<Link href="/projetos/new" />}>
            <Plus className="h-4 w-4 shrink-0" />
            Propor ideia
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border">
        {(Object.keys(TABS) as Tab[]).map((key) => {
          const { label, icon: Icon } = TABS[key];
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors -mb-px",
                tab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      {tab === "ideias" ? <IdeasList /> : <TeamsList />}
    </div>
  );
}

export default ProjectsPageContent;
