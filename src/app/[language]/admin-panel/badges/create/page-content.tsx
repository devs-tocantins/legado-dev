"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  usePostBadgeService,
  BadgeCriteriaTypeEnum,
} from "@/services/api/services/badges";
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
import { Controller } from "react-hook-form";

type CreateFormData = {
  name: string;
  description: string;
  imageUrl: string;
  criteriaType: BadgeCriteriaTypeEnum;
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
  });
};

function CreateBadgeFormActions() {
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      Salvar
    </Button>
  );
}

function FormCreateBadge() {
  const router = useRouter();
  const fetchPost = usePostBadgeService();
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      criteriaType: "MANUAL",
    },
  });

  const { handleSubmit, setError, control } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      name: formData.name,
      description: formData.description,
      imageUrl: formData.imageUrl || undefined,
      criteriaType: formData.criteriaType,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach(
        (key) => {
          setError(key, { type: "manual", message: data.errors[key] });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar("Badge criado com sucesso", { variant: "success" });
      router.push("/admin-panel/badges");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>Criar Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<CreateFormData>
                name="name"
                testId="name"
                label="Nome"
              />
              <FormTextInput<CreateFormData>
                name="description"
                testId="description"
                label="Descricao"
                multiline
                minRows={2}
              />
              <FormTextInput<CreateFormData>
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
              <div className="flex gap-2 pt-2">
                <CreateBadgeFormActions />
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
      </div>
    </FormProvider>
  );
}

function CreateBadge() {
  return <FormCreateBadge />;
}

export default withPageRequiredAuth(CreateBadge);
