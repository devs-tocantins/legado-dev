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
  useGetSubmissionService,
  usePatchSubmissionService,
} from "@/services/api/services/submissions";
import { useParams } from "next/navigation";
import FormSelectInput from "@/components/form/select/form-select";
import { SubmissionStatusEnum } from "@/services/api/types/submission";

type EditFormData = {
  status: { id: string };
  reviewNote: string;
  proofUrl: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-submissions-edit");

  return yup.object().shape({
    status: yup
      .object()
      .shape({
        id: yup.string().required(),
      })
      .required(
        t("admin-panel-submissions-edit:inputs.status.validation.required")
      ),
    reviewNote: yup.string().default(""),
    proofUrl: yup.string().default(""),
  });
};

function EditSubmissionFormActions() {
  const { t } = useTranslation("admin-panel-submissions-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-submissions-edit:actions.submit")}
    </Button>
  );
}

function FormEditSubmission() {
  const params = useParams<{ id: string }>();
  const submissionId = params.id;
  const fetchGetSubmission = useGetSubmissionService();
  const fetchPatchSubmission = usePatchSubmissionService();
  const { t } = useTranslation("admin-panel-submissions-edit");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      status: undefined,
      reviewNote: "",
      proofUrl: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatchSubmission({
      id: submissionId,
      data: {
        status: formData.status.id,
        reviewNote: formData.reviewNote || undefined,
        proofUrl: formData.proofUrl || undefined,
      },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-submissions-edit:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(
        t("admin-panel-submissions-edit:alerts.submission.success"),
        {
          variant: "success",
        }
      );
    }
  });

  useEffect(() => {
    const getInitialDataForEdit = async () => {
      const { status, data: submission } = await fetchGetSubmission({
        id: submissionId,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          status: submission?.status
            ? { id: submission.status }
            : undefined,
          reviewNote: submission?.reviewNote ?? "",
          proofUrl: submission?.proofUrl ?? "",
        });
      }
    };

    getInitialDataForEdit();
  }, [submissionId, reset, fetchGetSubmission]);

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit}>
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-submissions-edit:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormSelectInput<EditFormData, { id: string }>
                name="status"
                testId="status"
                label={t(
                  "admin-panel-submissions-edit:inputs.status.label"
                )}
                options={Object.values(SubmissionStatusEnum).map(
                  (value) => ({
                    id: value,
                  })
                )}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-submissions-edit:inputs.status.options.${option.id}`
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditFormData>
                name="reviewNote"
                testId="reviewNote"
                label={t(
                  "admin-panel-submissions-edit:inputs.reviewNote.label"
                )}
                multiline
                minRows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<EditFormData>
                name="proofUrl"
                testId="proofUrl"
                label={t(
                  "admin-panel-submissions-edit:inputs.proofUrl.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <EditSubmissionFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/submissions"
                >
                  {t("admin-panel-submissions-edit:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function EditSubmission() {
  return <FormEditSubmission />;
}

export default withPageRequiredAuth(EditSubmission);
