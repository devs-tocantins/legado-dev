"use client";

import { useState, useEffect, useMemo } from "react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSearchParams } from "next/navigation";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { usePostSubmissionService } from "@/services/api/services/submissions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Activity } from "@/services/api/types/activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "@/components/link";
import {
  Zap,
  Clock,
  FileCheck,
  AlignLeft,
  Search,
  Check,
  CheckCircle2,
  RotateCcw,
  ClipboardList,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { cn, getApiError } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLanguage from "@/services/i18n/use-language";
import { useFileUploadService } from "@/services/api/services/files";
import { MarkdownContent, MarkdownEditor } from "@/components/markdown-editor";
import { sanitizeMarkdownInput } from "@/lib/sanitize-markdown";

function NewSubmissionPageContent() {
  const searchParams = useSearchParams();
  const _language = useLanguage();
  const { enqueueSnackbar } = useSnackbar();
  const fetchActivities = useGetActivitiesService();
  const postSubmission = usePostSubmissionService();
  const uploadFile = useFileUploadService();

  const preselectedId = searchParams.get("activityId");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploadedUrl, setProofUploadedUrl] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proofError, setProofError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleProofFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setProofError("O arquivo deve ter no máximo 5 MB.");
      return;
    }

    setProofError("");
    setProofFile(file);
    setUploadingProof(true);
    try {
      const { status, data } = await uploadFile(file);
      if (status === HTTP_CODES_ENUM.CREATED) {
        setProofUploadedUrl(data.file.path);
      } else {
        setProofFile(null);
        setProofError("Erro ao enviar o arquivo. Tente novamente.");
      }
    } catch {
      setProofFile(null);
      setProofError("Erro ao enviar o arquivo. Tente novamente.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofUploadedUrl(null);
    setProofError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    if (selectedActivity.requiresProof && !proofUploadedUrl) {
      setProofError("O comprovante é obrigatório para esta atividade.");
      return;
    }
    setProofError("");
    if (selectedActivity.requiresDescription && !description.trim()) {
      setDescriptionError("A descrição é obrigatória para esta atividade.");
      return;
    }
    setDescriptionError("");
    setSubmitting(true);
    try {
      const { status, data } = await postSubmission({
        activityId: selectedActivity.id,
        proofUrl: proofUploadedUrl ?? undefined,
        description: description.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        setSubmitted(true);
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao enviar submissão."), {
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedActivity(null);
    setProofFile(null);
    setProofUploadedUrl(null);
    setDescription("");
    setSearch("");
    setProofError("");
    setDescriptionError("");
  };

  // Success state
  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-[scale-in_0.3s_ease-out]" />
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold font-heading">
              Contribuição enviada!
            </h2>
            <p className="text-sm text-muted-foreground">
              Sua submissão está aguardando revisão de um moderador.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleReset} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Submeter outra
            </Button>
            <Button render={<Link href="/submissions" />} className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Ver minhas submissões
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                      <div className="max-h-48 overflow-y-auto">
                        <MarkdownContent
                          content={selectedActivity.description}
                          className="text-xs text-muted-foreground"
                        />
                      </div>
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
                  {selectedActivity.requiresDescription && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <AlignLeft className="h-3 w-3" />
                      Requer descrição
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
                            {activity.requiresDescription && (
                              <span className="text-blue-500">
                                Requer descrição
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

        {/* Proof file upload */}
        {selectedActivity && (
          <div className="space-y-1.5">
            <label
              className={cn(
                "text-sm font-medium flex items-center gap-1.5",
                !selectedActivity.requiresProof && "text-muted-foreground"
              )}
            >
              <FileCheck
                className={cn(
                  "h-4 w-4",
                  selectedActivity.requiresProof
                    ? "text-amber-500"
                    : "text-muted-foreground"
                )}
              />
              Comprovante{" "}
              {selectedActivity.requiresProof ? (
                <span className="text-destructive">*</span>
              ) : (
                "(opcional)"
              )}
            </label>
            {proofFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 py-2">
                {uploadingProof ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-4 w-4 shrink-0 text-emerald-500" />
                )}
                <span className="text-sm truncate flex-1">
                  {proofFile.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(proofFile.size / 1024 / 1024).toFixed(1)} MB
                </span>
                {!uploadingProof && (
                  <button
                    type="button"
                    onClick={handleRemoveProof}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-input px-3 py-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5",
                  proofError && "border-destructive"
                )}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Clique para selecionar um arquivo
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG ou GIF · Máx. 5 MB{" "}
                  {!selectedActivity.requiresProof && "(opcional)"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  className="sr-only"
                  onChange={handleProofFileChange}
                />
              </label>
            )}
            {proofError && (
              <p className="text-xs text-destructive">{proofError}</p>
            )}
          </div>
        )}

        {/* Description field */}
        {selectedActivity && (
          <MarkdownEditor
            label={
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  !selectedActivity.requiresDescription &&
                    "text-muted-foreground"
                )}
              >
                <AlignLeft
                  className={cn(
                    "h-4 w-4",
                    selectedActivity.requiresDescription && "text-primary"
                  )}
                />
                Descrição{" "}
                {selectedActivity.requiresDescription ? (
                  <span className="text-destructive">*</span>
                ) : (
                  "(opcional)"
                )}
              </span>
            }
            value={description}
            onChange={(v) => {
              setDescription(sanitizeMarkdownInput(v, 2000));
              setDescriptionError("");
            }}
            placeholder={
              selectedActivity.requiresDescription
                ? "Descreva como realizou esta atividade..."
                : "Adicione contexto ou detalhes sobre sua participação..."
            }
            rows={selectedActivity.requiresDescription ? 5 : 4}
            maxLength={2000}
            error={descriptionError}
          />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            disabled={submitting || uploadingProof || !selectedActivity}
            className="gap-2"
          >
            {submitting ? (
              "Enviando..."
            ) : uploadingProof ? (
              "Enviando arquivo..."
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enviar Submissão
              </>
            )}
          </Button>
          <Link
            href="/submissions"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

export default withPageRequiredAuth(NewSubmissionPageContent);
