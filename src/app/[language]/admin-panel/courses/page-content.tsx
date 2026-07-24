"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import {
  useGetPendingCoursesService,
  useReviewCourseService,
} from "@/services/api/services/courses";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Course } from "@/services/api/types/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Globe,
  DollarSign,
  User,
} from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

function ModerationCard({
  course,
  onReviewed,
}: {
  course: Course;
  onReviewed: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const reviewCourse = useReviewCourseService();
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { status, data } = await reviewCourse({
        id: course.id,
        status: "VERIFIED",
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Curso aprovado!", { variant: "success" });
        onReviewed();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao aprovar."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const { status, data } = await reviewCourse({
        id: course.id,
        status: "REJECTED",
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Curso rejeitado.", { variant: "success" });
        onReviewed();
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao rejeitar."), {
          variant: "error",
        });
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-[17px] font-semibold">
            {course.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Enviado por: {course.submittedByProfileId || "Desconhecido"}
          </div>
        </div>
        <Badge className="shrink-0 bg-accent text-accent-foreground">
          Pendente
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
          className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={handleApprove}
          disabled={processing}
        >
          <CheckCircle2 className="h-4 w-4" />
          Aprovar
        </Button>
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={handleReject}
          disabled={processing}
        >
          <XCircle className="h-4 w-4" />
          Rejeitar
        </Button>
      </div>
    </div>
  );
}

function AdminCoursesPageContent() {
  const fetchPending = useGetPendingCoursesService();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pending-courses", page],
    queryFn: async () => {
      const { status, data } = await fetchPending({ page, limit: 20 });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const courses = data?.data ?? [];
  const hasNextPage = data?.hasNextPage ?? false;

  const handleReviewed = () => {
    queryClient.invalidateQueries({ queryKey: ["pending-courses"] });
    refetch();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Moderação
        </p>
        <h1 className="flex items-center gap-2 font-heading text-[28px] font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Fila de cursos pendentes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revise os cursos enviados pela comunidade antes que fiquem disponíveis
          na plataforma.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum curso pendente no momento 🎉"
        />
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <ModerationCard
              key={course.id}
              course={course}
              onReviewed={handleReviewed}
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
    </div>
  );
}

export default withPageRequiredAuth(AdminCoursesPageContent, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
