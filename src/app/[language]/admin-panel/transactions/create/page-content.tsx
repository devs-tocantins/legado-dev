"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { usePostTransactionService } from "@/services/api/services/transactions";
import { useRouter } from "next/navigation";
import { TransactionCategoryEnum } from "@/services/api/types/transaction";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import FormSelectInput from "@/components/form/select/form-select-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import { ChevronLeft } from "lucide-react";

type CreateFormData = {
  profileId: string;
  amount: number;
  category: { id: string };
  description: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-transactions-create");
  return yup.object().shape({
    profileId: yup
      .string()
      .required(
        t(
          "admin-panel-transactions-create:inputs.profileId.validation.required"
        )
      ),
    amount: yup
      .number()
      .transform((value, originalValue) =>
        String(originalValue).trim() === "" ? NaN : value
      )
      .integer(
        t("admin-panel-transactions-create:inputs.amount.validation.integer")
      )
      .min(1, t("admin-panel-transactions-create:inputs.amount.validation.min"))
      .required(
        t("admin-panel-transactions-create:inputs.amount.validation.required")
      ),
    category: yup
      .object()
      .shape({ id: yup.string().required() })
      .required(
        t("admin-panel-transactions-create:inputs.category.validation.required")
      ),
    description: yup.string().default(""),
  });
};

function CreateTransactionFormActions() {
  const { t } = useTranslation("admin-panel-transactions-create");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-transactions-create:actions.submit")}
    </Button>
  );
}

function FormCreateTransaction() {
  const router = useRouter();
  const fetchPost = usePostTransactionService();
  const { t } = useTranslation("admin-panel-transactions-create");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<CreateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      profileId: "",
      amount: 0,
      category: undefined,
      description: "",
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPost({
      profile: formData.profileId,
      amount: formData.amount,
      category: formData.category.id,
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
        { variant: "success" }
      );
      router.push("/admin-panel/transactions");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground -ml-2"
            render={<Link href="/admin-panel/transactions" />}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin-panel-transactions-create:title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onSubmit}
              autoComplete="create-new-transaction"
              className="space-y-4"
            >
              <FormTextInput<CreateFormData>
                name="profileId"
                testId="profileId"
                label={t(
                  "admin-panel-transactions-create:inputs.profileId.label"
                )}
              />
              <FormTextInput<CreateFormData>
                name="amount"
                testId="amount"
                type="number"
                label={t("admin-panel-transactions-create:inputs.amount.label")}
              />
              <FormSelectInput<CreateFormData, { id: string }>
                name="category"
                testId="category"
                label={t(
                  "admin-panel-transactions-create:inputs.category.label"
                )}
                options={Object.values(TransactionCategoryEnum).map((v) => ({
                  id: v,
                }))}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-transactions-create:inputs.category.options.${option.id}`
                  )
                }
              />
              <FormTextInput<CreateFormData>
                name="description"
                testId="description"
                label={t(
                  "admin-panel-transactions-create:inputs.description.label"
                )}
              />
              <div className="flex gap-2 pt-2">
                <CreateTransactionFormActions />
                <Button
                  variant="secondary"
                  render={<Link href="/admin-panel/transactions" />}
                >
                  {t("admin-panel-transactions-create:actions.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function CreateTransaction() {
  return <FormCreateTransaction />;
}

export default withPageRequiredAuth(CreateTransaction);
