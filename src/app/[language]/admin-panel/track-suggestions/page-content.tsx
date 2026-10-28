"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetTrackSuggestionsService,
  useMarkTrackSuggestionReviewedService,
} from "@/services/api/services/track-suggestions";
import {
  TrackSuggestion,
  TrackSuggestionStatus,
} from "@/services/api/types/track-suggestion";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Lightbulb, Check, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { key: TrackSuggestionStatus | "ALL"; label: string }[] = [
  { key: TrackSuggestionStatus.PENDING, label: "Pendentes" },
  { key: TrackSuggestionStatus.REVIEWED, label: "Vistas" },
  { key: "ALL", label: "Todas" },
];

function SuggestionCard({ suggestion }: { suggestion: TrackSuggestion }) {
  const markReviewed = useMarkTrackSuggestionReviewedService();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const isNewTrack = !suggestion.trackId;

  const handleMarkReviewed = async () => {
    setSaving(true);
    try {
      await markReviewed(suggestion.id);
      await queryClient.invalidateQueries({
        queryKey: ["track-suggestions"],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              isNewTrack
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/10 text-amber-600"
            )}
          >
            {isNewTrack ? (
              <Lightbulb className="h-4.5 w-4.5" />
            ) : (
              <MapIcon className="h-4.5 w-4.5" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold">
              {isNewTrack
                ? `Nova trilha: "${suggestion.title}"`
                : "Melhoria para trilha existente"}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {new Date(suggestion.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
        {suggestion.status === TrackSuggestionStatus.PENDING ? (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={handleMarkReviewed}
            disabled={saving}
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? "..." : "Marcar como vista"}
          </Button>
        ) : (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Vista
          </span>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
        {suggestion.message}
      </p>
    </div>
  );
}

function TrackSuggestionsAdmin() {
  const [tab, setTab] = useState<TrackSuggestionStatus | "ALL">(
    TrackSuggestionStatus.PENDING
  );
  const fetchSuggestions = useGetTrackSuggestionsService();

  const { data, isLoading } = useQuery({
    queryKey: ["track-suggestions", tab],
    queryFn: async () => {
      const { status, data } = await fetchSuggestions({
        page: 1,
        limit: 50,
        status: tab === "ALL" ? undefined : tab,
      });
      return status === HTTP_CODES_ENUM.OK ? data.data : [];
    },
  });

  const suggestions = data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Sugestões de trilha
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sugestões de trilhas novas e melhorias enviadas pela comunidade.
          Trilhas novas continuam sendo criadas por um admin.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition-colors",
              tab === t.key
                ? "border-foreground/20 bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Nenhuma sugestão por aqui"
          description="Quando alguém sugerir uma trilha nova ou uma melhoria, ela aparece aqui."
        />
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(TrackSuggestionsAdmin, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
