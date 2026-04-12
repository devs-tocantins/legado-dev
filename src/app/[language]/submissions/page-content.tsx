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
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import {
  Plus,
  ExternalLink,
  ChevronDown,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

type StatusFilter = "ALL" | SubmissionStatusEnum;

const STATUS_META: Record<
  SubmissionStatusEnum,
  { icon: React.ElementType; color: string; label: string }
> = {
  [SubmissionStatusEnum.APPROVED]: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    label: "Aprovado",
  },
  [SubmissionStatusEnum.PENDING]: {
    icon: Clock,
    color: "text-amber-500",
    label: "Aguardando revisão",
  },
  [SubmissionStatusEnum.REJECTED]: {
    icon: XCircle,
    color: "text-destructive",
    label: "Rejeitado",
  },
};

function SubmissionRow({
  sub,
  activityTitle,
}: {
  sub: Submission;
  activityTitle?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[sub.status];
  const Icon = meta.icon;
  const isRejected = sub.status === SubmissionStatusEnum.REJECTED;

  return (
    <div className="flex flex-col gap-0 py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {activityTitle ?? (
              <span className="font-mono text-xs text-muted-foreground">
                {sub.activityId.substring(0, 8)}…
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-xs", meta.color)}>{meta.label}</span>
            {sub.status === SubmissionStatusEnum.APPROVED && (
              <span className="text-xs font-semibold font-mono text-emerald-500">
                +{sub.awardedXp} XP
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {sub.proofUrl && (
            <a
              href={sub.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Ver comprovante"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {isRejected && sub.feedback && (
            <button
              type="button"
              onClick={() => setExpanded((o) => !o)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Ver feedback"
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  expanded && "rotate-90"
                )}
              />
            </button>
          )}
        </div>
      </div>
      {isRejected && sub.feedback && expanded && (
        <div className="ml-7 mt-2 text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded px-3 py-2">
          <span className="font-medium">Feedback:</span> {sub.feedback}
        </div>
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

  const allSubmissions = useMemo<Submission[]>(
    () => data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [data]
  );

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
              <div key={i} className="animate-pulse py-3 px-4 flex gap-3">
                <div className="h-4 w-4 bg-muted rounded-full mt-0.5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-40" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={
              statusFilter === "ALL"
                ? "Nenhuma submissão ainda"
                : "Nenhuma submissão com esse filtro"
            }
            description={
              statusFilter === "ALL"
                ? "Comece submetendo uma atividade e ganhe XP!"
                : undefined
            }
            action={
              statusFilter === "ALL"
                ? { label: "Ver atividades", href: "/activities" }
                : undefined
            }
          />
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
