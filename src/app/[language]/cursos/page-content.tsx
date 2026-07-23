"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "@/components/link";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetCoursesService,
  useCreateCourseService,
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
import { GraduationCap, Plus, Star, Coins, Gift } from "lucide-react";
import { cn, getApiError } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getCoursePalette } from "@/lib/course-colors";

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
            <Plus className="h-4 w-4 text-[#f97316]" />
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
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Instituição/Autor</label>
            <input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Link do curso *</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFree"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
            />
            <label htmlFor="isFree" className="text-sm cursor-pointer">
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
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium">Idioma</label>
            <input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-[#f97316] text-white hover:bg-[#e65c00]"
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

function CourseCard({ course }: { course: Course }) {
  const averageRating = course.averageRating ? Number(course.averageRating) : 0;
  const totalReviews = course.totalReviews || 0;
  const style = getCoursePalette(course.id);

  return (
    <Link
      href={`/cursos/${course.id}`}
      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-[24px] border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-[0_13px_0_var(--card-shadow)] active:translate-y-1 active:shadow-[0_4px_0_var(--card-shadow)]"
      style={
        {
          borderColor: style.ring,
          boxShadow: `0 9px 0 ${style.shadow}`,
          "--card-shadow": style.shadow,
        } as React.CSSProperties
      }
    >
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-white"
          style={{ background: style.bright }}
        >
          <GraduationCap className="h-6 w-6" />
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
            course.isFree
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
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
      <div className="flex-1 relative z-10">
        <h3 className="text-[18px] font-bold leading-snug group-hover:underline transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.provider && (
          <p className="mt-1.5 text-sm text-muted-foreground font-medium">
            {course.provider}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4 relative z-10">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-bold text-foreground">
            {averageRating > 0 ? averageRating.toFixed(1) : "Novo"}
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            ({totalReviews})
          </span>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300"
          style={{ background: style.chipBg, color: style.chipText }}
        >
          Ver detalhes &rarr;
        </span>
      </div>
    </Link>
  );
}

function CursosPageContent() {
  const fetchCourses = useGetCoursesService();
  const queryClient = useQueryClient();
  const [newCourseOpen, setNewCourseOpen] = useState(false);

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
    <div className="mx-auto max-w-6xl px-4 py-8 pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Catálogo de Cursos
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Cursos maravilhosos verificados pela comunidade. Aprenda, evolua na
            sua trilha e avalie para ajudar os próximos devs!
          </p>
        </div>
        <Button
          size="lg"
          className="shrink-0 gap-2 bg-[#f97316] text-white hover:bg-[#e65c00] rounded-xl font-bold shadow-md"
          onClick={() => setNewCourseOpen(true)}
        >
          <Plus className="h-5 w-5" />
          Sugerir um Curso
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[240px] animate-pulse rounded-[24px] bg-muted/60"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Nenhum curso verificado ainda"
          description="Seja o primeiro a sugerir um curso sensacional para a comunidade."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
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
    </div>
  );
}

export default withPageRequiredAuth(CursosPageContent);
