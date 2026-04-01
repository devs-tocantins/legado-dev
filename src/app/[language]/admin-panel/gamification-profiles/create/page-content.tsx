"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { usePostGamificationProfileService } from "@/services/api/services/gamification-profiles";
import { useRouter } from "next/navigation";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";

type CreateFormData = {
  userId: number;
  username: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-gamification-profiles-create");
  return yup.object().shape({
    userId: yup
      .number()
      .required(
        t(
          "admin-panel-gamification-profiles-create:inputs.userId.validation.required"
        )
      ),
    username: yup
      .string()
      .required(
        t(
          "admin-panel-gamification-profiles-create:inputs.username.validation.required"
        )
      ),
  });
};

function CreateGamificationProfileFormActions() {
  const { t } = useTranslation("admin-panel-gamification-profiles-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-gamification-profiles-create:actions.submit")}
    </Button>
  );
}

function FormCreateGamificationProfile() {
  const router = useRouter();
  const fetchPost = usePostGamificationProfileService();
  const { t } = useTranslation("admin-panel-gamification-profiles-create");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { userId: 0, username: "" },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      userId: formData.userId,
      username: formData.username,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-gamification-profiles-create:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(
        t("admin-panel-gamification-profiles-create:alerts.profile.success"),
        { variant: "success" }
      );
      router.push("/admin-panel/gamification-profiles");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("admin-panel-gamification-profiles-create:title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onSubmit}
              autoComplete="create-new-gamification-profile"
              className="space-y-4"
            >
              <FormTextInput<CreateFormData>
                name="userId"
                testId="userId"
                type="number"
                label={t(
                  "admin-panel-gamification-profiles-create:inputs.userId.label"
                )}
              />
              <FormTextInput<CreateFormData>
                name="username"
                testId="username"
                label={t(
                  "admin-panel-gamification-profiles-create:inputs.username.label"
                )}
              />
              <div className="flex gap-2 pt-2">
                <CreateGamificationProfileFormActions />
                <Button
                  variant="secondary"
                  render={<Link href="/admin-panel/gamification-profiles" />}
                >
                  {t("admin-panel-gamification-profiles-create:actions.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function CreateGamificationProfile() {
  return <FormCreateGamificationProfile />;
}

export default withPageRequiredAuth(CreateGamificationProfile);
