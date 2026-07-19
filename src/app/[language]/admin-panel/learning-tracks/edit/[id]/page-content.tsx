"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  useForm,
  FormProvider,
  useFormState,
  Controller,
} from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  useGetLearningTrackOverviewService,
  useGetLearningTracksService,
  useUpdateLearningTrackService,
  useCreateTrackSectionService,
  useUpdateTrackSectionService,
  useDeleteTrackSectionService,
  useCreateTrackItemService,
  useUpdateTrackItemService,
  useDeleteTrackItemService,
} from "@/services/api/services/learning-tracks";
import {
  LearningTrackStatus,
  LearningTrackTier,
  TrackItem,
  TrackItemStatus,
  TrackItemType,
  TrackSection,
  TrackSectionStatus,
} from "@/services/api/types/learning-track";
import { useGetActiveBadgesService } from "@/services/api/services/badges";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { useGetAllMissionsService } from "@/services/api/services/missions";
import { useGetCoursesService } from "@/services/api/services/courses";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RoleEnum } from "@/services/api/types/role";
import {
  ChevronLeft,
  Plus,
  FileText,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  CalendarDays,
  Target,
  ClipboardCheck,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────────────

const TIER_LABELS: Record<LearningTrackTier, string> = {
  ALICERCE: "Alicerce (fundamentos)",
  PILAR: "Pilar (especialização)",
  ARCO: "Arco (avançado)",
};

const TRACK_STATUS_LABELS: Record<LearningTrackStatus, string> = {
  DRAFT: "Rascunho (não visível para usuários)",
  PUBLISHED: "Publicada",
  ARCHIVED: "Arquivada",
};

const SECTION_STATUS_LABELS: Record<TrackSectionStatus, string> = {
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
};

const ITEM_STATUS_LABELS: Record<TrackItemStatus, string> = {
  ACTIVE: "Ativo",
  ARCHIVED: "Arquivado",
};

const ITEM_TYPE_LABELS: Record<TrackItemType, string> = {
  RESOURCE: "Conteúdo (RESOURCE)",
  TEXT: "Texto (TEXT)",
  CHECKPOINT: "Checkpoint (auto-conclusão)",
  PROOF: "Prova — vincula a uma Atividade",
  COURSE_COMPLETION: "Conclusão de curso",
  EVENT: "Participação em evento",
  MISSION: "Missão",
};

const ITEM_TYPE_ICONS: Record<
  TrackItemType,
  React.ComponentType<{ className?: string }>
> = {
  RESOURCE: BookOpen,
  TEXT: FileText,
  CHECKPOINT: CheckCircle2,
  PROOF: ClipboardCheck,
  COURSE_COMPLETION: GraduationCap,
  EVENT: CalendarDays,
  MISSION: Target,
};

const trackQueryKey = (id: string) => ["admin-learning-track-overview", id];

// ─── Track meta form ────────────────────────────────────────────────────────

type TrackFormData = {
  title: string;
  description: string;
  area: string;
  tier: LearningTrackTier;
  status: LearningTrackStatus;
  requiresTrackId: string;
};

function TrackFormActions() {
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      Salvar trilha
    </Button>
  );
}

function TrackMetaForm({
  trackId,
  initial,
}: {
  trackId: string;
  initial: TrackFormData;
}) {
  const fetchUpdate = useUpdateLearningTrackService();
  const fetchTracks = useGetLearningTracksService();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: otherTracks } = useQuery({
    queryKey: ["admin-learning-tracks-select"],
    queryFn: async () => {
      const { status, data } = await fetchTracks({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
  });

  const validationSchema = yup.object().shape({
    title: yup.string().required("Título é obrigatório"),
    description: yup.string().default(""),
    area: yup.string().required("Área é obrigatória"),
    tier: yup
      .mixed<LearningTrackTier>()
      .oneOf(Object.values(LearningTrackTier))
      .required(),
    status: yup
      .mixed<LearningTrackStatus>()
      .oneOf(Object.values(LearningTrackStatus))
      .required(),
    requiresTrackId: yup.string().default(""),
  });

  const methods = useForm<TrackFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: initial,
  });

  const { handleSubmit, control, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { status } = await fetchUpdate(trackId, {
      title: formData.title,
      description: formData.description || undefined,
      area: formData.area,
      tier: formData.tier,
      status: formData.status,
      requiresTrackId: formData.requiresTrackId || undefined,
    });
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      await queryClient.invalidateQueries({ queryKey: trackQueryKey(trackId) });
      enqueueSnackbar("Trilha atualizada", { variant: "success" });
    } else {
      enqueueSnackbar("Erro ao atualizar trilha", { variant: "error" });
    }
  });

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader>
          <CardTitle>Dados da trilha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormTextInput<TrackFormData>
              name="title"
              testId="title"
              label="Título"
            />
            <FormTextInput<TrackFormData>
              name="description"
              testId="description"
              label="Descrição"
              multiline
              minRows={2}
            />
            <FormTextInput<TrackFormData>
              name="area"
              testId="area"
              label="Área"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nível</Label>
                <Controller
                  control={control}
                  name="tier"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TIER_LABELS) as LearningTrackTier[]).map(
                          (tier) => (
                            <SelectItem key={tier} value={tier}>
                              {TIER_LABELS[tier]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(
                            TRACK_STATUS_LABELS
                          ) as LearningTrackStatus[]
                        ).map((s) => (
                          <SelectItem key={s} value={s}>
                            {TRACK_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Pré-requisito (opcional)</Label>
              <Controller
                control={control}
                name="requiresTrackId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {(otherTracks ?? [])
                        .filter((t) => t.id !== trackId)
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <TrackFormActions />
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// ─── Section dialog (create/edit) ──────────────────────────────────────────

type SectionDialogState =
  | { mode: "create"; nextPosition: number }
  | { mode: "edit"; section: TrackSection };

function SectionDialog({
  trackId,
  state,
  onClose,
  onSaved,
}: {
  trackId: string;
  state: SectionDialogState | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fetchCreate = useCreateTrackSectionService();
  const fetchUpdate = useUpdateTrackSectionService();
  const fetchBadges = useGetActiveBadgesService();
  const { enqueueSnackbar } = useSnackbar();

  const { data: badges } = useQuery({
    queryKey: ["admin-active-badges"],
    queryFn: async () => {
      const { status, data } = await fetchBadges();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!state,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [position, setPosition] = useState(1);
  const [status, setStatus] = useState<TrackSectionStatus>(
    TrackSectionStatus.ACTIVE
  );
  const [badgeId, setBadgeId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit") {
      setTitle(state.section.title);
      setDescription(state.section.description ?? "");
      setPosition(state.section.position);
      setStatus(state.section.status);
      setBadgeId(state.section.badgeId ?? "");
    } else {
      setTitle("");
      setDescription("");
      setPosition(state.nextPosition);
      setStatus(TrackSectionStatus.ACTIVE);
      setBadgeId("");
    }
  }, [state]);

  const handleSave = async () => {
    if (!state || !title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        trackId,
        title: title.trim(),
        description: description.trim() || undefined,
        position,
        status,
        badgeId: badgeId || undefined,
      };
      const { status: httpStatus } =
        state.mode === "create"
          ? await fetchCreate(payload)
          : await fetchUpdate(state.section.id, payload);
      if (
        httpStatus === HTTP_CODES_ENUM.OK ||
        httpStatus === HTTP_CODES_ENUM.CREATED
      ) {
        enqueueSnackbar(
          state.mode === "create" ? "Seção criada" : "Seção atualizada",
          { variant: "success" }
        );
        onSaved();
        onClose();
      } else {
        enqueueSnackbar("Erro ao salvar seção", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === "create" ? "Nova seção" : "Editar seção"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Posição</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TrackSectionStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(SECTION_STATUS_LABELS) as TrackSectionStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SECTION_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Selo ao concluir (opcional)</Label>
            <Select
              value={badgeId || "none"}
              onValueChange={(v) => setBadgeId(v && v !== "none" ? v : "")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(badges ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item dialog (create/edit) ──────────────────────────────────────────────

type ItemDialogState =
  | { mode: "create"; sectionId: string; nextPosition: number }
  | { mode: "edit"; item: TrackItem };

function ItemDialog({
  trackId,
  state,
  onClose,
  onSaved,
}: {
  trackId: string;
  state: ItemDialogState | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fetchCreate = useCreateTrackItemService();
  const fetchUpdate = useUpdateTrackItemService();
  const fetchActivities = useGetActivitiesService();
  const fetchMissions = useGetAllMissionsService();
  const fetchCourses = useGetCoursesService();
  const { enqueueSnackbar } = useSnackbar();

  const { data: activities } = useQuery({
    queryKey: ["admin-activities-select"],
    queryFn: async () => {
      const { status, data } = await fetchActivities({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    enabled: !!state,
  });
  const { data: missions } = useQuery({
    queryKey: ["admin-missions-select"],
    queryFn: async () => {
      const { status, data } = await fetchMissions({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    enabled: !!state,
  });
  const { data: courses } = useQuery({
    queryKey: ["admin-courses-select"],
    queryFn: async () => {
      const { status, data } = await fetchCourses({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
    enabled: !!state,
  });

  const [type, setType] = useState<TrackItemType>(TrackItemType.RESOURCE);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [position, setPosition] = useState(1);
  const [status, setStatus] = useState<TrackItemStatus>(TrackItemStatus.ACTIVE);
  const [isOptional, setIsOptional] = useState(false);
  const [allowsTestOut, setAllowsTestOut] = useState(false);
  const [journeyXp, setJourneyXp] = useState(0);
  const [grantsCommunityXp, setGrantsCommunityXp] = useState(false);
  const [communityXpReward, setCommunityXpReward] = useState(0);
  const [activityId, setActivityId] = useState("");
  const [missionId, setMissionId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit") {
      const item = state.item;
      setType(item.type);
      setTitle(item.title);
      setBody(item.body ?? "");
      setPosition(item.position);
      setStatus(item.status);
      setIsOptional(item.isOptional);
      setAllowsTestOut(item.allowsTestOut);
      setJourneyXp(item.journeyXp);
      setGrantsCommunityXp(item.grantsCommunityXp);
      setCommunityXpReward(item.communityXpReward ?? 0);
      setActivityId(item.activityId ?? "");
      setMissionId(item.missionId ?? "");
      setCourseId(item.courseId ?? "");
    } else {
      setType(TrackItemType.RESOURCE);
      setTitle("");
      setBody("");
      setPosition(state.nextPosition);
      setStatus(TrackItemStatus.ACTIVE);
      setIsOptional(false);
      setAllowsTestOut(false);
      setJourneyXp(0);
      setGrantsCommunityXp(false);
      setCommunityXpReward(0);
      setActivityId("");
      setMissionId("");
      setCourseId("");
    }
  }, [state]);

  const handleSave = async () => {
    if (!state || !title.trim()) return;
    setSaving(true);
    try {
      const sectionId =
        state.mode === "create" ? state.sectionId : state.item.sectionId;
      const payload = {
        trackId,
        sectionId,
        type,
        title: title.trim(),
        body: body.trim() || undefined,
        position,
        status,
        isOptional,
        allowsTestOut,
        journeyXp,
        grantsCommunityXp,
        communityXpReward: grantsCommunityXp ? communityXpReward : undefined,
        activityId: type === "PROOF" ? activityId || undefined : undefined,
        missionId: type === "MISSION" ? missionId || undefined : undefined,
        courseId:
          type === "COURSE_COMPLETION" ? courseId || undefined : undefined,
      };
      const { status: httpStatus } =
        state.mode === "create"
          ? await fetchCreate(payload)
          : await fetchUpdate(state.item.id, payload);
      if (
        httpStatus === HTTP_CODES_ENUM.OK ||
        httpStatus === HTTP_CODES_ENUM.CREATED
      ) {
        enqueueSnackbar(
          state.mode === "create" ? "Marco criado" : "Marco atualizado",
          { variant: "success" }
        );
        onSaved();
        onClose();
      } else {
        enqueueSnackbar("Erro ao salvar marco", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === "create" ? "Novo marco" : "Editar marco"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as TrackItemType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ITEM_TYPE_LABELS) as TrackItemType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ITEM_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Conteúdo / instrução (opcional)</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {type === "PROOF" && (
            <div className="space-y-1.5">
              <Label>Atividade vinculada (comprovante)</Label>
              <Select
                value={activityId || "none"}
                onValueChange={(v) => setActivityId(v && v !== "none" ? v : "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Nenhuma (cria atividade exclusiva automaticamente)
                  </SelectItem>
                  {(activities ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "MISSION" && (
            <div className="space-y-1.5">
              <Label>Missão vinculada</Label>
              <Select
                value={missionId || "none"}
                onValueChange={(v) => setMissionId(v && v !== "none" ? v : "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {(missions ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "COURSE_COMPLETION" && (
            <div className="space-y-1.5">
              <Label>Curso vinculado</Label>
              <Select
                value={courseId || "none"}
                onValueChange={(v) => setCourseId(v && v !== "none" ? v : "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {(courses ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Posição</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TrackItemStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ITEM_STATUS_LABELS) as TrackItemStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {ITEM_STATUS_LABELS[s]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>XP de Jornada concedido ao concluir</Label>
            <Input
              type="number"
              min={0}
              value={journeyXp}
              onChange={(e) => setJourneyXp(Number(e.target.value))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isOptional}
              onChange={(e) => setIsOptional(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            Marco opcional (não bloqueia a conclusão da seção)
          </label>

          {type === "PROOF" && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={allowsTestOut}
                onChange={(e) => setAllowsTestOut(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
              />
              Permite &quot;pular prova&quot; (test-out) se o usuário já domina
              o assunto
            </label>
          )}

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={grantsCommunityXp}
              onChange={(e) => setGrantsCommunityXp(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
            />
            Concede também XP de Comunidade
          </label>

          {grantsCommunityXp && (
            <div className="space-y-1.5">
              <Label>XP de Comunidade</Label>
              <Input
                type="number"
                min={0}
                value={communityXpReward}
                onChange={(e) => setCommunityXpReward(Number(e.target.value))}
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item row ───────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onEdit,
  onDeleted,
}: {
  item: TrackItem;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteTrackItemService();
  const { enqueueSnackbar } = useSnackbar();
  const Icon = ITEM_TYPE_ICONS[item.type] ?? FileText;

  const handleDelete = async () => {
    const isConfirmed = await confirmDialog({
      title: "Excluir marco",
      message: `Tem certeza que deseja excluir o marco "${item.title}"? Esta ação não pode ser desfeita.`,
    });
    if (!isConfirmed) return;
    try {
      await fetchDelete(item.id);
      enqueueSnackbar("Marco excluído", { variant: "success" });
      onDeleted();
    } catch {
      enqueueSnackbar("Erro ao excluir marco", { variant: "error" });
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-md border-l-2 border-l-border bg-muted/20">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {ITEM_TYPE_LABELS[item.type]} · pos {item.position} ·{" "}
          {ITEM_STATUS_LABELS[item.status]}
          {item.journeyXp > 0 && ` · +${item.journeyXp} XP`}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          Excluir
        </Button>
      </div>
    </div>
  );
}

// ─── Section card ───────────────────────────────────────────────────────────

function SectionCard({
  section,
  items,
  onEditSection,
  onAddItem,
  onEditItem,
  onRefresh,
}: {
  section: TrackSection;
  items: TrackItem[];
  onEditSection: () => void;
  onAddItem: () => void;
  onEditItem: (item: TrackItem) => void;
  onRefresh: () => void;
}) {
  const { confirmDialog } = useConfirmDialog();
  const fetchDelete = useDeleteTrackSectionService();
  const { enqueueSnackbar } = useSnackbar();

  const handleDeleteSection = async () => {
    const isConfirmed = await confirmDialog({
      title: "Excluir seção",
      message: `Tem certeza que deseja excluir a seção "${section.title}"? Isso também remove seus marcos. Esta ação não pode ser desfeita.`,
    });
    if (!isConfirmed) return;
    try {
      await fetchDelete(section.id);
      enqueueSnackbar("Seção excluída", { variant: "success" });
      onRefresh();
    } catch {
      enqueueSnackbar("Erro ao excluir seção", { variant: "error" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">{section.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            pos {section.position} · {SECTION_STATUS_LABELS[section.status]}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="outline" onClick={onEditSection}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteSection}
          >
            Excluir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">
            Nenhum marco nesta seção ainda.
          </p>
        ) : (
          <div className="space-y-1.5">
            {items
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => onEditItem(item)}
                  onDeleted={onRefresh}
                />
              ))}
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-primary"
          onClick={onAddItem}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar marco
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main builder ───────────────────────────────────────────────────────────

function TrackBuilder() {
  const params = useParams<{ id: string }>();
  const trackId = params.id;
  const fetchOverview = useGetLearningTrackOverviewService();

  const {
    data: overview,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: trackQueryKey(trackId),
    queryFn: async () => {
      const { status, data } = await fetchOverview({ id: trackId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const [sectionDialog, setSectionDialog] = useState<SectionDialogState | null>(
    null
  );
  const [itemDialog, setItemDialog] = useState<ItemDialogState | null>(null);

  const nextSectionPosition = useMemo(() => {
    const positions = overview?.sections.map((s) => s.section.position) ?? [];
    return positions.length ? Math.max(...positions) + 1 : 1;
  }, [overview]);

  const nextItemPosition = useCallback(
    (sectionId: string) => {
      const items =
        overview?.sections.find((s) => s.section.id === sectionId)?.items ?? [];
      const positions = items.map((i) => i.position);
      return positions.length ? Math.max(...positions) + 1 : 1;
    },
    [overview]
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-4">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">Trilha não encontrada.</p>
        <Button
          variant="outline"
          className="mt-3"
          render={<Link href="/admin-panel/learning-tracks" />}
        >
          Voltar
        </Button>
      </div>
    );
  }

  const { track, sections } = overview;

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground -ml-2"
          render={<Link href="/admin-panel/learning-tracks" />}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <TrackMetaForm
        trackId={trackId}
        initial={{
          title: track.title,
          description: track.description ?? "",
          area: track.area,
          tier: track.tier,
          status: track.status,
          requiresTrackId: track.requiresTrackId ?? "",
        }}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Seções e marcos
        </h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() =>
            setSectionDialog({
              mode: "create",
              nextPosition: nextSectionPosition,
            })
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar seção
        </Button>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhuma seção ainda. Adicione a primeira seção para começar a montar a
          trilha.
        </p>
      ) : (
        <div className="space-y-4">
          {sections
            .slice()
            .sort((a, b) => a.section.position - b.section.position)
            .map(({ section, items }) => (
              <SectionCard
                key={section.id}
                section={section}
                items={items}
                onEditSection={() =>
                  setSectionDialog({ mode: "edit", section })
                }
                onAddItem={() =>
                  setItemDialog({
                    mode: "create",
                    sectionId: section.id,
                    nextPosition: nextItemPosition(section.id),
                  })
                }
                onEditItem={(item) => setItemDialog({ mode: "edit", item })}
                onRefresh={() => refetch()}
              />
            ))}
        </div>
      )}

      <SectionDialog
        trackId={trackId}
        state={sectionDialog}
        onClose={() => setSectionDialog(null)}
        onSaved={() => refetch()}
      />
      <ItemDialog
        trackId={trackId}
        state={itemDialog}
        onClose={() => setItemDialog(null)}
        onSaved={() => refetch()}
      />
    </div>
  );
}

export default withPageRequiredAuth(TrackBuilder, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
