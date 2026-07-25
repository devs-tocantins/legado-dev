"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useGetMissionService,
  useGetMyMissionSubmissionService,
  useGetMissionParticipantsService,
  useSubmitMissionService,
} from "@/services/api/services/missions";
import { useFileUploadService } from "@/services/api/services/files";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "@/components/link";
import {
  Zap,
  Target,
  CheckCircle2,
  ArrowLeft,
  Trophy,
  Users,
  Clock,
} from "lucide-react";
import { getApiError } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { MarkdownContent, MarkdownEditor } from "@/components/markdown-editor";
import { sanitizeMarkdownInput } from "@/lib/sanitize-markdown";
import { FileUploadDropzone } from "@/components/file-upload-dropzone";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function MissionDetailPageContent() {
  const params = useParams();
  const id = params.id as string;
  const { enqueueSnackbar } = useSnackbar();

  const getMission = useGetMissionService();
  const getMySubmission = useGetMyMissionSubmissionService();
  const getParticipants = useGetMissionParticipantsService();
  const submitMission = useSubmitMissionService();
  const uploadFile = useFileUploadService();

  const { data: mission, isLoading } = useQuery({
    queryKey: ["mission", id],
    queryFn: async () => {
      const { status, data } = await getMission(id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const { data: mySubmission, refetch: refetchSubmission } = useQuery({
    queryKey: ["my-mission-submission", id],
    queryFn: async () => {
      const { status, data } = await getMySubmission(id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const { data: participantsData } = useQuery({
    queryKey: ["mission-participants", id],
    queryFn: async () => {
      const { status, data } = await getParticipants(id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const processFileSelect = async (file: File) => {
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
        setProofUrl(data.file.path);
      } else {
        setProofFile(null);
        setProofError("Erro ao enviar o arquivo. Tente novamente.");
      }
    } catch {
      setProofFile(null);
      setProofError("Erro ao enviar o arquivo.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !proofUrl) {
      setProofError("Envie um comprovante ou escreva uma descrição.");
      return;
    }
    setSubmitting(true);
    try {
      const { status, data } = await submitMission(id, {
        proofUrl: proofUrl ?? undefined,
        description: description.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Submissão enviada! Aguarde a revisão.", {
          variant: "success",
        });
        refetchSubmission();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao submeter."), {
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-muted-foreground">Missão não encontrada.</p>
        <Link
          href="/missions"
          className="text-primary text-sm hover:underline mt-2 block"
        >
          ← Voltar para Missões
        </Link>
      </div>
    );
  }

  const isClosed = mission.status === "CLOSED";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Missões
      </Link>

      {/* Mission header */}
      <Card>
        <CardContent className="pt-5 pb-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              {mission.title}
            </h1>
            <Badge
              variant={isClosed ? "secondary" : "default"}
              className="shrink-0"
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
            <MarkdownContent
              content={mission.description}
              className="text-sm text-muted-foreground"
            />
          )}

          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
            <Target className="h-3.5 w-3.5" />
            Missão única — apenas um vencedor recebe os {mission.xpReward} XP
          </div>

          {mission.requirements && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Requisitos para aprovação
              </p>
              <MarkdownContent
                content={mission.requirements}
                className="text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Winner banner */}
      {isClosed && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Esta missão já foi conquistada por alguém. Fique de olho nas
            próximas!
          </p>
        </div>
      )}

      {/* Participants */}
      {participantsData !== null && participantsData !== undefined && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">
                Participantes ({participantsData.count})
              </p>
            </div>
            {participantsData.count === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma participação ainda. Seja o primeiro!
              </p>
            ) : (
              <ul className="space-y-1.5">
                {participantsData.participants.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-foreground">
                      @{p.username}
                    </span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className={
                          p.status === "APPROVED"
                            ? "text-emerald-500 font-medium"
                            : p.status === "REJECTED"
                              ? "text-destructive"
                              : "text-yellow-600"
                        }
                      >
                        {p.status === "APPROVED"
                          ? "Aprovada"
                          : p.status === "REJECTED"
                            ? "Rejeitada"
                            : "Pendente"}
                      </span>
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>
                        {new Date(p.submittedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* My submission status */}
      {mySubmission && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-1">
            <p className="text-sm font-semibold">Sua submissão</p>
            <div className="flex items-center gap-2">
              {mySubmission.status === "PENDING" && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-400"
                >
                  Aguardando revisão
                </Badge>
              )}
              {mySubmission.status === "APPROVED" && (
                <Badge className="bg-emerald-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Aprovada — você venceu!
                </Badge>
              )}
              {mySubmission.status === "REJECTED" && (
                <Badge variant="destructive">Rejeitada</Badge>
              )}
            </div>
            {mySubmission.feedback && (
              <p className="text-sm text-muted-foreground pt-1">
                Feedback: {mySubmission.feedback}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit form */}
      {!isClosed && !mySubmission && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-base font-semibold">Enviar participação</h2>

          <FileUploadDropzone
            label="Comprovante (opcional)"
            file={proofFile}
            fileUrl={proofUrl}
            onFileSelect={processFileSelect}
            onFileRemove={() => {
              setProofFile(null);
              setProofUrl(null);
              setProofError("");
            }}
            uploading={uploadingProof}
            accept="image/jpeg,image/png,image/gif"
            hintText="JPG, PNG ou GIF · Máx. 5 MB"
            error={proofError}
          />

          {/* Description */}
          <MarkdownEditor
            label="Descrição / Relato (opcional)"
            value={description}
            onChange={(v) => setDescription(sanitizeMarkdownInput(v, 2000))}
            placeholder="Descreva como você cumpriu os requisitos da missão..."
            rows={5}
            maxLength={2000}
          />

          <Button
            type="submit"
            disabled={submitting || uploadingProof}
            className="gap-2"
          >
            {submitting ? (
              "Enviando..."
            ) : uploadingProof ? (
              "Enviando arquivo..."
            ) : (
              <>
                <Target className="h-4 w-4" />
                Enviar participação
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export default withPageRequiredAuth(MissionDetailPageContent);
