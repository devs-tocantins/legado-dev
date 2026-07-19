"use client";

import { useEffect } from "react";
import {
  useForm,
  FormProvider,
  useFormState,
  useWatch,
  Controller,
} from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useQuery } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  useCreateLearningTrackService,
  useGetLearningTracksService,
} from "@/services/api/services/learning-tracks";
import {
  LearningTrackStatus,
  LearningTrackTier,
} from "@/services/api/types/learning-track";
import { useRouter } from "next/navigation";
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
import { RoleEnum } from "@/services/api/types/role";
import { ChevronLeft } from "lucide-react";

type CreateFormData = {
  slug: string;
  title: string;
  description: string;
  area: string;
  tier: LearningTrackTier;
  status: LearningTrackStatus;
  requiresTrackId: string;
};

const TIER_LABELS: Record<LearningTrackTier, string> = {
  ALICERCE: "Alicerce (fundamentos)",
  PILAR: "Pilar (especialização)",
  ARCO: "Arco (avançado)",
};

const STATUS_LABELS: Record<LearningTrackStatus, string> = {
  DRAFT: "Rascunho (não visível para usuários)",
  PUBLISHED: "Publicada",
  ARCHIVED: "Arquivada",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const useValidationSchema = () =>
  yup.object().shape({
    slug: yup
      .string()
      .required("Slug é obrigatório")
      .matches(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e -"),
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
      .default(LearningTrackStatus.DRAFT),
    requiresTrackId: yup.string().default(""),
  });

function CreateTrackFormActions() {
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      Criar e continuar
    </Button>
  );
}

function FormCreateLearningTrack() {
  const router = useRouter();
  const fetchCreate = useCreateLearningTrackService();
  const fetchTracks = useGetLearningTracksService();
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const { data: existingTracks } = useQuery({
    queryKey: ["admin-learning-tracks-select"],
    queryFn: async () => {
      const { status, data } = await fetchTracks({ page: 1, limit: 100 });
      if (status === HTTP_CODES_ENUM.OK) return data.data;
      return [];
    },
  });

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      slug: "",
      title: "",
      description: "",
      area: "",
      tier: LearningTrackTier.ALICERCE,
      status: LearningTrackStatus.DRAFT,
      requiresTrackId: "",
    },
  });

  const { handleSubmit, setError, control, setValue } = methods;
  const title = useWatch({ control, name: "title" });
  const slug = useWatch({ control, name: "slug" });

  useEffect(() => {
    if (title && !slug) {
      setValue("slug", slugify(title), { shouldDirty: false });
    }
  }, [title, slug, setValue]);

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchCreate({
      slug: formData.slug,
      title: formData.title,
      description: formData.description || undefined,
      area: formData.area,
      tier: formData.tier,
      status: formData.status,
      requiresTrackId: formData.requiresTrackId || undefined,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys((data as any).errors) as Array<keyof CreateFormData>
      ).forEach((key) =>
        setError(key, { type: "manual", message: (data as any).errors[key] })
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar("Trilha criada. Agora adicione as seções e marcos.", {
        variant: "success",
      });
      router.push(`/admin-panel/learning-tracks/edit/${data.id}`);
    } else {
      enqueueSnackbar("Erro ao criar trilha", { variant: "error" });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-lg p-6">
        <div className="mb-4">
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
        <Card>
          <CardHeader>
            <CardTitle>Criar Trilha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<CreateFormData>
                name="title"
                testId="title"
                label="Título"
              />
              <FormTextInput<CreateFormData>
                name="slug"
                testId="slug"
                label="Slug (URL)"
              />
              <FormTextInput<CreateFormData>
                name="description"
                testId="description"
                label="Descrição"
                multiline
                minRows={2}
              />
              <FormTextInput<CreateFormData>
                name="area"
                testId="area"
                label="Área (ex: backend, frontend, dados)"
              />

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
                          Object.keys(STATUS_LABELS) as LearningTrackStatus[]
                        ).map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Pré-requisito (opcional)</Label>
                <Controller
                  control={control}
                  name="requiresTrackId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {(existingTracks ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Se definido, o usuário só pode se matricular após concluir a
                  trilha selecionada.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <CreateTrackFormActions />
                <Button
                  variant="secondary"
                  render={<Link href="/admin-panel/learning-tracks" />}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function CreateLearningTrack() {
  return <FormCreateLearningTrack />;
}

export default withPageRequiredAuth(CreateLearningTrack, {
  roles: [RoleEnum.ADMIN, RoleEnum.MODERATOR],
});
