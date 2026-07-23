"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useGetCourseByIdService,
  useGetCourseReviewsByCourseService,
  useGetMyCourseReviewService,
  useCreateCourseReviewService,
  useUpdateCourseReviewService,
  useDeleteCourseReviewService,
} from "@/services/api/services/courses";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Course, CourseReview } from "@/services/api/types/course";
import useAuth from "@/services/auth/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Star,
  GraduationCap,
  ArrowLeft,
  ExternalLink,
  Coins,
  Gift,
  MessageCircle,
  Trash2,
  Edit2,
} from "lucide-react";
import { cn, getApiError } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
              "h-8 w-8 transition-colors",
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
  initialReview,
}: {
  course: Course;
  open: boolean;
  onClose: () => void;
  initialReview?: CourseReview | null;
}) {
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [comment, setComment] = useState(initialReview?.comment || "");
  const { enqueueSnackbar } = useSnackbar();
  const createReview = useCreateCourseReviewService();
  const updateReview = useUpdateCourseReviewService();
  const queryClient = useQueryClient();

  // Reset state when opening/closing or when initialReview changes
  useEffect(() => {
    if (open) {
      setRating(initialReview?.rating || 0);
      setComment(initialReview?.comment || "");
    }
  }, [open, initialReview]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (initialReview) {
        const { status, data } = await updateReview({
          id: initialReview.id,
          rating,
          comment: comment.trim() || null,
        });
        if (status !== HTTP_CODES_ENUM.OK) {
          throw new Error(getApiError(data, "Erro ao atualizar avaliação."));
        }
      } else {
        const { status, data } = await createReview({
          courseId: course.id,
          rating,
          comment: comment.trim() || null,
        });
        if (status !== HTTP_CODES_ENUM.CREATED) {
          throw new Error(getApiError(data, "Erro ao enviar avaliação."));
        }
      }
    },
    onSuccess: () => {
      enqueueSnackbar(
        initialReview
          ? "Avaliação atualizada!"
          : "Avaliação enviada. Obrigado!",
        { variant: "success" }
      );
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["course", course.id] });
      queryClient.invalidateQueries({
        queryKey: ["course-reviews", course.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-course-review", course.id],
      });
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
        <div className="space-y-3 mt-4">
          <div className="flex justify-center mb-4">
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="O que achou do curso? Conte para a comunidade... (opcional)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex gap-2 pt-4">
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

function CoursePageContent() {
  const params = useParams();
  const courseId = params.id as string;
  const [isRateOpen, setIsRateOpen] = useState(false);
  const { user } = useAuth();
  const isAdminOrMod = user?.role?.id === 1 || user?.role?.id === 3;
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const fetchCourse = useGetCourseByIdService();
  const fetchReviews = useGetCourseReviewsByCourseService();
  const fetchMyReview = useGetMyCourseReviewService();
  const deleteReview = useDeleteCourseReviewService();

  const { mutate: handleDeleteReview, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { status, data } = await deleteReview(id);
      if (status !== HTTP_CODES_ENUM.OK) {
        throw new Error(getApiError(data, "Erro ao remover avaliação."));
      }
    },
    onSuccess: () => {
      enqueueSnackbar("Avaliação removida.", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course-reviews", courseId] });
      queryClient.invalidateQueries({
        queryKey: ["my-course-review", courseId],
      });
    },
    onError: (e: Error) => enqueueSnackbar(e.message, { variant: "error" }),
  });

  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { status, data } = await fetchCourse(courseId);
      if (status === HTTP_CODES_ENUM.OK) return data;
      throw new Error("Curso não encontrado");
    },
  });

  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: async () => {
      const { status, data } = await fetchReviews(courseId);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return [];
    },
    enabled: !!course,
  });

  const { data: myReview, isLoading: isMyReviewLoading } = useQuery({
    queryKey: ["my-course-review", courseId],
    queryFn: async () => {
      const { status, data } = await fetchMyReview(courseId);
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!course,
  });

  if (isCourseLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        <div className="mt-8 space-y-4">
          <div className="h-10 w-1/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center pb-20">
        <h1 className="text-2xl font-bold">Curso não encontrado.</h1>
        <Link href={`/cursos`}>
          <Button className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Button>
        </Link>
      </div>
    );
  }

  const averageRating = course.averageRating ? Number(course.averageRating) : 0;
  const totalReviews = course.totalReviews || 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <Link
        href={`/cursos`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao catálogo
      </Link>

      {/* Course Header Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#f97316] to-[#e65c00] p-8 text-white shadow-lg md:p-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <GraduationCap className="h-3.5 w-3.5" />
                {course.provider || "Comunidade"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                {course.isFree ? (
                  <>
                    <Gift className="h-3.5 w-3.5" /> Gratuito
                  </>
                ) : (
                  <>
                    <Coins className="h-3.5 w-3.5" />
                    {course.price ? `R$ ${course.price}` : "Pago"}
                  </>
                )}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-white">
              {course.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
                <span className="text-lg font-bold">
                  {averageRating > 0 ? averageRating.toFixed(1) : "Novo"}
                </span>
                <span className="text-sm font-medium text-white/80">
                  ({totalReviews}{" "}
                  {totalReviews === 1 ? "avaliação" : "avaliações"})
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-2">
            <a href={course.url} target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-[#f97316] hover:bg-white/90 font-bold gap-2 rounded-xl"
              >
                Acessar Curso
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-black opacity-10 blur-3xl"></div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Description & Reviews */}
        <div className="space-y-10">
          {course.description && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Sobre o curso</h2>
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                {course.description}
              </div>
            </section>
          )}

          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-[#f97316]" />
                Avaliações da Comunidade
              </h2>
            </div>

            {isReviewsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-32 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="Nenhuma avaliação ainda"
                description="Este curso ainda não recebeu avaliações da comunidade."
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
                          {/* Avatar initial */}
                          {review.user?.firstName
                            ? review.user.firstName.charAt(0).toUpperCase()
                            : review.profileId
                              ? "U"
                              : "?"}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {review.user?.firstName} {review.user?.lastName}
                            {!review.user?.firstName && "Usuário Anônimo"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(
                              new Date(review.createdAt),
                              "dd 'de' MMMM, yyyy",
                              { locale: ptBR }
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={cn(
                                "h-4 w-4",
                                n <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-muted text-muted"
                              )}
                            />
                          ))}
                        </div>
                        {isAdminOrMod && (
                          <button
                            onClick={() => {
                              // eslint-disable-next-line no-alert
                              const confirmed = window.confirm(
                                "Deseja realmente remover esta avaliação?"
                              );
                              if (confirmed) {
                                handleDeleteReview(review.id);
                              }
                            }}
                            disabled={isDeleting}
                            className="ml-2 text-destructive hover:text-destructive/80 transition-colors"
                            title="Remover avaliação (Moderação)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Interaction */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-[24px] border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-2">Sua Avaliação</h3>
            {isMyReviewLoading ? (
              <div className="h-20 animate-pulse rounded-xl bg-muted" />
            ) : myReview ? (
              <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/20">
                <div className="flex items-center gap-1.5 mb-2 text-amber-600 dark:text-amber-400 font-semibold">
                  <span>Sua nota:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={cn(
                          "h-4 w-4",
                          n <= myReview.rating
                            ? "fill-amber-500 text-amber-500"
                            : "fill-amber-500/20 text-amber-500/20"
                        )}
                      />
                    ))}
                  </div>
                </div>
                {myReview.comment ? (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    &quot;{myReview.comment}&quot;
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    Você avaliou este curso sem deixar um comentário.
                  </p>
                )}
                <div className="mt-4 text-xs font-medium text-amber-600/70">
                  Avaliado em{" "}
                  {format(new Date(myReview.createdAt), "dd/MM/yyyy")}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setIsRateOpen(true)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-2"
                    disabled={isDeleting}
                    onClick={() => {
                      // eslint-disable-next-line no-alert
                      if (window.confirm("Deseja remover sua avaliação?")) {
                        handleDeleteReview(myReview.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Concluiu este curso através de uma trilha? Avalie e ajude a
                  comunidade!
                </p>
                <Button
                  onClick={() => setIsRateOpen(true)}
                  className="w-full gap-2 rounded-xl"
                  size="lg"
                >
                  <Star className="h-4 w-4" />
                  Avaliar Curso
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <RateCourseDialog
        course={course}
        open={isRateOpen}
        onClose={() => setIsRateOpen(false)}
        initialReview={myReview}
      />
    </div>
  );
}

export default withPageRequiredAuth(CoursePageContent);
