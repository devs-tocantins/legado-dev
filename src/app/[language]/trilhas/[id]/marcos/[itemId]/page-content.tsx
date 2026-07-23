"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  useCompleteTrackItemService,
  useGetLearningTrackOverviewService,
  useGetLearningTrackProgressService,
} from "@/services/api/services/learning-tracks";
import {
  usePostSubmissionService,
  useGetMySubmissionsService,
} from "@/services/api/services/submissions";
import { useFileUploadService } from "@/services/api/services/files";
import {
  useGetCoursesByTrackItemService,
  useCreateCourseService,
  useCreateCourseReviewService,
  useGetCourseReviewsByCourseService,
} from "@/services/api/services/courses";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { TrackItem, TrackItemType } from "@/services/api/types/learning-track";
import { SubmissionStatusEnum } from "@/services/api/types/submission";
import { Course, CourseReview } from "@/services/api/types/course";
import { TRACK_ITEM_TYPE_BADGE } from "@/lib/track-colors";
import { MarkdownContent } from "@/components/markdown-editor";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  ExternalLink,
  Gift,
  GraduationCap,
  Loader2,
  Map,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { cn, getApiError } from "@/lib/utils";
import { getCoursePalette } from "@/lib/course-colors";

const AUTO_COMPLETABLE_TYPES = new Set<TrackItemType>([
  TrackItemType.RESOURCE,
  TrackItemType.TEXT,
  TrackItemType.CHECKPOINT,
]);

type CheckpointQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

function isCheckpointConfig(
  config: unknown
): config is { questions: CheckpointQuestion[] } {
  return (
    !!config &&
    typeof config === "object" &&
    Array.isArray((config as { questions?: unknown }).questions)
  );
}

function isCriteriaConfig(config: unknown): config is { criteria: string[] } {
  return (
    !!config &&
    typeof config === "object" &&
    Array.isArray((config as { criteria?: unknown }).criteria)
  );
}

function Quiz({
  questions,
  onAllCorrect,
}: {
  questions: CheckpointQuestion[];
  onAllCorrect: (allCorrect: boolean) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    const next = { ...answers, [questionIndex]: optionIndex };
    setAnswers(next);
    const allAnswered = questions.every((_, i) => next[i] !== undefined);
    const allCorrect =
      allAnswered && questions.every((q, i) => next[i] === q.correctIndex);
    onAllCorrect(allCorrect);
  };

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, qIndex) => (
        <div key={qIndex}>
          <p className="text-[15px] font-semibold">{question.question}</p>
          <div className="mt-2.5 flex flex-col gap-2">
            {question.options.map((option, oIndex) => {
              const selected = answers[qIndex] === oIndex;
              const isCorrectOption = oIndex === question.correctIndex;
              return (
                <button
                  key={oIndex}
                  type="button"
                  onClick={() => handleSelect(qIndex, oIndex)}
                  className={cn(
                    "flex items-center gap-3 rounded-[13px] border-2 px-4 py-3 text-left text-sm font-semibold transition-colors",
                    selected && isCorrectOption
                      ? "border-primary bg-primary/5 text-primary"
                      : selected
                        ? "border-destructive/50 bg-destructive/5 text-destructive"
                        : "border-border text-foreground/80 hover:bg-secondary/40"
                  )}
                >
                  <span
                    className={cn(
                      "h-5 w-5 shrink-0 rounded-full border-2",
                      selected && isCorrectOption
                        ? "border-primary bg-primary"
                        : selected
                          ? "border-destructive"
                          : "border-border"
                    )}
                  />
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const MAX_PROOF_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function ProofSubmissionForm({
  item,
  rejectionFeedback,
  onSubmitted,
}: {
  item: TrackItem;
  rejectionFeedback?: string | null;
  onSubmitted: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const postSubmission = usePostSubmissionService();
  const uploadFile = useFileUploadService();

  const [proofUrl, setProofUrl] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PROOF_FILE_SIZE) {
      setError("O arquivo deve ter no máximo 5 MB.");
      return;
    }
    setError("");
    setProofFile(file);
    setUploading(true);
    try {
      const { status, data } = await uploadFile(file);
      if (status === HTTP_CODES_ENUM.CREATED) {
        setUploadedUrl(data.file.path);
      } else {
        setProofFile(null);
        setError("Erro ao enviar o arquivo. Tente novamente.");
      }
    } catch {
      setProofFile(null);
      setError("Erro ao enviar o arquivo. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    setUploadedUrl(null);
  };

  const effectiveProofUrl = uploadedUrl ?? proofUrl.trim();

  const handleSubmit = async () => {
    if (!effectiveProofUrl) {
      setError("Cole o link do repositório/comprovante ou anexe um print.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { status, data } = await postSubmission({
        trackItemId: item.id,
        isTestOut: false,
        proofUrl: effectiveProofUrl,
        description: description.trim() || undefined,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Prova enviada! Aguarde a revisão da moderação.", {
          variant: "success",
        });
        onSubmitted();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao enviar a prova."), {
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-2 space-y-4">
      {rejectionFeedback && (
        <div className="flex items-start gap-2.5 rounded-2xl border-2 border-destructive/30 bg-destructive/[0.03] p-4">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-bold text-destructive">
              Ajuste solicitado pela moderação
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {rejectionFeedback}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-bold">
          Link do repositório/comprovante
        </label>
        <input
          value={proofUrl}
          onChange={(e) => {
            setProofUrl(e.target.value);
            setError("");
          }}
          placeholder="https://github.com/seu-usuario/seu-repo"
          disabled={!!uploadedUrl}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          ou anexe um print (opcional)
        </label>
        {proofFile ? (
          <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 py-2">
            {uploading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-4 w-4 shrink-0 text-emerald-500" />
            )}
            <span className="flex-1 truncate text-sm">{proofFile.name}</span>
            {!uploading && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-input px-3 py-4 text-center transition-colors hover:border-primary/50 hover:bg-primary/5">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              JPG, PNG ou GIF · Máx. 5 MB
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Notas para o moderador (opcional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Algo que ajude na avaliação..."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={submitting || uploading}
        className="w-full rounded-2xl py-6 text-[15px] font-bold"
      >
        {submitting ? "Enviando..." : "Enviar prova"}
      </Button>
    </div>
  );
}

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

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            n <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function RateMaterialDialog({
  course,
  open,
  onClose,
  onRated,
}: {
  course: Course;
  open: boolean;
  onClose: () => void;
  onRated: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const createReview = useCreateCourseReviewService();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { status, data } = await createReview({
        courseId: course.id,
        rating,
        comment: comment.trim() || null,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Avaliação enviada! Você ganhou XP de comunidade.", {
          variant: "success",
        });
        setRating(0);
        setComment("");
        onRated();
        onClose();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao enviar avaliação."), {
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            Avaliar &quot;{course.title}&quot;
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="O que achou deste material? (opcional)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={rating === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuggestMaterialDialog({
  trackItemId,
  profileId,
  open,
  onClose,
  onCreated,
}: {
  trackItemId: string;
  profileId: string | null;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("");
  const [url, setUrl] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const createCourse = useCreateCourseService();

  const canSubmit = title.trim().length > 0 && url.trim().length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { status, data } = await createCourse({
        title: title.trim(),
        description: description.trim() || null,
        provider: provider.trim() || null,
        url: url.trim(),
        isFree,
        price: isFree ? null : Number(price) || null,
        submittedByProfileId: profileId,
        trackItemId,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(
          "Sugestão enviada! Vai aparecer aqui após passar pela moderação.",
          { variant: "success" }
        );
        setTitle("");
        setDescription("");
        setProvider("");
        setUrl("");
        setIsFree(true);
        setPrice("");
        onCreated();
        onClose();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao cadastrar material."), {
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Sugerir curso ou vídeo
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Sugira um material sobre este assunto. Ele entra como pendente e só
          aparece aqui depois de verificado pela moderação.
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
            <label className="text-xs font-medium">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Resumo curto do que o material aborda..."
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
            <label className="text-xs font-medium">Link *</label>
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
              id="isFreeMaterial"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="isFreeMaterial" className="text-sm">
              Gratuito
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
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Enviando..." : "Sugerir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CourseTopicSection({ item }: { item: TrackItem }) {
  const fetchCourses = useGetCoursesByTrackItemService();
  const fetchCourseReviews = useGetCourseReviewsByCourseService();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const queryClient = useQueryClient();

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [ratingCourse, setRatingCourse] = useState<Course | null>(null);

  const coursesQueryKey = ["trilha-marco-courses", item.id];

  const { data: courses } = useQuery({
    queryKey: coursesQueryKey,
    queryFn: async () => {
      const { status, data } = await fetchCourses(item.id);
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [] as Course[];
    },
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-gamification-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
  });

  const courseIds = (courses ?? []).map((c) => c.id);
  const reviewsQueryKey = ["trilha-marco-course-reviews", item.id, courseIds];

  const { data: reviewsByCourse } = useQuery({
    queryKey: reviewsQueryKey,
    queryFn: async () => {
      const entries = await Promise.all(
        courseIds.map(async (courseId) => {
          const { status, data } = await fetchCourseReviews(courseId);
          return [courseId, status === HTTP_CODES_ENUM.OK ? data : []] as [
            string,
            CourseReview[],
          ];
        })
      );
      return Object.fromEntries(entries) as Record<string, CourseReview[]>;
    },
    enabled: courseIds.length > 0,
  });

  const hasRatedAny = (courses ?? []).some((c) =>
    (reviewsByCourse?.[c.id] ?? []).some((r) => r.profileId === myProfile?.id)
  );

  return (
    <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_6px_0_var(--border)]">
      <h2 className="text-sm font-bold">Cursos e vídeos sobre este assunto</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Materiais sugeridos pela comunidade e verificados pela moderação.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full gap-1.5"
        onClick={() => setSuggestOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Sugerir material
      </Button>

      {!courses || courses.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={GraduationCap}
            title="Nenhum material ainda"
            description="Sugira um curso ou vídeo para a comunidade avaliar."
            className="py-8"
          />
        </div>
      ) : (
        <>
          {!hasRatedAny && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/[0.03] p-3">
              <Star className="h-3.5 w-3.5 shrink-0 text-primary" />
              <p className="text-xs">
                Avalie um material e ganhe XP de comunidade.
              </p>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-3">
            {courses.map((course) => {
              const reviews = reviewsByCourse?.[course.id] ?? [];
              const avg =
                reviews.length > 0
                  ? reviews.reduce((sum, r) => sum + r.rating, 0) /
                    reviews.length
                  : 0;
              const style = getCoursePalette(course.id);

              return (
                <div
                  key={course.id}
                  className="relative flex flex-col gap-2.5 rounded-[24px] border bg-background p-5 transition-transform hover:-translate-y-0.5"
                  style={{
                    borderColor: style.ring,
                    boxShadow: `0 9px 0 ${style.shadow}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 relative z-10">
                    <h3 className="text-base font-bold leading-snug">
                      <Link
                        href={`/cursos/${course.id}`}
                        className="hover:underline text-foreground"
                      >
                        {course.title}
                      </Link>
                    </h3>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
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
                  {course.provider && (
                    <p className="text-xs text-muted-foreground">
                      {course.provider}
                    </p>
                  )}
                  {course.description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <StarsDisplay rating={avg} />
                    <span className="text-xs text-muted-foreground">
                      {reviews.length > 0
                        ? `${avg.toFixed(1)} (${reviews.length})`
                        : "Sem avaliações"}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      render={<Link href={`/cursos/${course.id}`} />}
                    >
                      Ver Detalhes
                    </Button>
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Acessar
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SuggestMaterialDialog
        trackItemId={item.id}
        profileId={myProfile?.id ?? null}
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: coursesQueryKey })
        }
      />

      {ratingCourse && (
        <RateMaterialDialog
          course={ratingCourse}
          open={!!ratingCourse}
          onClose={() => setRatingCourse(null)}
          onRated={() =>
            queryClient.invalidateQueries({ queryKey: reviewsQueryKey })
          }
        />
      )}
    </div>
  );
}

function CompleteMilestonePageContent() {
  const params = useParams();
  const trackId = params.id as string;
  const itemId = params.itemId as string;
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const fetchOverview = useGetLearningTrackOverviewService();
  const fetchProgress = useGetLearningTrackProgressService();
  const completeItem = useCompleteTrackItemService();
  const fetchMySubmissions = useGetMySubmissionsService();
  const postSkipSubmission = usePostSubmissionService();
  const router = useRouter();

  const [quizPassed, setQuizPassed] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [justCompleted, setJustCompleted] = useState<number | null>(null);

  const { data: mySubmissions, refetch: refetchMySubmissions } = useQuery({
    queryKey: ["my-submissions", "trilhas"],
    queryFn: async () => {
      const { status, data } = await fetchMySubmissions({
        page: 1,
        limit: 100,
      });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
  });

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["learning-track-overview", trackId],
    queryFn: async () => {
      const { status, data } = await fetchOverview({ id: trackId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!trackId,
  });

  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["learning-track-progress", trackId],
    queryFn: async () => {
      const { status, data } = await fetchProgress({ id: trackId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!trackId,
  });

  const items = useMemo(
    () => overview?.sections.flatMap((s) => s.items) ?? [],
    [overview]
  );
  const item = useMemo(
    () => items.find((i) => i.id === itemId) ?? null,
    [items, itemId]
  );
  const section = useMemo(
    () => overview?.sections.find((s) => s.section.id === item?.sectionId),
    [overview, item]
  );

  const itemIndex = item ? items.findIndex((i) => i.id === item.id) : -1;
  const currentIndex = useMemo(() => {
    if (!progress) return -1;
    if (progress.isCompleted) return items.length;
    if (!progress.currentItemId) return -1;
    return items.findIndex((i) => i.id === progress.currentItemId);
  }, [items, progress]);

  const isDone = itemIndex >= 0 && itemIndex < currentIndex;
  const isLocked = itemIndex >= 0 && itemIndex > currentIndex;
  const isLoading = isLoadingOverview || isLoadingProgress;

  const nextItem =
    itemIndex >= 0 && itemIndex + 1 < items.length
      ? items[itemIndex + 1]
      : null;
  const canSkipToProof =
    nextItem?.type === TrackItemType.PROOF && nextItem.allowsTestOut;
  const isTrackFinished = itemIndex >= 0 && itemIndex === items.length - 1;

  // Section-scoped progress for the sidebar brick strip.
  const sectionItems = section?.items ?? [];
  const sectionDone = sectionItems.filter((sItem) => {
    const idx = items.findIndex((i) => i.id === sItem.id);
    return idx >= 0 && idx < currentIndex;
  }).length;

  const sectionJustFinished =
    !!section?.section.badgeId &&
    sectionItems.length > 0 &&
    sectionDone === sectionItems.length;

  const myItemSubmission = useMemo(() => {
    if (!item) return null;
    const matches = (mySubmissions ?? []).filter(
      (s) => s.trackItemId === item.id
    );
    if (matches.length === 0) return null;
    return matches.reduce((latest, s) =>
      new Date(s.createdAt) > new Date(latest.createdAt) ? s : latest
    );
  }, [mySubmissions, item]);

  const handleComplete = async () => {
    if (!item) return;
    setCompleting(true);
    try {
      const { status, data } = await completeItem({ id: item.id });
      if (status === HTTP_CODES_ENUM.OK || status === HTTP_CODES_ENUM.CREATED) {
        setJustCompleted(data.awardedJourneyXp);
        enqueueSnackbar("Marco concluído!", { variant: "success" });
        await queryClient.invalidateQueries({
          queryKey: ["learning-track-progress", trackId],
        });
      } else {
        enqueueSnackbar(
          "Não foi possível concluir este marco agora. Tente novamente.",
          { variant: "error" }
        );
      }
    } finally {
      setCompleting(false);
    }
  };

  // "Já domino esse assunto": conclui o marco de conteúdo atual e já envia a
  // prova do próximo marco como test-out (sem comprovante), indo pra
  // moderação como qualquer prova — o usuário só vê o resultado depois que
  // um moderador aprovar.
  const handleSkipToNextProof = async () => {
    if (!item || !nextItem) return;
    setSkipping(true);
    try {
      const completeRes = await completeItem({ id: item.id });
      if (
        completeRes.status !== HTTP_CODES_ENUM.OK &&
        completeRes.status !== HTTP_CODES_ENUM.CREATED
      ) {
        enqueueSnackbar(
          "Não foi possível concluir este marco agora. Tente novamente.",
          { variant: "error" }
        );
        return;
      }

      const { status, data } = await postSkipSubmission({
        trackItemId: nextItem.id,
        isTestOut: true,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Marco concluído! Prova pulada.", {
          variant: "success",
        });
        await queryClient.invalidateQueries({
          queryKey: ["learning-track-progress", trackId],
        });
        router.push(`/trilhas/${trackId}/marcos/${nextItem.id}`);
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao pular a prova."), {
          variant: "error",
        });
      }
    } finally {
      setSkipping(false);
    }
  };

  // Pular a prova atual direto desta página (para quem chega aqui sem passar
  // pelo conteúdo anterior, ou volta depois — o botão de pular no conteúdo
  // some de vista quando isso acontece).
  const handleSkipThisProof = async () => {
    if (!item) return;
    setSkipping(true);
    try {
      const { status, data } = await postSkipSubmission({
        trackItemId: item.id,
        isTestOut: true,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Prova pulada! Você já pode seguir em frente.", {
          variant: "success",
        });
        await refetchMySubmissions();
        await queryClient.invalidateQueries({
          queryKey: ["learning-track-progress", trackId],
        });
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao pular a prova."), {
          variant: "error",
        });
      }
    } finally {
      setSkipping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-52 animate-pulse rounded-[22px] bg-muted" />
      </div>
    );
  }

  if (!overview || !item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={Map}
          title="Marco não encontrado"
          description="Este marco não existe ou não pertence a esta trilha."
          action={{
            label: "Voltar para a trilha",
            href: `/trilhas/${trackId}`,
          }}
        />
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={Map}
          title="Este marco ainda não foi liberado"
          description="Conclua os marcos anteriores da trilha para chegar até aqui."
          action={{
            label: "Voltar para a trilha",
            href: `/trilhas/${trackId}`,
          }}
        />
      </div>
    );
  }

  const isAutoCompletable = AUTO_COMPLETABLE_TYPES.has(item.type);
  const alreadyDone = isDone || justCompleted !== null;
  const badge = TRACK_ITEM_TYPE_BADGE[item.type];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <Link
        href={`/trilhas/${trackId}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {overview.track.title}
        {section && (
          <>
            <span>/</span>
            <span className="font-semibold text-foreground">
              {section.section.title}
            </span>
          </>
        )}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-5">
          {alreadyDone ? (
            <>
              <div className="rounded-[22px] border border-border bg-card p-7 shadow-[0_6px_0_var(--border)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">Marco concluído</p>
                    <p className="text-sm text-muted-foreground">
                      {justCompleted !== null && justCompleted > 0
                        ? `Você ganhou ${justCompleted} XP de Jornada.`
                        : "Este marco já faz parte da sua caminhada nesta trilha."}
                    </p>
                    {myItemSubmission?.status ===
                      SubmissionStatusEnum.PENDING &&
                      !myItemSubmission.isTestOut && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          Sua prova ainda está aguardando revisão de um
                          moderador — o XP de Jornada é liberado assim que for
                          aprovada.
                        </p>
                      )}
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  {sectionJustFinished && section && (
                    <Button
                      variant="outline"
                      className="mb-3 w-full justify-between gap-2 rounded-2xl py-6 text-[15px] font-bold border-accent/40 text-accent hover:bg-accent/5"
                      render={
                        <Link
                          href={`/trilhas/${trackId}/conquista/${section.section.id}`}
                        />
                      }
                    >
                      <span className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 shrink-0" />
                        Ver selo conquistado
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  )}
                  {nextItem ? (
                    <Button
                      className="w-full justify-between gap-2 rounded-2xl py-6 text-[15px] font-bold"
                      render={
                        <Link
                          href={`/trilhas/${trackId}/marcos/${nextItem.id}`}
                        />
                      }
                    >
                      <span className="flex flex-col items-start text-left">
                        <span className="font-mono text-[11px] font-normal uppercase tracking-wide text-primary-foreground/70">
                          próximo marco
                        </span>
                        {nextItem.title}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  ) : isTrackFinished ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-accent/10 p-4">
                      <Trophy className="h-6 w-6 shrink-0 text-accent" />
                      <div>
                        <p className="font-bold">Trilha concluída!</p>
                        <p className="text-sm text-muted-foreground">
                          Você percorreu todos os marcos desta trilha.
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <Link
                    href={`/trilhas/${trackId}`}
                    className="mt-3 inline-block text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Voltar para a trilha
                  </Link>
                </div>
              </div>

              <CourseTopicSection item={item} />
            </>
          ) : (
            <div className="rounded-[22px] border border-border bg-card p-7 shadow-[0_6px_0_var(--border)]">
              <span
                className="inline-block rounded-md px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-white"
                style={{ background: badge.color.bg }}
              >
                {badge.abbr}
              </span>
              <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-tight">
                {item.title}
              </h1>
              {item.body && (
                <MarkdownContent
                  content={item.body}
                  className="mt-3 max-w-none text-sm leading-relaxed text-muted-foreground"
                />
              )}

              {item.type === TrackItemType.CHECKPOINT &&
              isCheckpointConfig(item.config) ? (
                <>
                  <div className="mt-6 border-t border-border pt-6">
                    <Quiz
                      questions={item.config.questions}
                      onAllCorrect={setQuizPassed}
                    />
                  </div>

                  <div className="mt-6">
                    <CourseTopicSection item={item} />
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={handleComplete}
                      disabled={!quizPassed || completing}
                      className="w-full rounded-2xl py-6 text-[15px] font-bold"
                    >
                      {completing ? "Concluindo..." : "Concluir marco"}
                    </Button>
                  </div>
                </>
              ) : isAutoCompletable ? (
                <>
                  <div className="mt-6">
                    <CourseTopicSection item={item} />
                  </div>

                  <div className="mt-6 flex flex-col gap-4 rounded-2xl border-2 border-border p-4 sm:flex-row sm:items-center">
                    <Circle className="hidden h-6 w-6 shrink-0 text-muted-foreground sm:block" />
                    <div className="flex-1">
                      <p className="text-sm font-bold">
                        Já estudei este conteúdo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {canSkipToProof
                          ? "Marque quando concluir para seguir na trilha, ou pule direto para o próximo marco se já domina o assunto."
                          : "Marque quando concluir para seguir na trilha."}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {canSkipToProof && (
                        <Button
                          variant="outline"
                          onClick={handleSkipToNextProof}
                          disabled={completing || skipping}
                          className="gap-1.5 rounded-xl"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          {skipping ? "..." : "Já domino esse assunto"}
                        </Button>
                      )}
                      <Button
                        onClick={handleComplete}
                        disabled={completing || skipping}
                        className="gap-1.5 rounded-xl"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {completing ? "..." : "Concluir"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : item.type === TrackItemType.PROOF ? (
                <>
                  <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-5">
                    <div className="mb-3 flex items-center gap-2.5 text-sm font-bold text-primary">
                      <ShieldCheck className="h-4.5 w-4.5" />
                      Este marco exige comprovação
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Marcos de prova prática são validados por um moderador da
                      comunidade.
                    </p>
                    {isCriteriaConfig(item.config) && (
                      <div>
                        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          O que será avaliado
                        </p>
                        <ul className="flex flex-col gap-2 text-sm">
                          {item.config.criteria.map((criterion, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-bold text-primary">
                                {i + 1}
                              </span>
                              {criterion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <CourseTopicSection item={item} />
                  </div>

                  <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-5">
                    {myItemSubmission?.status ===
                    SubmissionStatusEnum.PENDING ? (
                      <div className="flex items-center gap-2.5 rounded-2xl border-2 border-border bg-muted/40 p-4">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-bold">
                            Prova enviada, aguardando revisão
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Um moderador vai avaliar seu envio em breve.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {item.allowsTestOut && (
                          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-border p-4">
                            <div>
                              <p className="text-sm font-bold">
                                Já domina esse assunto?
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Declare que já sabe e conclua este marco na
                                hora, sem enviar comprovante nem esperar
                                moderação.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={handleSkipThisProof}
                              disabled={completing || skipping}
                              className="shrink-0 gap-1.5 rounded-xl"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              {skipping ? "..." : "Já domino, concluir"}
                            </Button>
                          </div>
                        )}
                        <ProofSubmissionForm
                          item={item}
                          rejectionFeedback={
                            myItemSubmission?.status ===
                            SubmissionStatusEnum.REJECTED
                              ? myItemSubmission.feedback
                              : null
                          }
                          onSubmitted={async () => {
                            await refetchMySubmissions();
                            await queryClient.invalidateQueries({
                              queryKey: ["learning-track-progress", trackId],
                            });
                          }}
                        />
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-5">
                    <div className="mb-3 flex items-center gap-2.5 text-sm font-bold text-primary">
                      <ShieldCheck className="h-4.5 w-4.5" />
                      Este marco exige comprovação
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Este marco depende de uma comprovação vinculada a outro
                      recurso da comunidade (curso, evento ou missão), que ainda
                      está sendo integrada nesta trilha.
                    </p>
                    {isCriteriaConfig(item.config) && (
                      <div>
                        <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          O que será avaliado
                        </p>
                        <ul className="flex flex-col gap-2 text-sm">
                          {item.config.criteria.map((criterion, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-bold text-primary">
                                {i + 1}
                              </span>
                              {criterion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <CourseTopicSection item={item} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {section && (
            <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_6px_0_var(--border)]">
              <p className="font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.section.title} · progresso
              </p>
              <div className="mt-3.5 flex gap-1.5">
                {sectionItems.map((sItem) => {
                  const idx = items.findIndex((i) => i.id === sItem.id);
                  const st =
                    idx < currentIndex
                      ? "done"
                      : idx === currentIndex
                        ? "cur"
                        : "todo";
                  return (
                    <span
                      key={sItem.id}
                      className={cn(
                        "h-3.5 flex-1 rounded-md",
                        st === "done" && "bg-primary",
                        st === "cur" && "bg-primary/40 ring-2 ring-primary",
                        st === "todo" && "bg-muted"
                      )}
                    />
                  );
                })}
              </div>
              <p className="mt-2.5 font-mono text-[11px] text-muted-foreground">
                {sectionDone} de {sectionItems.length} marcos concluídos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(CompleteMilestonePageContent);
