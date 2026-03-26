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
import { ActivityTypeEnum } from "@/services/api/types/activity";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import FormSelectInput from "@/components/form/select/form-select-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type CreateFormData = {
  name: string;
  description: string;
  points: number;
  type: { id: string };
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-activities-create");
  return yup.object().shape({
    name: yup.string().required(t("admin-panel-activities-create:inputs.name.validation.required")),
    description: yup.string().default(""),
    points: yup.number().min(1, t("admin-panel-activities-create:inputs.points.validation.min")).required(t("admin-panel-activities-create:inputs.points.validation.required")),
    type: yup.object().shape({ id: yup.string().required() }).required(t("admin-panel-activities-create:inputs.type.validation.required")),
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
    defaultValues: { name: "", description: "", points: 0, type: undefined },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      name: formData.name,
      description: formData.description,
      points: formData.points,
      type: formData.type.id as ActivityTypeEnum,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach((key) => {
        setError(key, { type: "manual", message: t(`admin-panel-activities-create:inputs.${key}.validation.server.${data.errors[key]}`) });
      });
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(t("admin-panel-activities-create:alerts.activity.success"), { variant: "success" });
      router.push("/admin-panel/activities");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin-panel-activities-create:title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<CreateFormData> name="name" testId="name" label={t("admin-panel-activities-create:inputs.name.label")} />
              <FormTextInput<CreateFormData> name="description" testId="description" label={t("admin-panel-activities-create:inputs.description.label")} multiline minRows={3} />
              <FormTextInput<CreateFormData> name="points" testId="points" type="number" label={t("admin-panel-activities-create:inputs.points.label")} />
              <FormSelectInput<CreateFormData, { id: string }>
                name="type"
                testId="type"
                label={t("admin-panel-activities-create:inputs.type.label")}
                options={Object.values(ActivityTypeEnum).map((v) => ({ id: v }))}
                keyValue="id"
                renderOption={(option) => t(`admin-panel-activities-create:inputs.type.options.${option.id}`)}
              />
              <div className="flex gap-2 pt-2">
                <CreateActivityFormActions />
                <Button variant="secondary" render={<Link href="/admin-panel/activities" />}>
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
