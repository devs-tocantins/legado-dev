"use client";

import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useTranslation } from "@/services/i18n/client";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { usePostSubmissionService } from "@/services/api/services/submissions";
import { useRouter } from "next/navigation";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type NewSubmissionFormData = {
  profileId: string;
  activityId: string;
  proofUrl: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("submissions");
  return yup.object().shape({
    profileId: yup.string().required(t("submissions:inputs.profileId.validation.required")),
    activityId: yup.string().required(t("submissions:inputs.activityId.validation.required")),
    proofUrl: yup.string().default(""),
  });
};

function SubmitActions() {
  const { t } = useTranslation("submissions");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("submissions:actions.submit")}
    </Button>
  );
}

function NewSubmissionPageContent() {
  const { t } = useTranslation("submissions");
  const router = useRouter();
  const fetchPost = usePostSubmissionService();
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<NewSubmissionFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { profileId: "", activityId: "", proofUrl: "" },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { status } = await fetchPost({
      profileId: formData.profileId,
      activityId: formData.activityId,
      proofUrl: formData.proofUrl || undefined,
    });
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(t("submissions:alerts.success"), { variant: "success" });
      router.push("/dashboard");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("newTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<NewSubmissionFormData> name="profileId" testId="profileId" label={t("submissions:inputs.profileId.label")} />
              <FormTextInput<NewSubmissionFormData> name="activityId" testId="activityId" label={t("submissions:inputs.activityId.label")} />
              <FormTextInput<NewSubmissionFormData> name="proofUrl" testId="proofUrl" label={t("submissions:inputs.proofUrl.label")} />
              <div className="flex gap-2 pt-2">
                <SubmitActions />
                <Button variant="secondary" render={<Link href="/dashboard" />}>
                  {t("submissions:actions.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

export default withPageRequiredAuth(NewSubmissionPageContent);
