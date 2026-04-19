"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect } from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetSubmissionService,
  usePatchSubmissionService,
} from "@/services/api/services/submissions";
import { useGetActivityService } from "@/services/api/services/activities";
import { useGetGamificationProfileService } from "@/services/api/services/gamification-profiles";
import { useParams } from "next/navigation";
import { SubmissionStatusEnum } from "@/services/api/types/submission";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import { MarkdownContent } from "@/components/markdown-editor";
import FormSelectInput from "@/components/form/select/form-select-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  FileText,
  Link2,
  Calendar,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Info,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EditFormData = {
  status: { id: string };
  feedback: string;
  proofUrl: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-submissions-edit");
  return yup.object().shape({
    status: yup
      .object()
      .shape({ id: yup.string().required() })
      .required(
        t("admin-panel-submissions-edit:inputs.status.validation.required")
      ),
    feedback: yup.string().default(""),
    proofUrl: yup.string().default(""),
  });
};

function EditFormActions() {
  const { t } = useTranslation("admin-panel-submissions-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-submissions-edit:actions.submit")}
    </Button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED")
    return (
      <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Aprovada
      </Badge>
    );
  if (status === "REJECTED")
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Rejeitada
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      Pendente
    </Badge>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium break-words">{value}</div>
      </div>
    </div>
  );
}

function FormEditSubmission() {
  const params = useParams<{ id: string }>();
  const submissionId = params.id;
  const fetchGet = useGetSubmissionService();
  const fetchPatch = usePatchSubmissionService();
  const fetchActivity = useGetActivityService();
  const fetchProfile = useGetGamificationProfileService();
  const { t } = useTranslation("admin-panel-submissions-edit");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { status: undefined, feedback: "", proofUrl: "" },
  });

  const { handleSubmit, setError, reset } = methods;

  const { data: submission } = useQuery({
    queryKey: ["submission-review", submissionId],
    queryFn: async () => {
      const { status, data } = await fetchGet({ id: submissionId });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!submissionId,
  });

  const { data: activity } = useQuery({
    queryKey: ["activity-review", submission?.activityId],
    queryFn: async () => {
      const { status, data } = await fetchActivity({
        id: submission!.activityId,
      });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!submission?.activityId,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-review", submission?.profileId],
    queryFn: async () => {
      const { status, data } = await fetchProfile({
        id: submission!.profileId,
      });
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!submission?.profileId,
  });

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatch({
      id: submissionId,
      data: {
        status: formData.status.id,
        feedback: formData.feedback || undefined,
        proofUrl: formData.proofUrl || undefined,
      },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach((key) => {
        setError(key, {
          type: "manual",
          message: t(
            `admin-panel-submissions-edit:inputs.${key}.validation.server.${data.errors[key]}`
          ),
        });
      });
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(
        t("admin-panel-submissions-edit:alerts.submission.success"),
        { variant: "success" }
      );
    }
  });

  useEffect(() => {
    if (submission) {
      reset({
        status: submission.status ? { id: submission.status } : undefined,
        feedback: submission.feedback ?? "",
        proofUrl: submission.proofUrl ?? "",
      });
    }
  }, [submission, reset]);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -ml-2"
        render={<Link href="/admin-panel/submissions" />}
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para submissões
      </Button>

      {/* Submitter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile ? (
            <>
              <InfoRow
                icon={User}
                label="Username"
                value={<span className="font-mono">@{profile.username}</span>}
              />
              {(profile.firstName || profile.lastName) && (
                <InfoRow
                  icon={User}
                  label="Nome"
                  value={`${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()}
                />
              )}
              <InfoRow
                icon={Zap}
                label="XP Total"
                value={`${profile.totalXp} XP`}
              />
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  render={
                    <Link href={`/u/${profile.username}`} target="_blank" />
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver perfil público
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Carregando perfil…</p>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Atividade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity ? (
            <>
              <InfoRow icon={FileText} label="Título" value={activity.title} />
              {activity.description && (
                <InfoRow
                  icon={FileText}
                  label="Descrição / Critérios"
                  value={
                    <MarkdownContent
                      content={activity.description}
                      className="text-muted-foreground mt-0.5"
                    />
                  }
                />
              )}
              <div className="flex flex-wrap gap-4 pt-1">
                <InfoRow
                  icon={Zap}
                  label="Recompensa"
                  value={`${activity.fixedReward} XP`}
                />
                <InfoRow
                  icon={Clock}
                  label="Cooldown"
                  value={`${activity.cooldownHours}h`}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {activity.requiresProof && (
                  <Badge variant="outline" className="text-xs">
                    Exige comprovante
                  </Badge>
                )}
                {activity.requiresDescription && (
                  <Badge variant="outline" className="text-xs">
                    Exige descrição
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Carregando atividade…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submission details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Submissão
            {submission && <StatusBadge status={submission.status} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {submission ? (
            <>
              <InfoRow
                icon={Calendar}
                label="Data"
                value={new Date(submission.createdAt).toLocaleString("pt-BR")}
              />
              {submission.description ? (
                <InfoRow
                  icon={FileText}
                  label="Descrição do usuário"
                  value={
                    <p className="text-sm whitespace-pre-wrap bg-muted rounded-md px-3 py-2 mt-1">
                      {submission.description}
                    </p>
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Sem descrição informada.
                </p>
              )}
              {submission.proofUrl && (
                <InfoRow
                  icon={Link2}
                  label="Comprovante"
                  value={
                    <a
                      href={submission.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline flex items-center gap-1"
                    >
                      {submission.proofUrl}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  }
                />
              )}
              {submission.feedback && (
                <InfoRow
                  icon={FileText}
                  label="Feedback atual"
                  value={submission.feedback}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Carregando submissão…
            </p>
          )}
        </CardContent>
      </Card>

      {/* Review form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Decisão de revisão</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormSelectInput<EditFormData, { id: string }>
                name="status"
                testId="status"
                label={t("admin-panel-submissions-edit:inputs.status.label")}
                options={Object.values(SubmissionStatusEnum).map((v) => ({
                  id: v,
                }))}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-submissions-edit:inputs.status.options.${option.id}`
                  )
                }
              />
              <FormTextInput<EditFormData>
                name="feedback"
                testId="feedback"
                label={t("admin-panel-submissions-edit:inputs.feedback.label")}
                multiline
                minRows={3}
              />
              <FormTextInput<EditFormData>
                name="proofUrl"
                testId="proofUrl"
                label={t("admin-panel-submissions-edit:inputs.proofUrl.label")}
              />
              <div className="flex gap-2 pt-2">
                <EditFormActions />
                <Button
                  variant="secondary"
                  render={<Link href="/admin-panel/submissions" />}
                >
                  {t("admin-panel-submissions-edit:actions.cancel")}
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}

function EditSubmission() {
  return <FormEditSubmission />;
}
export default withPageRequiredAuth(EditSubmission);
