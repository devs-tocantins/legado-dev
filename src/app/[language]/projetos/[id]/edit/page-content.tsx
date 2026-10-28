"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useGetProjectIdeaForManagementService } from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { EmptyState } from "@/components/ui/empty-state";
import { useSnackbar } from "@/hooks/use-snackbar";
import { ProjectIdeaStatus } from "@/services/api/types/project";
import { IdeaForm } from "../../idea-form";

function EditProjectIdeaPageContent() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const fetchIdea = useGetProjectIdeaForManagementService();

  const { data: idea, isLoading } = useQuery({
    queryKey: ["project-idea-edit", id],
    queryFn: async () => {
      const { status, data } = await fetchIdea({ id });
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <EmptyState
          icon={Lightbulb}
          title="Ideia não encontrada"
          description="Ela não existe ou você não tem permissão para editá-la."
          action={{ label: "Voltar", href: "/projetos/mine" }}
        />
      </div>
    );
  }

  const resubmitting = idea.status === ProjectIdeaStatus.REJECTED;

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8">
      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Editar ideia
        </p>
        <h1 className="font-heading text-[28px] font-bold tracking-tight">
          {idea.title}
        </h1>
        {resubmitting && (
          <p className="mt-1 text-sm text-muted-foreground">
            Ao salvar, a ideia volta para análise de um moderador.
          </p>
        )}
      </div>

      <IdeaForm
        idea={idea}
        onSuccess={() => {
          enqueueSnackbar(
            resubmitting
              ? "Ideia reenviada para análise."
              : "Ideia atualizada.",
            { variant: "success" }
          );
          router.push("/projetos/mine");
        }}
      />
    </div>
  );
}

export default withPageRequiredAuth(EditProjectIdeaPageContent);
