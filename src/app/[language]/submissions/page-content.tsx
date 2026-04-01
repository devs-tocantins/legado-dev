"use client";

import { useState, useMemo } from "react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useGetMySubmissionsService } from "@/services/api/services/submissions";
import { useGetActivitiesService } from "@/services/api/services/activities";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Submission,
  SubmissionStatusEnum,
} from "@/services/api/types/submission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import {
  Plus,
  ExternalLink,
  ChevronDown,
  ClipboardList,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | SubmissionStatusEnum;

function StatusBadge({ status }: { status: SubmissionStatusEnum }) {
  if (status === SubmissionStatusEnum.APPROVED)
    return <Badge className="text-xs">Aprovado</Badge>;
  if (status === SubmissionStatusEnum.REJECTED)
    return (
      <Badge variant="destructive" className="text-xs">
        Rejeitado
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-xs">
      Pendente
    </Badge>
  );
}

function SubmissionRow({
  sub,
  activityTitle,
}: {
  sub: Submission;
  activityTitle?: string;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">
            {activityTitle ?? (
              <span className="font-mono text-xs text-muted-foreground">
                {sub.activityId.substring(0, 8)}…
              </span>
            )}
          </span>
          {sub.proofUrl && (
            <a
              href={sub.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Ver comprovante"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {sub.status === SubmissionStatusEnum.APPROVED && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-500">
              <Zap className="h-3 w-3" />+{sub.awardedXp} XP
            </span>
          )}
          <StatusBadge status={sub.status} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
      {sub.status === SubmissionStatusEnum.REJECTED && sub.feedback && (
        <p className="text-xs text-destructive bg-destructive/5 rounded px-2 py-1">
          {sub.feedback}
        </p>
      )}
    </div>
  );
}

const FILTER_LABELS: Record<StatusFilter, string> = {
  ALL: "Todas",
  PENDING: "Pendentes",
  APPROVED: "Aprovadas",
  REJECTED: "Rejeitadas",
};

function SubmissionsPageContent() {
  const fetch = useGetMySubmissionsService();
  const fetchActivities = useGetActivitiesService();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { data: activitiesData } = useQuery({
    queryKey: ["activities-map"],
    queryFn: async () => {
      const { status, data } = await fetchActivities({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activityMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of activitiesData ?? []) {
      map.set(a.id, a.title);
    }
    return map;
  }, [activitiesData]);

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["my-submissions"],
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

  const allSubmissions: Submission[] =
    data?.pages.flatMap((p) => p?.data ?? []) ?? [];

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return allSubmissions;
    return allSubmissions.filter((s) => s.status === statusFilter);
  }, [allSubmissions, statusFilter]);

  const counts = useMemo(
    () => ({
      ALL: allSubmissions.length,
      PENDING: allSubmissions.filter(
        (s) => s.status === SubmissionStatusEnum.PENDING
      ).length,
      APPROVED: allSubmissions.filter(
        (s) => s.status === SubmissionStatusEnum.APPROVED
      ).length,
      REJECTED: allSubmissions.filter(
        (s) => s.status === SubmissionStatusEnum.REJECTED
      ).length,
    }),
    [allSubmissions]
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Minhas Submissões
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status das suas contribuições
          </p>
        </div>
        <Button
          render={<Link href="/submissions/new" />}
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nova
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              statusFilter === key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {FILTER_LABELS[key]}
            <span className="ml-1.5 text-xs opacity-60">({counts[key]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse py-3 px-4 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-5 bg-muted rounded w-16" />
                </div>
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground text-sm">
              {statusFilter === "ALL"
                ? "Nenhuma submissão ainda. Comece submetendo uma atividade!"
                : "Nenhuma submissão com esse filtro."}
            </p>
            {statusFilter === "ALL" && (
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/activities" />}
              >
                Ver atividades
              </Button>
            )}
          </div>
        ) : (
          <div className="px-4">
            {filtered.map((sub) => (
              <SubmissionRow
                key={sub.id}
                sub={sub}
                activityTitle={activityMap.get(sub.activityId)}
              />
            ))}
          </div>
        )}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
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

export default withPageRequiredAuth(SubmissionsPageContent);
