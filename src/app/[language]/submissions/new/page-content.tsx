"use client";

import { useState, useEffect, useMemo } from "react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { usePostSubmissionService } from "@/services/api/services/submissions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Activity } from "@/services/api/types/activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "@/components/link";
import { Zap, Clock, FileCheck, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLanguage from "@/services/i18n/use-language";

function NewSubmissionPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const fetchActivities = useGetActivitiesService();
  const postSubmission = usePostSubmissionService();

  const preselectedId = searchParams.get("activityId");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [proofUrl, setProofUrl] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proofError, setProofError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingActivities(true);
      try {
        const { status, data } = await fetchActivities({ page: 1, limit: 100 });
        if (!cancelled && status === HTTP_CODES_ENUM.OK) {
          setActivities(data.data);
          if (preselectedId) {
            const found = data.data.find((a) => a.id === preselectedId);
            if (found) setSelectedActivity(found);
          }
        }
      } finally {
        if (!cancelled) setLoadingActivities(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [preselectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!search.trim()) return activities;
    const q = search.toLowerCase();
    return activities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
    );
  }, [activities, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    if (selectedActivity.requiresProof && !proofUrl.trim()) {
      setProofError("O comprovante é obrigatório para esta atividade.");
      return;
    }
    setProofError("");
    setSubmitting(true);
    try {
      const { status } = await postSubmission({
        activityId: selectedActivity.id,
        proofUrl: proofUrl.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Submissão enviada com sucesso!", {
          variant: "success",
        });
        router.push(`/${language}/submissions`);
      } else if (status === HTTP_CODES_ENUM.BAD_REQUEST) {
        enqueueSnackbar("Você precisa aguardar o cooldown desta atividade.", {
          variant: "error",
        });
      } else {
        enqueueSnackbar("Erro ao enviar submissão.", { variant: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Submissão</h1>
        <p className="text-sm text-muted-foreground">
          Selecione a atividade que você realizou e ganhe XP
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Activity selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedActivity
                ? "Atividade Selecionada"
                : "Selecione uma Atividade"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedActivity ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      {selectedActivity.title}
                    </p>
                    {selectedActivity.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {selectedActivity.description}
                      </p>
                    )}
                  </div>
                  <Badge className="shrink-0">
                    <Zap className="h-3 w-3 mr-1" />
                    {selectedActivity.fixedReward} XP
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {selectedActivity.cooldownHours > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedActivity.cooldownHours}h cooldown
                    </span>
                  )}
                  {selectedActivity.requiresProof && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <FileCheck className="h-3 w-3" />
                      Requer comprovante
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="text-xs text-muted-foreground hover:text-primary underline"
                >
                  Trocar atividade
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar atividade..."
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {loadingActivities ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 bg-muted animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {filtered.map((activity) => (
                      <button
                        key={activity.id}
                        type="button"
                        onClick={() => setSelectedActivity(activity)}
                        className="w-full flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {activity.title}
                          </p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {activity.requiresProof && (
                              <span className="text-amber-500">
                                Requer comprovante
                              </span>
                            )}
                            {activity.cooldownHours > 0 && (
                              <span>{activity.cooldownHours}h cooldown</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {activity.fixedReward} XP
                        </Badge>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Nenhuma atividade encontrada.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proof URL (conditional) */}
        {selectedActivity?.requiresProof && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-amber-500" />
              URL do Comprovante <span className="text-destructive">*</span>
            </label>
            <input
              value={proofUrl}
              onChange={(e) => {
                setProofUrl(e.target.value);
                setProofError("");
              }}
              placeholder="https://github.com/... ou link do comprovante"
              className={cn(
                "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all",
                proofError && "border-destructive focus:ring-destructive/30"
              )}
            />
            {proofError && (
              <p className="text-xs text-destructive">{proofError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Cole o link que comprova sua participação (PR, post, repositório,
              etc.)
            </p>
          </div>
        )}

        {/* Optional proof for activities that don't require it */}
        {selectedActivity && !selectedActivity.requiresProof && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              URL do Comprovante (opcional)
            </label>
            <input
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://... (opcional)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            disabled={submitting || !selectedActivity}
            className="gap-2"
          >
            {submitting ? (
              "Enviando..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enviar Submissão
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link href="/submissions" />}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

export default withPageRequiredAuth(NewSubmissionPageContent);
