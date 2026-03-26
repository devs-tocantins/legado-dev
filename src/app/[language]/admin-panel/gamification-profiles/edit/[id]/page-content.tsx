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
import { useEffect } from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import Link from "@/components/link";
import useLeavePage from "@/services/leave-page/use-leave-page";
import Box from "@mui/material/Box";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetGamificationProfileService,
  usePatchGamificationProfileService,
} from "@/services/api/services/gamification-profiles";
import { useParams } from "next/navigation";

type EditFormData = {
  totalPoints: number;
  level: number;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-gamification-profiles-edit");

  return yup.object().shape({
    totalPoints: yup
      .number()
      .required(
        t(
          "admin-panel-gamification-profiles-edit:inputs.totalPoints.validation.required"
        )
      ),
    level: yup
      .number()
      .required(
        t(
          "admin-panel-gamification-profiles-edit:inputs.level.validation.required"
        )
      ),
  });
};

function EditGamificationProfileFormActions() {
  const { t } = useTranslation("admin-panel-gamification-profiles-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-gamification-profiles-edit:actions.submit")}
    </Button>
  );
}

function FormEditGamificationProfile() {
  const params = useParams<{ id: string }>();
  const profileId = params.id;
  const fetchGet = useGetGamificationProfileService();
  const fetchPatch = usePatchGamificationProfileService();
  const { t } = useTranslation("admin-panel-gamification-profiles-edit");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      totalPoints: 0,
      level: 1,
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatch({
      id: profileId,
      data: {
        totalPoints: formData.totalPoints,
        level: formData.level,
      },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-gamification-profiles-edit:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(
        t("admin-panel-gamification-profiles-edit:alerts.profile.success"),
        {
          variant: "success",
        }
      );
    }
  });

  useEffect(() => {
    const getInitialDataForEdit = async () => {
      const { status, data: profile } = await fetchGet({
        id: profileId,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          totalPoints: profile?.totalPoints ?? 0,
          level: profile?.level ?? 1,
        });
      }
    };

    getInitialDataForEdit();
  }, [profileId, reset, fetchGet]);

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-gamification-profiles-edit:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditFormData>
                name="totalPoints"
                testId="totalPoints"
                type="number"
                label={t(
                  "admin-panel-gamification-profiles-edit:inputs.totalPoints.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditFormData>
                name="level"
                testId="level"
                type="number"
                label={t(
                  "admin-panel-gamification-profiles-edit:inputs.level.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <EditGamificationProfileFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/gamification-profiles"
                >
                  {t(
                    "admin-panel-gamification-profiles-edit:actions.cancel"
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function EditGamificationProfile() {
  return <FormEditGamificationProfile />;
}

export default withPageRequiredAuth(EditGamificationProfile);
