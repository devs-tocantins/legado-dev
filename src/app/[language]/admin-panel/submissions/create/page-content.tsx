"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { usePostSubmissionService } from "@/services/api/services/submissions";
import { useRouter } from "next/navigation";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type CreateFormData = { profileId: string; activityId: string; proofUrl: string };

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-submissions-create");
  return yup.object().shape({
    profileId: yup.string().required(t("admin-panel-submissions-create:inputs.profileId.validation.required")),
    activityId: yup.string().required(t("admin-panel-submissions-create:inputs.activityId.validation.required")),
    proofUrl: yup.string().default(""),
  });
};

function CreateFormActions() {
  const { t } = useTranslation("admin-panel-submissions-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return <Button type="submit" disabled={isSubmitting}>{t("admin-panel-submissions-create:actions.submit")}</Button>;
}

function FormCreateSubmission() {
  const router = useRouter();
  const fetchPost = usePostSubmissionService();
  const { t } = useTranslation("admin-panel-submissions-create");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { profileId: "", activityId: "", proofUrl: "" },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      profileId: formData.profileId,
      activityId: formData.activityId,
      proofUrl: formData.proofUrl || undefined,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach((key) => {
        setError(key, { type: "manual", message: t(`admin-panel-submissions-create:inputs.${key}.validation.server.${data.errors[key]}`) });
      });
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(t("admin-panel-submissions-create:alerts.submission.success"), { variant: "success" });
      router.push("/admin-panel/submissions");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader><CardTitle>{t("admin-panel-submissions-create:title")}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<CreateFormData> name="profileId" testId="profileId" label={t("admin-panel-submissions-create:inputs.profileId.label")} />
              <FormTextInput<CreateFormData> name="activityId" testId="activityId" label={t("admin-panel-submissions-create:inputs.activityId.label")} />
              <FormTextInput<CreateFormData> name="proofUrl" testId="proofUrl" label={t("admin-panel-submissions-create:inputs.proofUrl.label")} />
              <div className="flex gap-2 pt-2">
                <CreateFormActions />
                <Button variant="secondary" render={<Link href="/admin-panel/submissions" />}>{t("admin-panel-submissions-create:actions.cancel")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function CreateSubmission() { return <FormCreateSubmission />; }
export default withPageRequiredAuth(CreateSubmission);
