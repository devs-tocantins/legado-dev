"use client";

import Button from "@mui/material/Button";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import useLeavePage from "@/services/leave-page/use-leave-page";
import Box from "@mui/material/Box";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { usePostGamificationProfileService } from "@/services/api/services/gamification-profiles";
import { useRouter } from "next/navigation";

type CreateFormData = {
  userId: string;
  totalPoints: number;
  level: number;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-gamification-profiles-create");

  return yup.object().shape({
    userId: yup
      .string()
      .required(
        t(
          "admin-panel-gamification-profiles-create:inputs.userId.validation.required"
        )
      ),
    totalPoints: yup.number().default(0),
    level: yup.number().default(1),
  });
};

function CreateGamificationProfileFormActions() {
  const { t } = useTranslation("admin-panel-gamification-profiles-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
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
    defaultValues: {
      userId: "",
      totalPoints: 0,
      level: 1,
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      userId: formData.userId,
      totalPoints: formData.totalPoints,
      level: formData.level,
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
        {
          variant: "success",
        }
      );
      router.push("/admin-panel/gamification-profiles");
    }
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form
          onSubmit={onSubmit}
          autoComplete="create-new-gamification-profile"
        >
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-gamification-profiles-create:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="userId"
                testId="userId"
                label={t(
                  "admin-panel-gamification-profiles-create:inputs.userId.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="totalPoints"
                testId="totalPoints"
                type="number"
                label={t(
                  "admin-panel-gamification-profiles-create:inputs.totalPoints.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="level"
                testId="level"
                type="number"
                label={t(
                  "admin-panel-gamification-profiles-create:inputs.level.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CreateGamificationProfileFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/gamification-profiles"
                >
                  {t("admin-panel-gamification-profiles-create:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function CreateGamificationProfile() {
  return <FormCreateGamificationProfile />;
}

export default withPageRequiredAuth(CreateGamificationProfile);
