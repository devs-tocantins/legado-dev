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
  useGetActivityService,
  usePatchActivityService,
} from "@/services/api/services/activities";
import { useParams } from "next/navigation";
import FormSelectInput from "@/components/form/select/form-select";
import { ActivityTypeEnum } from "@/services/api/types/activity";

type EditFormData = {
  name: string;
  description: string;
  points: number;
  type: { id: string };
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-activities-edit");

  return yup.object().shape({
    name: yup
      .string()
      .required(
        t("admin-panel-activities-edit:inputs.name.validation.required")
      ),
    description: yup.string().default(""),
    points: yup
      .number()
      .min(
        1,
        t("admin-panel-activities-edit:inputs.points.validation.min")
      )
      .required(
        t("admin-panel-activities-edit:inputs.points.validation.required")
      ),
    type: yup
      .object()
      .shape({
        id: yup.string().required(),
      })
      .required(
        t("admin-panel-activities-edit:inputs.type.validation.required")
      ),
  });
};

function EditActivityFormActions() {
  const { t } = useTranslation("admin-panel-activities-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-activities-edit:actions.submit")}
    </Button>
  );
}

function FormEditActivity() {
  const params = useParams<{ id: string }>();
  const activityId = params.id;
  const fetchGetActivity = useGetActivityService();
  const fetchPatchActivity = usePatchActivityService();
  const { t } = useTranslation("admin-panel-activities-edit");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      description: "",
      points: 0,
      type: undefined,
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatchActivity({
      id: activityId,
      data: {
        name: formData.name,
        description: formData.description,
        points: formData.points,
        type: formData.type.id as ActivityTypeEnum,
      },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-activities-edit:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(
        t("admin-panel-activities-edit:alerts.activity.success"),
        {
          variant: "success",
        }
      );
    }
  });

  useEffect(() => {
    const getInitialDataForEdit = async () => {
      const { status, data: activity } = await fetchGetActivity({
        id: activityId,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          name: activity?.name ?? "",
          description: activity?.description ?? "",
          points: activity?.points ?? 0,
          type: activity?.type ? { id: activity.type } : undefined,
        });
      }
    };

    getInitialDataForEdit();
  }, [activityId, reset, fetchGetActivity]);

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-activities-edit:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditFormData>
                name="name"
                testId="name"
                label={t("admin-panel-activities-edit:inputs.name.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditFormData>
                name="description"
                testId="description"
                label={t(
                  "admin-panel-activities-edit:inputs.description.label"
                )}
                multiline
                minRows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditFormData>
                name="points"
                testId="points"
                type="number"
                label={t("admin-panel-activities-edit:inputs.points.label")}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormSelectInput<EditFormData, { id: string }>
                name="type"
                testId="type"
                label={t("admin-panel-activities-edit:inputs.type.label")}
                options={Object.values(ActivityTypeEnum).map((value) => ({
                  id: value,
                }))}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-activities-edit:inputs.type.options.${option.id}`
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <EditActivityFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/activities"
                >
                  {t("admin-panel-activities-edit:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function EditActivity() {
  return <FormEditActivity />;
}

export default withPageRequiredAuth(EditActivity);
