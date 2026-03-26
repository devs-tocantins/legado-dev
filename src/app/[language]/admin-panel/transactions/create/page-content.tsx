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
import { usePostTransactionService } from "@/services/api/services/transactions";
import { useRouter } from "next/navigation";
import FormSelectInput from "@/components/form/select/form-select";
import { TransactionTypeEnum } from "@/services/api/types/transaction";

type CreateFormData = {
  userId: string;
  points: number;
  type: { id: string };
  description: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-transactions-create");

  return yup.object().shape({
    userId: yup
      .string()
      .required(
        t("admin-panel-transactions-create:inputs.userId.validation.required")
      ),
    points: yup
      .number()
      .min(
        1,
        t("admin-panel-transactions-create:inputs.points.validation.min")
      )
      .required(
        t("admin-panel-transactions-create:inputs.points.validation.required")
      ),
    type: yup
      .object()
      .shape({
        id: yup.string().required(),
      })
      .required(
        t("admin-panel-transactions-create:inputs.type.validation.required")
      ),
    description: yup.string().default(""),
  });
};

function CreateTransactionFormActions() {
  const { t } = useTranslation("admin-panel-transactions-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      variant="contained"
      color="primary"
      type="submit"
      disabled={isSubmitting}
    >
      {t("admin-panel-transactions-create:actions.submit")}
    </Button>
  );
}

function FormCreateTransaction() {
  const router = useRouter();
  const fetchPostTransaction = usePostTransactionService();
  const { t } = useTranslation("admin-panel-transactions-create");
  const validationSchema = useValidationSchema();

  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      userId: "",
      points: 0,
      type: undefined,
      description: "",
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPostTransaction({
      userId: formData.userId,
      points: formData.points,
      type: formData.type.id,
      description: formData.description || undefined,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-transactions-create:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(
        t("admin-panel-transactions-create:alerts.transaction.success"),
        {
          variant: "success",
        }
      );
      router.push("/admin-panel/transactions");
    }
  });

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xs">
        <form onSubmit={onSubmit} autoComplete="create-new-transaction">
          <Grid container spacing={2} mb={3} mt={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6">
                {t("admin-panel-transactions-create:title")}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="userId"
                testId="userId"
                label={t(
                  "admin-panel-transactions-create:inputs.userId.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="points"
                testId="points"
                type="number"
                label={t(
                  "admin-panel-transactions-create:inputs.points.label"
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormSelectInput<CreateFormData, { id: string }>
                name="type"
                testId="type"
                label={t("admin-panel-transactions-create:inputs.type.label")}
                options={Object.values(TransactionTypeEnum).map((value) => ({
                  id: value,
                }))}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-transactions-create:inputs.type.options.${option.id}`
                  )
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormTextInput<CreateFormData>
                name="description"
                testId="description"
                label={t(
                  "admin-panel-transactions-create:inputs.description.label"
                )}
                multiline
                minRows={3}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <CreateTransactionFormActions />
              <Box ml={1} component="span">
                <Button
                  variant="contained"
                  color="inherit"
                  LinkComponent={Link}
                  href="/admin-panel/transactions"
                >
                  {t("admin-panel-transactions-create:actions.cancel")}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Container>
    </FormProvider>
  );
}

function CreateTransaction() {
  return <FormCreateTransaction />;
}

export default withPageRequiredAuth(CreateTransaction);
