"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import {
  useGetCoursesService,
  useCreateCourseService,
  useUpdateCourseService,
  useDeleteCourseService,
} from "@/services/api/services/courses";
import {
  useGetLearningTracksService,
  useGetLearningTrackOverviewService,
} from "@/services/api/services/learning-tracks";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Course } from "@/services/api/types/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Globe,
  DollarSign,
  User,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";

type CourseDialogState = { mode: "create" } | { mode: "edit"; course: Course };

function CourseDialog({
  state,
  onClose,
  onSaved,
}: {
  state: CourseDialogState | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const createCourse = useCreateCourseService();
  const updateCourse = useUpdateCourseService();
  const getTracks = useGetLearningTracksService();
  const getTrackOverview = useGetLearningTrackOverviewService();

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("");
  const [url, setUrl] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [language, setLanguage] = useState("");
  const [status, setStatus] = useState<"PENDING" | "VERIFIED" | "REJECTED">(
    "VERIFIED"
  );
  const [trackId, setTrackId] = useState("");
  const [trackItemId, setTrackItemId] = useState("");

  const { data: tracks } = useQuery({
    queryKey: ["admin-tracks-select"],
    queryFn: async () => {
      const res = await getTracks({ page: 1, limit: 100 });
      return res.status === HTTP_CODES_ENUM.OK ? res.data.data : [];
    },
    enabled: !!state,
  });

  const { data: trackOverview } = useQuery({
    queryKey: ["admin-track-overview", trackId],
    queryFn: async () => {
      const res = await getTrackOverview({ id: trackId });
      return res.status === HTTP_CODES_ENUM.OK ? res.data : null;
    },
    enabled: !!trackId,
  });

  const trackItems = useMemo(
    () => trackOverview?.sections.flatMap((s) => s.items) ?? [],
    [trackOverview]
  );

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit") {
      const c = state.course;
      setTitle(c.title);
      setDescription(c.description ?? "");
      setProvider(c.provider ?? "");
      setUrl(c.url);
      setIsFree(c.isFree);
      setPrice(c.price ? String(c.price) : "");
      setLanguage(c.language ?? "");
      setStatus(c.status);
      setTrackItemId(c.trackItemId ?? "");
      // If we had trackId on the course we could set it, but we only have trackItemId.
      // For simplicity, we just leave trackId empty if editing and let user select if they want to change.
    } else {
      setTitle("");
      setDescription("");
      setProvider("");
      setUrl("");
      setIsFree(true);
      setPrice("");
      setLanguage("");
      setStatus("VERIFIED");
      setTrackId("");
      setTrackItemId("");
    }
  }, [state]);

  const handleSave = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const payload = {
        title,
        description: description || null,
        provider: provider || null,
        url,
        isFree,
        price: isFree || !price ? null : Number(price),
        language: language || null,
        trackItemId: trackItemId || null,
        status,
      };

      if (state.mode === "create") {
        const res = await createCourse(payload);
        if (
          res.status === HTTP_CODES_ENUM.CREATED ||
          res.status === HTTP_CODES_ENUM.OK
        ) {
          enqueueSnackbar("Curso criado com sucesso", { variant: "success" });
          onSaved();
          onClose();
        } else {
          enqueueSnackbar(getApiError(res.data, "Erro ao criar."), {
            variant: "error",
          });
        }
      } else {
        const res = await updateCourse({ id: state.course.id, ...payload });
        if (res.status === HTTP_CODES_ENUM.OK) {
          enqueueSnackbar("Curso atualizado", { variant: "success" });
          onSaved();
          onClose();
        } else {
          enqueueSnackbar(getApiError(res.data, "Erro ao atualizar."), {
            variant: "error",
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {state?.mode === "create" ? "Criar curso" : "Editar curso"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>URL do Curso *</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fornecedor (Plataforma)</Label>
            <Input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Idioma</Label>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Preço (Gratuito?)</Label>
            <Select
              value={String(isFree)}
              onValueChange={(v) => setIsFree(v === "true")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Gratuito</SelectItem>
                <SelectItem value="false">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isFree && (
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Status de aprovação</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VERIFIED">Aprovado (Visível)</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="REJECTED">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 border-t pt-4 mt-2">
            <Label>
              Vincular a uma Trilha (opcional na edição, mas recomendado)
            </Label>
            <Select
              value={trackId || "none"}
              onValueChange={(v) => {
                setTrackId(v === "none" ? "" : v);
                setTrackItemId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma trilha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Manter atual / Não alterar</SelectItem>
                {(tracks ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {trackId && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Vincular a um Marco / Aula</Label>
              <Select
                value={trackItemId || "none"}
                onValueChange={(v) => setTrackItemId(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o marco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {trackItems.map((ti) => (
                    <SelectItem key={ti.id} value={ti.id}>
                      {ti.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !title || !url}>
            {saving ? "Salvando..." : "Salvar Curso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CourseCard({
  course,
  onEdit,
  onDelete,
}: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-[17px] font-semibold">
            {course.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Enviado por: {course.submittedByProfileId || "Sistema/Admin"}
          </div>
        </div>
        <Badge
          className={
            course.status === "VERIFIED"
              ? "bg-emerald-100 text-emerald-800 border-transparent hover:bg-emerald-200"
              : course.status === "REJECTED"
                ? "bg-red-100 text-red-800 border-transparent hover:bg-red-200"
                : "bg-amber-100 text-amber-800 border-transparent hover:bg-amber-200"
          }
        >
          {course.status === "VERIFIED"
            ? "Aprovado"
            : course.status === "REJECTED"
              ? "Rejeitado"
              : "Pendente"}
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {course.provider && (
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {course.provider}
          </span>
        )}
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {course.isFree
            ? "Gratuito"
            : course.price
              ? `R$ ${course.price}`
              : "Pago"}
        </span>
        {course.language && (
          <span className="flex items-center gap-1 font-mono text-foreground">
            {course.language}
          </span>
        )}
      </div>

      <p className="mb-3 text-[13.5px] leading-relaxed text-muted-foreground">
        {course.description || "Sem descrição"}
      </p>

      {course.url && (
        <div className="mb-3">
          <a
            href={course.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Acessar link do curso
          </a>
        </div>
      )}

      <div className="mt-3.5 flex gap-2.5 border-t border-border pt-3.5">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Apagar
        </Button>
      </div>
    </div>
  );
}

function AdminCoursesPageContent() {
  const fetchCourses = useGetCoursesService();
  const deleteCourse = useDeleteCourseService();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { confirmDialog } = useConfirmDialog();

  const [page, setPage] = useState(1);
  const [dialogState, setDialogState] = useState<CourseDialogState | null>(
    null
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-all-courses", page],
    queryFn: async () => {
      const { status, data } = await fetchCourses({ page, limit: 20 });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const courses = data?.data ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-all-courses"] });
    refetch();
  };

  const handleDelete = async (course: Course) => {
    const isConfirmed = await confirmDialog({
      title: "Apagar curso",
      message: `Tem certeza que deseja apagar o curso "${course.title}"? Esta ação não pode ser desfeita.`,
    });
    if (!isConfirmed) return;
    try {
      const res = await deleteCourse(course.id);
      if (res.status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Curso apagado com sucesso.", { variant: "success" });
        handleRefresh();
      } else {
        enqueueSnackbar("Erro ao apagar curso.", { variant: "error" });
      }
    } catch {
      enqueueSnackbar("Erro ao apagar curso.", { variant: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
            Gerenciamento
          </p>
          <h1 className="flex items-center gap-2 font-heading text-[28px] font-bold tracking-tight">
            <BookOpen className="h-6 w-6 text-primary" />
            Cursos Cadastrados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize, edite ou crie novos cursos no catálogo.
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ mode: "create" })}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="Nenhum curso encontrado" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={() => setDialogState({ mode: "edit", course })}
              onDelete={() => handleDelete(course)}
            />
          ))}
        </div>
      )}

      {!isLoading && (hasNextPage || page > 1) && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
          )}
          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          )}
        </div>
      )}

      <CourseDialog
        state={dialogState}
        onClose={() => setDialogState(null)}
        onSaved={handleRefresh}
      />
    </div>
  );
}

export default withPageRequiredAuth(AdminCoursesPageContent, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
