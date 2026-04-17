"use client";

import {
  useForm,
  FormProvider,
  useFormState,
  Controller,
} from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect, useState } from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  usePatchBadgeService,
  useGetAllBadgesService,
  useGrantBadgeService,
  BadgeCriteriaTypeEnum,
} from "@/services/api/services/badges";
import { useGetGamificationProfileByUsernameService } from "@/services/api/services/gamification-profiles";
import { useParams } from "next/navigation";
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
import { useQueryClient } from "@tanstack/react-query";
import { badgesQueryKeys } from "../../queries/queries";

type EditFormData = {
  name: string;
  description: string;
  imageUrl: string;
  criteriaType: BadgeCriteriaTypeEnum;
  isActive: boolean;
};

const useValidationSchema = () => {
  return yup.object().shape({
    name: yup.string().required("Nome e obrigatorio"),
    description: yup.string().default(""),
    imageUrl: yup.string().url("URL invalida").default(""),
    criteriaType: yup
      .mixed<BadgeCriteriaTypeEnum>()
      .oneOf(["AUTOMATIC", "MANUAL"])
      .default("MANUAL"),
    isActive: yup.boolean().default(true),
  });
};

function EditBadgeFormActions() {
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      Salvar alteracoes
    </Button>
  );
}

function GrantBadgeSection({ badgeId }: { badgeId: string }) {
  const { enqueueSnackbar } = useSnackbar();
  const fetchGrant = useGrantBadgeService();
  const fetchByUsername = useGetGamificationProfileByUsernameService();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { status: profileStatus, data: profile } = await fetchByUsername(
        username.trim()
      );
      if (profileStatus !== HTTP_CODES_ENUM.OK || !profile) {
        enqueueSnackbar("Usuario nao encontrado", { variant: "error" });
        return;
      }
      const { status } = await fetchGrant({
        badgeId,
        profileId: profile.id,
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar(`Badge concedido a @${username}`, {
          variant: "success",
        });
        setUsername("");
      } else {
        enqueueSnackbar("Erro ao conceder badge", { variant: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conceder badge manualmente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Username do usuario</Label>
          <div className="flex gap-2">
            <Input
              placeholder="ex: joao_silva"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleGrant();
                }
              }}
            />
            <Button
              onClick={handleGrant}
              disabled={loading || !username.trim()}
            >
              {loading ? "Concedendo..." : "Conceder"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormEditBadge() {
  const params = useParams<{ id: string }>();
  const badgeId = params.id;
  const fetchGetAll = useGetAllBadgesService();
  const fetchPatch = usePatchBadgeService();
  const { enqueueSnackbar } = useSnackbar();
  const validationSchema = useValidationSchema();
  const queryClient = useQueryClient();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      criteriaType: "MANUAL",
      isActive: true,
    },
  });

  const { handleSubmit, setError, reset, control } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatch(badgeId, {
      name: formData.name,
      description: formData.description,
      imageUrl: formData.imageUrl || undefined,
      criteriaType: formData.criteriaType,
      isActive: formData.isActive,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach((key) => {
        setError(key, { type: "manual", message: data.errors[key] });
      });
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      await queryClient.invalidateQueries({
        queryKey: badgesQueryKeys.list().key,
      });
      enqueueSnackbar("Badge atualizado com sucesso", { variant: "success" });
    }
  });

  useEffect(() => {
    const load = async () => {
      const { status, data } = await fetchGetAll();
      if (status === HTTP_CODES_ENUM.OK) {
        const badge = data.find((b) => b.id === badgeId);
        if (badge) {
          reset({
            name: badge.name,
            description: badge.description ?? "",
            imageUrl: badge.imageUrl ?? "",
            criteriaType: badge.criteriaType,
            isActive: badge.isActive,
          });
        }
      }
    };
    load();
  }, [badgeId, reset, fetchGetAll]);

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <FormProvider {...methods}>
        <Card>
          <CardHeader>
            <CardTitle>Editar Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<EditFormData>
                name="name"
                testId="name"
                label="Nome"
              />
              <FormTextInput<EditFormData>
                name="description"
                testId="description"
                label="Descricao"
                multiline
                minRows={2}
              />
              <FormTextInput<EditFormData>
                name="imageUrl"
                testId="imageUrl"
                label="URL da imagem (opcional)"
              />
              <div className="space-y-1.5">
                <Label>Tipo de criterio</Label>
                <Controller
                  control={control}
                  name="criteriaType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="AUTOMATIC">Automatico</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Ativo</SelectItem>
                        <SelectItem value="false">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <EditBadgeFormActions />
                <Button
                  variant="secondary"
                  render={<Link href="/admin-panel/badges" />}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </FormProvider>

      <GrantBadgeSection badgeId={badgeId} />
    </div>
  );
}

function EditBadge() {
  return <FormEditBadge />;
}

export default withPageRequiredAuth(EditBadge);
