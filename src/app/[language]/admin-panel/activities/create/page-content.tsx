"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { usePostActivityService } from "@/services/api/services/activities";
import { useRouter } from "next/navigation";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import FormCheckboxInput from "@/components/form/checkbox-boolean/form-checkbox-boolean";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import { ChevronLeft } from "lucide-react";
import { Controller } from "react-hook-form";
import { MarkdownEditor } from "@/components/markdown-editor";

type CreateFormData = {
  title: string;
  description: string;
  fixedReward: number;
  auditorReward: number;
  requiresProof: boolean;
  requiresDescription: boolean;
  cooldownHours: number;
};

const toInteger = (value: number, originalValue: unknown) =>
  String(originalValue).trim() === "" ? NaN : value;

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-activities-create");
  return yup.object().shape({
    title: yup
      .string()
      .required(
        t("admin-panel-activities-create:inputs.title.validation.required")
      ),
    description: yup.string().default(""),
    fixedReward: yup
      .number()
      .transform(toInteger)
      .integer(
        t("admin-panel-activities-create:inputs.fixedReward.validation.integer")
      )
      .min(
        1,
        t("admin-panel-activities-create:inputs.fixedReward.validation.min")
      )
      .required(
        t(
          "admin-panel-activities-create:inputs.fixedReward.validation.required"
        )
      ),
    auditorReward: yup
      .number()
      .transform(toInteger)
      .integer(
        t(
          "admin-panel-activities-create:inputs.auditorReward.validation.integer"
        )
      )
      .min(
        0,
        t("admin-panel-activities-create:inputs.auditorReward.validation.min")
      )
      .required(
        t(
          "admin-panel-activities-create:inputs.auditorReward.validation.required"
        )
      ),
    requiresProof: yup.boolean().default(false),
    requiresDescription: yup.boolean().default(false),
    cooldownHours: yup
      .number()
      .transform(toInteger)
      .integer(
        t(
          "admin-panel-activities-create:inputs.cooldownHours.validation.integer"
        )
      )
      .min(0)
      .default(0),
  });
};

function CreateActivityFormActions() {
  const { t } = useTranslation("admin-panel-activities-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-activities-create:actions.submit")}
    </Button>
  );
}

function FormCreateActivity() {
  const router = useRouter();
  const fetchPost = usePostActivityService();
  const { t } = useTranslation("admin-panel-activities-create");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      title: "",
      description: "",
      fixedReward: 0,
      auditorReward: 10,
      requiresProof: false,
      requiresDescription: false,
      cooldownHours: 0,
    },
  });

  const { handleSubmit, setError, control } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      title: formData.title,
      description: formData.description,
      fixedReward: formData.fixedReward,
      auditorReward: formData.auditorReward,
      requiresProof: formData.requiresProof,
      requiresDescription: formData.requiresDescription,
      cooldownHours: formData.cooldownHours,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-activities-create:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(
        t("admin-panel-activities-create:alerts.activity.success"),
        { variant: "success" }
      );
      router.push("/admin-panel/activities");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground -ml-2"
            render={<Link href="/admin-panel/activities" />}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin-panel-activities-create:title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<CreateFormData>
                name="title"
                testId="title"
                label={t("admin-panel-activities-create:inputs.title.label")}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <MarkdownEditor
                    label={t(
                      "admin-panel-activities-create:inputs.description.label"
                    )}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    rows={6}
                    error={methods.formState.errors.description?.message}
                  />
                )}
              />
              <FormTextInput<CreateFormData>
                name="fixedReward"
                testId="fixedReward"
                type="number"
                label={t(
                  "admin-panel-activities-create:inputs.fixedReward.label"
                )}
              />
              <FormTextInput<CreateFormData>
                name="auditorReward"
                testId="auditorReward"
                type="number"
                label={t(
                  "admin-panel-activities-create:inputs.auditorReward.label"
                )}
              />
              <FormTextInput<CreateFormData>
                name="cooldownHours"
                testId="cooldownHours"
                type="number"
                label={t(
                  "admin-panel-activities-create:inputs.cooldownHours.label"
                )}
              />
              <FormCheckboxInput<CreateFormData>
                name="requiresProof"
                testId="requiresProof"
                label={t(
                  "admin-panel-activities-create:inputs.requiresProof.label"
                )}
              />
              <FormCheckboxInput<CreateFormData>
                name="requiresDescription"
                testId="requiresDescription"
                label={t(
                  "admin-panel-activities-create:inputs.requiresDescription.label"
                )}
              />
              <div className="flex gap-2 pt-2">
                <CreateActivityFormActions />
                <Button
                  variant="secondary"
                  render={<Link href="/admin-panel/activities" />}
                >
                  {t("admin-panel-activities-create:actions.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function CreateActivity() {
  return <FormCreateActivity />;
}

export default withPageRequiredAuth(CreateActivity);
