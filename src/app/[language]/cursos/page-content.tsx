"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetCoursesService,
  useCreateCourseService,
  useCreateCourseReviewService,
} from "@/services/api/services/courses";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Course } from "@/services/api/types/course";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ExternalLink,
  GraduationCap,
  Plus,
  Star,
  Coins,
  Gift,
} from "lucide-react";
import { cn, getApiError } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function RateCourseDialog({
  course,
  open,
  onClose,
}: {
  course: Course;
  open: boolean;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const createReview = useCreateCourseReviewService();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { status, data } = await createReview({
        courseId: course.id,
        rating,
        comment: comment.trim() || null,
      });
      if (status !== HTTP_CODES_ENUM.CREATED) {
        throw new Error(getApiError(data, "Erro ao enviar avaliação."));
      }
    },
    onSuccess: () => {
      enqueueSnackbar("Avaliação enviada. Obrigado!", { variant: "success" });
      setRating(0);
      setComment("");
      onClose();
    },
    onError: (e: Error) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            Avaliar &quot;{course.title}&quot;
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Só é possível avaliar um curso depois de comprovar sua conclusão em
          uma trilha de aprendizado.
        </p>
        <div className="space-y-3">
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="O que achou do curso? (opcional)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={rating === 0 || isPending}
            onClick={() => mutate()}
          >
            {isPending ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewCourseDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [url, setUrl] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [language, setLanguage] = useState("pt-BR");
  const { enqueueSnackbar } = useSnackbar();
  const createCourse = useCreateCourseService();
  const fetchMyProfile = useGetMyGamificationProfileService();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const myProfileRes = await fetchMyProfile();
      const myProfile =
        myProfileRes.status === HTTP_CODES_ENUM.OK ? myProfileRes.data : null;
      const { status, data } = await createCourse({
        title: title.trim(),
        provider: provider.trim() || null,
        url: url.trim(),
        isFree,
        price: isFree ? null : Number(price) || null,
        language: language.trim() || null,
        submittedByProfileId: myProfile?.id ?? null,
      });
      if (status !== HTTP_CODES_ENUM.CREATED) {
        throw new Error(getApiError(data, "Erro ao cadastrar curso."));
      }
    },
    onSuccess: () => {
      enqueueSnackbar(
        "Curso enviado! Ele aparecerá no catálogo após verificação.",
        { variant: "success" }
      );
      setTitle("");
      setProvider("");
      setUrl("");
      setIsFree(true);
      setPrice("");
      onCreated();
      onClose();
    },
    onError: (e: Error) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  const canSubmit = title.trim().length > 0 && url.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Cadastrar curso
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          O curso entra como pendente e só aparece no catálogo depois de
          verificado pela moderação.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Instituição/Autor</label>
            <input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Link do curso *</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFree"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isFree" className="text-sm">
              Curso gratuito
            </label>
          </div>
          {!isFree && (
            <div>
              <label className="text-xs font-medium">Preço (R$)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min={0}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium">Idioma</label>
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!canSubmit || isPending}
            onClick={() => mutate()}
          >
            {isPending ? "Enviando..." : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseCard({
  course,
  onRate,
}: {
  course: Course;
  onRate: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-border bg-card p-5 shadow-[0_6px_0_var(--border)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
            course.isFree
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          {course.isFree ? (
            <>
              <Gift className="h-3 w-3" /> Gratuito
            </>
          ) : (
            <>
              <Coins className="h-3 w-3" />
              {course.price ? `R$ ${course.price}` : "Pago"}
            </>
          )}
        </span>
      </div>
      <div>
        <h3 className="text-[16px] font-bold leading-snug">{course.title}</h3>
        {course.provider && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {course.provider}
          </p>
        )}
      </div>
      <div className="mt-auto flex items-center gap-2 pt-2">
        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="outline" className="w-full gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Acessar
          </Button>
        </a>
        <Button variant="outline" className="gap-1.5" onClick={onRate}>
          <Star className="h-3.5 w-3.5" />
          Avaliar
        </Button>
      </div>
    </div>
  );
}

function CursosPageContent() {
  const fetchCourses = useGetCoursesService();
  const queryClient = useQueryClient();
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [ratingCourse, setRatingCourse] = useState<Course | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["courses-catalog"],
    queryFn: async () => {
      const { status, data } = await fetchCourses({ page: 1, limit: 50 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [] as Course[];
    },
  });

  const courses = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-20">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">
            Catálogo de cursos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cursos verificados pela comunidade. Conclua um deles dentro de uma
            trilha para poder avaliá-lo.
          </p>
        </div>
        <Button
          className="shrink-0 gap-1.5"
          onClick={() => setNewCourseOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Cadastrar curso
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Nenhum curso verificado ainda"
          description="Cadastre o primeiro curso para a comunidade avaliar."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onRate={() => setRatingCourse(course)}
            />
          ))}
        </div>
      )}

      <NewCourseDialog
        open={newCourseOpen}
        onClose={() => setNewCourseOpen(false)}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: ["courses-catalog"] })
        }
      />

      {ratingCourse && (
        <RateCourseDialog
          course={ratingCourse}
          open={!!ratingCourse}
          onClose={() => setRatingCourse(null)}
        />
      )}
    </div>
  );
}

export default withPageRequiredAuth(CursosPageContent);
