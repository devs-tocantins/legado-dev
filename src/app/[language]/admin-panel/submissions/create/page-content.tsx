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
import { usePostSubmissionService } from "@/services/api/services/submissions";
import { useRouter } from "next/navigation";

type CreateFormData = {
  activityId: string;
  proofUrl: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-submissions-create");

  return yup.object().shape({
    activityId: yup
      .string()
      .required(
        t(
          "admin-panel-submissions-create:inputs.activityId.validation.required"
        )
      ),
    proofUrl: yup.string().default(""),
  });
};

function CreateSubmissionFormActions() {
  const { t } = useTranslation("admin-panel-submissions-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-submissions-create:actions.submit")}
    </Button>
  );
}

function FormCreateSubmission() {
  const router = useRouter();
  const fetchPostSubmission = usePostSubmissionService();
  const { t } = useTranslation("admin-panel-submissions-create");
  const validationSchema = useValidationSchema();

  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      activityId: "",
      proofUrl: "",
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPostSubmission({
      activityId: formData.activityId,
      proofUrl: formData.proofUrl || undefined,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-submissions-create:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(
        t("admin-panel-submissions-create:alerts.submission.success"),
        {
          variant: "success",
        }
      );
      router.push("/admin-panel/submissions");
    }
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit} autoComplete="create-new-submission">
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-submissions-create:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="activityId"
                testId="activityId"
                label={t(
                  "admin-panel-submissions-create:inputs.activityId.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="proofUrl"
                testId="proofUrl"
                label={t(
                  "admin-panel-submissions-create:inputs.proofUrl.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CreateSubmissionFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/submissions"
                >
                  {t("admin-panel-submissions-create:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function CreateSubmission() {
  return <FormCreateSubmission />;
}

export default withPageRequiredAuth(CreateSubmission);
