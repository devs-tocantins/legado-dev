"use client";

import { useTranslation } from "@/services/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { TransactionFilterType } from "./transaction-filter-types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FormSelectInput from "@/components/form/select/form-select-shadcn";
import { TransactionTypeEnum } from "@/services/api/types/transaction";

type TransactionFilterFormData = TransactionFilterType;

function TransactionFilter() {
  const { t } = useTranslation("admin-panel-transactions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const methods = useForm<TransactionFilterFormData>({
    defaultValues: {
      type: undefined,
    },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      const filterParsed = JSON.parse(filter);
      reset(filterParsed);
    }
  }, [searchParams, reset]);

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline">
          {t("admin-panel-transactions:filter.actions.filter")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit((data) => {
              const searchParams = new URLSearchParams(window.location.search);
              searchParams.set("filter", JSON.stringify(data));
              router.push(
                window.location.pathname + "?" + searchParams.toString()
              );
            })}
            className="space-y-4"
          >
            <FormSelectInput<TransactionFilterFormData, { id: string }>
              name="type"
              testId="type"
              label={t(
                "admin-panel-transactions:filter.inputs.type.label"
              )}
              options={Object.values(TransactionTypeEnum).map((value) => ({
                id: value,
              }))}
              keyValue="id"
              renderOption={(option) =>
                t(
                  `admin-panel-transactions:filter.inputs.type.options.${option.id}`
                )
              }
            />
            <Button type="submit" className="w-full">
              {t("admin-panel-transactions:filter.actions.apply")}
            </Button>
          </form>
        </FormProvider>
      </PopoverContent>
    </Popover>
  );
}

export default TransactionFilter;
