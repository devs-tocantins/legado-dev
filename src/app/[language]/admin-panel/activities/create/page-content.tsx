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
import { usePostActivityService } from "@/services/api/services/activities";
import { useRouter } from "next/navigation";
import FormSelectInput from "@/components/form/select/form-select";
import { ActivityTypeEnum } from "@/services/api/types/activity";

type CreateFormData = {
  name: string;
  description: string;
  points: number;
  type: { id: string };
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-activities-create");

  return yup.object().shape({
    name: yup
      .string()
      .required(
        t("admin-panel-activities-create:inputs.name.validation.required")
      ),
    description: yup.string().default(""),
    points: yup
      .number()
      .min(
        1,
        t("admin-panel-activities-create:inputs.points.validation.min")
      )
      .required(
        t("admin-panel-activities-create:inputs.points.validation.required")
      ),
    type: yup
      .object()
      .shape({
        id: yup.string().required(),
      })
      .required(
        t("admin-panel-activities-create:inputs.type.validation.required")
      ),
  });
};

function CreateActivityFormActions() {
  const { t } = useTranslation("admin-panel-activities-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-activities-create:actions.submit")}
    </Button>
  );
}

function FormCreateActivity() {
  const router = useRouter();
  const fetchPostActivity = usePostActivityService();
  const { t } = useTranslation("admin-panel-activities-create");
  const validationSchema = useValidationSchema();

  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      description: "",
      points: 0,
      type: undefined,
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPostActivity({
      name: formData.name,
      description: formData.description,
      points: formData.points,
      type: formData.type.id as ActivityTypeEnum,
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
        {
          variant: "success",
        }
      );
      router.push("/admin-panel/activities");
    }
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit} autoComplete="create-new-activity">
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-activities-create:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="name"
                testId="name"
                autoComplete="name"
                label={t("admin-panel-activities-create:inputs.name.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="description"
                testId="description"
                autoComplete="description"
                label={t(
                  "admin-panel-activities-create:inputs.description.label"
                )}
                multiline
                minRows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="points"
                testId="points"
                type="number"
                label={t("admin-panel-activities-create:inputs.points.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormSelectInput<CreateFormData, { id: string }>
                name="type"
                testId="type"
                label={t("admin-panel-activities-create:inputs.type.label")}
                options={Object.values(ActivityTypeEnum).map((value) => ({
                  id: value,
                }))}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-activities-create:inputs.type.options.${option.id}`
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CreateActivityFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/activities"
                >
                  {t("admin-panel-activities-create:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function CreateActivity() {
  return <FormCreateActivity />;
}

export default withPageRequiredAuth(CreateActivity);
