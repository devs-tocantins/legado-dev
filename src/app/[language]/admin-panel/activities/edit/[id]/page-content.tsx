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
import { useGetActivityService, usePatchActivityService } from "@/services/api/services/activities";
import { useParams } from "next/navigation";
import { ActivityTypeEnum } from "@/services/api/types/activity";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import FormSelectInput from "@/components/form/select/form-select-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type EditFormData = {
  name: string;
  description: string;
  points: number;
  type: { id: string };
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-activities-edit");
  return yup.object().shape({
    name: yup.string().required(t("admin-panel-activities-edit:inputs.name.validation.required")),
    description: yup.string().default(""),
    points: yup.number().min(1, t("admin-panel-activities-edit:inputs.points.validation.min")).required(t("admin-panel-activities-edit:inputs.points.validation.required")),
    type: yup.object().shape({ id: yup.string().required() }).required(t("admin-panel-activities-edit:inputs.type.validation.required")),
  });
};

function EditActivityFormActions() {
  const { t } = useTranslation("admin-panel-activities-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-activities-edit:actions.submit")}
    </Button>
  );
}

function FormEditActivity() {
  const params = useParams<{ id: string }>();
  const activityId = params.id;
  const fetchGet = useGetActivityService();
  const fetchPatch = usePatchActivityService();
  const { t } = useTranslation("admin-panel-activities-edit");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { name: "", description: "", points: 0, type: undefined },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatch({
      id: activityId,
      data: { name: formData.name, description: formData.description, points: formData.points, type: formData.type.id as ActivityTypeEnum },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach((key) => {
        setError(key, { type: "manual", message: t(`admin-panel-activities-edit:inputs.${key}.validation.server.${data.errors[key]}`) });
      });
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(t("admin-panel-activities-edit:alerts.activity.success"), { variant: "success" });
    }
  });

  useEffect(() => {
    const getInitialData = async () => {
      const { status, data: activity } = await fetchGet({ id: activityId });
      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          name: activity?.name ?? "",
          description: activity?.description ?? "",
          points: activity?.points ?? 0,
          type: activity?.type ? { id: activity.type } : undefined,
        });
      }
    };
    getInitialData();
  }, [activityId, reset, fetchGet]);

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin-panel-activities-edit:title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<EditFormData> name="name" testId="name" label={t("admin-panel-activities-edit:inputs.name.label")} />
              <FormTextInput<EditFormData> name="description" testId="description" label={t("admin-panel-activities-edit:inputs.description.label")} multiline minRows={3} />
              <FormTextInput<EditFormData> name="points" testId="points" type="number" label={t("admin-panel-activities-edit:inputs.points.label")} />
              <FormSelectInput<EditFormData, { id: string }>
                name="type"
                testId="type"
                label={t("admin-panel-activities-edit:inputs.type.label")}
                options={Object.values(ActivityTypeEnum).map((v) => ({ id: v }))}
                keyValue="id"
                renderOption={(option) => t(`admin-panel-activities-edit:inputs.type.options.${option.id}`)}
              />
              <div className="flex gap-2 pt-2">
                <EditActivityFormActions />
                <Button variant="secondary" render={<Link href="/admin-panel/activities" />}>
                  {t("admin-panel-activities-edit:actions.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function EditActivity() {
  return <FormEditActivity />;
}

export default withPageRequiredAuth(EditActivity);
