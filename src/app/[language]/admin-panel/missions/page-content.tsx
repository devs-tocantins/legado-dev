"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetAllMissionsService,
  useCreateMissionService,
  useUpdateMissionService,
  useDeleteMissionService,
  useGetMissionSubmissionsService,
  useReviewMissionSubmissionService,
  CreateMissionRequest,
} from "@/services/api/services/missions";
import { Mission } from "@/services/api/types/mission";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { RoleEnum } from "@/services/api/types/role";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { MarkdownEditor, MarkdownContent } from "@/components/markdown-editor";
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";

// ── Mission Form ────────────────────────────────────────────────────────────────

function MissionForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Partial<CreateMissionRequest>;
  onSubmit: (data: CreateMissionRequest) => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [requirements, setRequirements] = useState(initial?.requirements ?? "");
  const [xpReward, setXpReward] = useState(String(initial?.xpReward ?? 100));
  const [isSecret, setIsSecret] = useState(initial?.isSecret ?? false);
  const [requiresProof, setRequiresProof] = useState(
    initial?.requiresProof ?? false
  );
  const [requiresDescription, setRequiresDescription] = useState(
    initial?.requiresDescription ?? false
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      requirements: requirements.trim() || null,
      xpReward: Number(xpReward),
      isSecret,
      requiresProof,
      requiresDescription,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <MarkdownEditor
        label="Descrição (opcional)"
        value={description}
        onChange={setDescription}
        rows={4}
        placeholder="Descreva a missão. Suporta **markdown**."
      />

      <MarkdownEditor
        label="Requisitos para aprovação"
        value={requirements}
        onChange={setRequirements}
        rows={5}
        placeholder="Critérios que serão usados para avaliar as submissões. Suporta **markdown**."
      />

      <div className="space-y-1">
        <label className="text-sm font-medium">Recompensa em XP *</label>
        <input
          type="number"
          min={1}
          value={xpReward}
          onChange={(e) => setXpReward(e.target.value)}
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={isSecret}
            onChange={(e) => setIsSecret(e.target.checked)}
          />
          <div
            className={`w-10 h-5 rounded-full transition-colors ${isSecret ? "bg-primary" : "bg-input"}`}
          />
          <div
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isSecret ? "translate-x-5" : "translate-x-0"}`}
          />
        </div>
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          Missão secreta
          <span className="text-xs text-muted-foreground font-normal">
            (não aparece na lista pública)
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <label className="flex items-center gap-3 cursor-pointer select-none border rounded-lg p-3 hover:bg-accent/50 transition-colors">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={requiresProof}
              onChange={(e) => setRequiresProof(e.target.checked)}
            />
            <div
              className={`w-10 h-5 rounded-full transition-colors ${requiresProof ? "bg-primary" : "bg-input"}`}
            />
            <div
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${requiresProof ? "translate-x-5" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm font-medium">Requer comprovante</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer select-none border rounded-lg p-3 hover:bg-accent/50 transition-colors">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={requiresDescription}
              onChange={(e) => setRequiresDescription(e.target.checked)}
            />
            <div
              className={`w-10 h-5 rounded-full transition-colors ${requiresDescription ? "bg-primary" : "bg-input"}`}
            />
            <div
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${requiresDescription ? "translate-x-5" : "translate-x-0"}`}
            />
          </div>
          <span className="text-sm font-medium">Requer descrição</span>
        </label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Salvando..." : "Salvar Missão"}
      </Button>
    </form>
  );
}

// ── Submissions panel ────────────────────────────────────────────────────────────

function SubmissionsPanel({ mission }: { mission: Mission }) {
  const [open, setOpen] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const getSubmissions = useGetMissionSubmissionsService();
  const reviewSubmission = useReviewMissionSubmissionService();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["mission-submissions", mission.id],
    queryFn: async () => {
      const { status, data } = await getSubmissions(mission.id);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: open,
  });

  const { mutate: doReview, isPending: reviewing } = useMutation({
    mutationFn: async ({
      submissionId,
      status,
    }: {
      submissionId: string;
      status: "APPROVED" | "REJECTED";
    }) => {
      const feedback = feedbackMap[submissionId] ?? "";
      return reviewSubmission(mission.id, submissionId, {
        status,
        feedback: feedback || undefined,
      });
    },
    onSuccess: (_, { status }) => {
      enqueueSnackbar(
        status === "APPROVED"
          ? "Missão encerrada! Vencedor definido."
          : "Submissão rejeitada.",
        { variant: "success" }
      );
      queryClient.invalidateQueries({
        queryKey: ["mission-submissions", mission.id],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.message ?? "Erro ao revisar.", { variant: "error" });
    },
  });

  const pending = submissions?.filter((s) => s.status === "PENDING") ?? [];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ClipboardList className="h-4 w-4" />
        {pending.length > 0 ? (
          <span className="text-amber-500 font-medium">
            {pending.length} pendente(s)
          </span>
        ) : (
          <span>Ver submissões</span>
        )}
        {open ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
          {!isLoading && (!submissions || submissions.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Nenhuma submissão ainda.
            </p>
          )}
          {submissions?.map((sub) => (
            <div
              key={sub.id}
              className="rounded-lg border border-border p-3 space-y-2 bg-muted/20"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  perfil: {sub.profileId.slice(0, 8)}...
                </span>
                <Badge
                  variant={
                    sub.status === "APPROVED"
                      ? "default"
                      : sub.status === "REJECTED"
                        ? "destructive"
                        : "outline"
                  }
                  className="text-xs"
                >
                  {sub.status === "PENDING"
                    ? "Pendente"
                    : sub.status === "APPROVED"
                      ? "Aprovada"
                      : "Rejeitada"}
                </Badge>
              </div>

              {sub.description && (
                <p className="text-sm whitespace-pre-wrap">{sub.description}</p>
              )}
              {sub.proofUrl && (
                <a
                  href={sub.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline block truncate"
                >
                  Ver comprovante →
                </a>
              )}
              {sub.feedback && (
                <p className="text-xs text-muted-foreground">
                  Feedback: {sub.feedback}
                </p>
              )}

              {sub.status === "PENDING" && !mission.winnerId && (
                <div className="space-y-1.5 pt-1">
                  <input
                    placeholder="Feedback (obrigatório ao rejeitar)"
                    value={feedbackMap[sub.id] ?? ""}
                    onChange={(e) =>
                      setFeedbackMap((m) => ({
                        ...m,
                        [sub.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={reviewing}
                      onClick={() =>
                        doReview({ submissionId: sub.id, status: "APPROVED" })
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aprovar e encerrar missão
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      disabled={reviewing}
                      onClick={() =>
                        doReview({ submissionId: sub.id, status: "REJECTED" })
                      }
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

function AdminMissionsPageContent() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const getAllMissions = useGetAllMissionsService();
  const createMission = useCreateMissionService();
  const updateMission = useUpdateMissionService();
  const deleteMission = useDeleteMissionService();

  const [showCreate, setShowCreate] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  const { data: missions, isLoading } = useQuery({
    queryKey: ["admin-missions"],
    queryFn: async () => {
      const { status, data } = await getAllMissions();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
  });

  const { mutate: doCreate, isPending: creating } = useMutation({
    mutationFn: async (data: CreateMissionRequest) => {
      const res = await createMission(data);
      if (res.status !== HTTP_CODES_ENUM.CREATED)
        throw new Error(getApiError(res.data, "Erro ao criar missão"));
    },
    onSuccess: () => {
      enqueueSnackbar("Missão criada!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
      setShowCreate(false);
    },
    onError: (e: any) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  const { mutate: doUpdate, isPending: updating } = useMutation({
    mutationFn: async (data: CreateMissionRequest) => {
      if (!editingMission) return;
      const res = await updateMission(editingMission.id, data);
      if (res.status !== HTTP_CODES_ENUM.OK)
        throw new Error(getApiError(res.data, "Erro ao atualizar"));
    },
    onSuccess: () => {
      enqueueSnackbar("Missão atualizada!", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
      setEditingMission(null);
    },
    onError: (e: any) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  const { mutate: doDelete } = useMutation({
    mutationFn: async (id: string) => {
      await deleteMission(id);
    },
    onSuccess: () => {
      enqueueSnackbar("Missão removida.", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
    },
    onError: (e: any) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Missões
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Desafios únicos — apenas um vencedor por missão
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Missão
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && missions?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma missão criada ainda.</p>
        </div>
      )}

      <div className="space-y-4">
        {missions?.map((mission) => (
          <Card key={mission.id}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold leading-snug">
                  {mission.title}
                </CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {mission.isSecret && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-muted-foreground"
                    >
                      <Lock className="h-3 w-3" />
                      Secreta
                    </Badge>
                  )}
                  <Badge
                    variant={
                      mission.status === "OPEN" ? "default" : "secondary"
                    }
                  >
                    {mission.status === "OPEN" ? (
                      <>
                        <Zap className="h-3 w-3 mr-1" />
                        {mission.xpReward} XP
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Encerrada
                      </>
                    )}
                  </Badge>
                  {mission.status === "OPEN" && (
                    <>
                      <button
                        onClick={() => setEditingMission(mission)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => doDelete(mission.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {mission.description && (
                <MarkdownContent
                  content={mission.description}
                  className="text-muted-foreground"
                />
              )}
              {mission.requirements && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">
                    Requisitos
                  </summary>
                  <div className="mt-1">
                    <MarkdownContent content={mission.requirements} />
                  </div>
                </details>
              )}
              <SubmissionsPanel mission={mission} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Missão</DialogTitle>
          </DialogHeader>
          <MissionForm onSubmit={doCreate} loading={creating} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingMission}
        onOpenChange={(o) => !o && setEditingMission(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Missão</DialogTitle>
          </DialogHeader>
          {editingMission && (
            <MissionForm
              initial={editingMission}
              onSubmit={doUpdate}
              loading={updating}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withPageRequiredAuth(AdminMissionsPageContent, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
