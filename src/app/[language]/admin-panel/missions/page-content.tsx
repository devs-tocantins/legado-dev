"use client";

import { useState, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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
import { cn } from "@/lib/utils";
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
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import removeDuplicatesFromArrayObjects from "@/services/helpers/remove-duplicates-from-array-of-objects";

type ViewMode = "card" | "list";

// ── Mission Form ────────────────────────────────────────────────────────────────

function MissionForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<CreateMissionRequest>;
  onSubmit: (data: CreateMissionRequest) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [requirements, setRequirements] = useState(initial?.requirements ?? "");
  const [xpReward, setXpReward] = useState(String(initial?.xpReward ?? 100));
  const [auditorReward, setAuditorReward] = useState(
    String(initial?.auditorReward ?? 10)
  );
  const [participationReward, setParticipationReward] = useState(
    String(initial?.participationReward ?? 0)
  );
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
      xpReward: Math.floor(Number(xpReward)),
      auditorReward: Math.floor(Number(auditorReward)),
      participationReward: Math.floor(Number(participationReward)),
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

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Vencedor (XP) *</label>
          <input
            type="number"
            min={1}
            value={xpReward}
            onChange={(e) => setXpReward(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Participante (XP) *</label>
          <input
            type="number"
            min={0}
            value={participationReward}
            onChange={(e) => setParticipationReward(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Auditor (XP) *</label>
          <input
            type="number"
            min={0}
            value={auditorReward}
            onChange={(e) => setAuditorReward(e.target.value)}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
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

      <div className="grid grid-cols-2 gap-4 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="w-full"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Salvando..." : "Salvar Missão"}
        </Button>
      </div>
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

  const [subData, setSubData] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  const loadSubmissions = async () => {
    if (subData.length > 0 || subLoading) return;
    setSubLoading(true);
    try {
      const { status, data } = await getSubmissions(mission.id);
      if (status === HTTP_CODES_ENUM.OK) setSubData(data as any[]);
    } finally {
      setSubLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadSubmissions();
  };

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
      setSubData([]);
      loadSubmissions();
      queryClient.invalidateQueries({ queryKey: ["admin-missions"] });
    },
    onError: (err: any) => {
      enqueueSnackbar(err?.message ?? "Erro ao revisar.", { variant: "error" });
    },
  });

  const pending = subData?.filter((s: any) => s.status === "PENDING") ?? [];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleToggle}
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
          {subLoading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
          {!subLoading && subData.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma submissão ainda.
            </p>
          )}
          {subData.map((sub: any) => (
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

// ── Mission Card (admin) ─────────────────────────────────────────────────────────

function MissionCardAdmin({
  mission,
  onEdit,
  onDelete,
}: {
  mission: Mission;
  onEdit: (m: Mission) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-snug">
            {mission.title}
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {mission.isSecret && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Lock className="h-3 w-3" />
                Secreta
              </Badge>
            )}
            <Badge
              variant={mission.status === "OPEN" ? "default" : "secondary"}
              className="gap-1.5"
            >
              {mission.status === "OPEN" ? (
                <>
                  <Zap className="h-3 w-3" />
                  {mission.xpReward} (V) + {mission.participationReward} (P) +{" "}
                  {mission.auditorReward} (A) XP
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Encerrada
                </>
              )}
            </Badge>
            {mission.status === "OPEN" && (
              <>
                <button
                  onClick={() => onEdit(mission)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(mission.id)}
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
            <summary className="cursor-pointer font-medium">Requisitos</summary>
            <div className="mt-1">
              <MarkdownContent content={mission.requirements} />
            </div>
          </details>
        )}
        <SubmissionsPanel mission={mission} />
      </CardContent>
    </Card>
  );
}

// ── Mission Row (admin) ──────────────────────────────────────────────────────────

function MissionRowAdmin({
  mission,
  onEdit,
  onDelete,
}: {
  mission: Mission;
  onEdit: (m: Mission) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b last:border-b-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{mission.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {mission.isSecret && (
            <Badge
              variant="outline"
              className="gap-1 text-muted-foreground text-xs"
            >
              <Lock className="h-3 w-3" />
              Secreta
            </Badge>
          )}
          <Badge
            variant={mission.status === "OPEN" ? "default" : "secondary"}
            className="text-xs"
          >
            {mission.status === "OPEN"
              ? `${mission.xpReward} (V) + ${mission.participationReward} (P) + ${mission.auditorReward} (A) XP`
              : "Encerrada"}
          </Badge>
          {mission.status === "OPEN" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(mission);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(mission.id);
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 space-y-2 bg-muted/10">
          {mission.description && (
            <MarkdownContent
              content={mission.description}
              className="text-sm text-muted-foreground"
            />
          )}
          <SubmissionsPanel mission={mission} />
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
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["admin-missions", search],
      initialPageParam: 1,
      queryFn: async ({ pageParam, signal }) => {
        const { status, data } = await getAllMissions(
          { page: pageParam, limit: 10, search: search || undefined },
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

  const missions = useMemo(() => {
    const all = data?.pages.flatMap((p) => p?.data ?? []) ?? [];
    return removeDuplicatesFromArrayObjects(all as Mission[], "id");
  }, [data]);

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
      {/* Header */}
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

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar missões..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center border border-input rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "card"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
            title="Visualização em cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
            title="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && missions.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>
            {search
              ? "Nenhuma missão encontrada para esta busca."
              : "Nenhuma missão criada ainda."}
          </p>
        </div>
      )}

      {viewMode === "card" ? (
        <div className="space-y-4">
          {missions.map((mission) => (
            <MissionCardAdmin
              key={mission.id}
              mission={mission}
              onEdit={setEditingMission}
              onDelete={(id) => doDelete(id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {missions.map((mission) => (
            <MissionRowAdmin
              key={mission.id}
              mission={mission}
              onEdit={setEditingMission}
              onDelete={(id) => doDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
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

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Nova Missão</DialogTitle>
          </DialogHeader>
          <MissionForm
            onSubmit={doCreate}
            onCancel={() => setShowCreate(false)}
            loading={creating}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingMission}
        onOpenChange={(o) => !o && setEditingMission(null)}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Editar Missão</DialogTitle>
          </DialogHeader>
          {editingMission && (
            <MissionForm
              initial={editingMission}
              onSubmit={doUpdate}
              onCancel={() => setEditingMission(null)}
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
