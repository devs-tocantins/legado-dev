"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect } from "react";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import {
  useGetTransactionService,
  usePatchTransactionService,
} from "@/services/api/services/transactions";
import { useParams } from "next/navigation";
import { TransactionTypeEnum } from "@/services/api/types/transaction";
import FormTextInput from "@/components/form/text-input/form-text-input-shadcn";
import FormSelectInput from "@/components/form/select/form-select-shadcn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type EditFormData = {
  points: number;
  type: { id: string };
  description: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("admin-panel-transactions-edit");

  return yup.object().shape({
    points: yup
      .number()
      .min(
        1,
        t("admin-panel-transactions-edit:inputs.points.validation.min")
      )
      .required(
        t("admin-panel-transactions-edit:inputs.points.validation.required")
      ),
    type: yup
      .object()
      .shape({
        id: yup.string().required(),
      })
      .required(
        t("admin-panel-transactions-edit:inputs.type.validation.required")
      ),
    description: yup.string().default(""),
  });
};

function EditTransactionFormActions() {
  const { t } = useTranslation("admin-panel-transactions-edit");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting}>
      {t("admin-panel-transactions-edit:actions.submit")}
    </Button>
  );
}

function FormEditTransaction() {
  const params = useParams<{ id: string }>();
  const transactionId = params.id;
  const fetchGetTransaction = useGetTransactionService();
  const fetchPatchTransaction = usePatchTransactionService();
  const { t } = useTranslation("admin-panel-transactions-edit");
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      points: 0,
      type: undefined,
      description: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatchTransaction({
      id: transactionId,
      data: {
        points: formData.points,
        type: formData.type.id,
        description: formData.description || undefined,
      },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `admin-panel-transactions-edit:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(
        t("admin-panel-transactions-edit:alerts.transaction.success"),
        {
          variant: "success",
        }
      );
    }
  });

  useEffect(() => {
    const getInitialDataForEdit = async () => {
      const { status, data: transaction } = await fetchGetTransaction({
        id: transactionId,
      });

      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          points: transaction?.points ?? 0,
          type: transaction?.type ? { id: transaction.type } : undefined,
          description: transaction?.description ?? "",
        });
      }
    };

    getInitialDataForEdit();
  }, [transactionId, reset, fetchGetTransaction]);

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-md p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin-panel-transactions-edit:title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormTextInput<EditFormData>
                name="points"
                testId="points"
                type="number"
                label={t(
                  "admin-panel-transactions-edit:inputs.points.label"
                )}
              />
              <FormSelectInput<EditFormData, { id: string }>
                name="type"
                testId="type"
                label={t("admin-panel-transactions-edit:inputs.type.label")}
                options={Object.values(TransactionTypeEnum).map((value) => ({
                  id: value,
                }))}
                keyValue="id"
                renderOption={(option) =>
                  t(
                    `admin-panel-transactions-edit:inputs.type.options.${option.id}`
                  )
                }
              />
              <FormTextInput<EditFormData>
                name="description"
                testId="description"
                label={t(
                  "admin-panel-transactions-edit:inputs.description.label"
                )}
              />
              <div className="flex gap-2 pt-2">
                <EditTransactionFormActions />
                <Button variant="secondary" render={<Link href="/admin-panel/transactions" />}>
                    {t("admin-panel-transactions-edit:actions.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function EditTransaction() {
  return <FormEditTransaction />;
}

export default withPageRequiredAuth(EditTransaction);
