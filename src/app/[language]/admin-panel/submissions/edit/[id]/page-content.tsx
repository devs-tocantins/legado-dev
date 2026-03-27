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
import { useGetSubmissionService, usePatchSubmissionService } from "@/services/api/services/submissions";
import { useParams } from "next/navigation";
import { SubmissionStatusEnum } from "@/services/api/types/submission";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import FormSelectInput from "@/components/form/select/form-select-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type EditFormData = { status: { id: string }; feedback: string; proofUrl: string };

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-submissions-edit");
  return yup.object().shape({
    status: yup.object().shape({ id: yup.string().required() }).required(t("admin-panel-submissions-edit:inputs.status.validation.required")),
    feedback: yup.string().default(""),
    proofUrl: yup.string().default(""),
  });
};

function EditFormActions() {
  const { t } = useTranslation("admin-panel-submissions-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return <Button type="submit" disabled={isSubmitting}>{t("admin-panel-submissions-edit:actions.submit")}</Button>;
}

function FormEditSubmission() {
  const params = useParams<{ id: string }>();
  const submissionId = params.id;
  const fetchGet = useGetSubmissionService();
  const fetchPatch = usePatchSubmissionService();
  const { t } = useTranslation("admin-panel-submissions-edit");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { status: undefined, feedback: "", proofUrl: "" },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatch({
      id: submissionId,
      data: { status: formData.status.id, feedback: formData.feedback || undefined, proofUrl: formData.proofUrl || undefined },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach((key) => {
        setError(key, { type: "manual", message: t(`admin-panel-submissions-edit:inputs.${key}.validation.server.${data.errors[key]}`) });
      });
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(t("admin-panel-submissions-edit:alerts.submission.success"), { variant: "success" });
    }
  });

  useEffect(() => {
    const getInitialData = async () => {
      const { status, data: sub } = await fetchGet({ id: submissionId });
      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          status: sub?.status ? { id: sub.status } : undefined,
          feedback: sub?.feedback ?? "",
          proofUrl: sub?.proofUrl ?? "",
        });
      }
    };
    getInitialData();
  }, [submissionId, reset, fetchGet]);

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader><CardTitle>{t("admin-panel-submissions-edit:title")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormSelectInput<EditFormData, { id: string }>
                name="status"
                testId="status"
                label={t("admin-panel-submissions-edit:inputs.status.label")}
                options={Object.values(SubmissionStatusEnum).map((v) => ({ id: v }))}
                keyValue="id"
                renderOption={(option) => t(`admin-panel-submissions-edit:inputs.status.options.${option.id}`)}
              />
              <FormTextInput<EditFormData> name="feedback" testId="feedback" label={t("admin-panel-submissions-edit:inputs.feedback.label")} multiline minRows={3} />
              <FormTextInput<EditFormData> name="proofUrl" testId="proofUrl" label={t("admin-panel-submissions-edit:inputs.proofUrl.label")} />
              <div className="flex gap-2 pt-2">
                <EditFormActions />
                <Button variant="secondary" render={<Link href="/admin-panel/submissions" />}>{t("admin-panel-submissions-edit:actions.cancel")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function EditSubmission() { return <FormEditSubmission />; }
export default withPageRequiredAuth(EditSubmission);
