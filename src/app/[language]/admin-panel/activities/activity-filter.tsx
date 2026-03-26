"use client";

import { useTranslation } from "@/services/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ActivityFilterType } from "./activity-filter-types";
import { ActivityTypeEnum } from "@/services/api/types/activity";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import FormSelectInput from "@/components/form/select/form-select-shadcn";

type ActivityFilterFormData = ActivityFilterType;

function ActivityFilter() {
  const { t } = useTranslation("admin-panel-activities");
  const router = useRouter();
  const searchParams = useSearchParams();

  const methods = useForm<ActivityFilterFormData>({
    defaultValues: { type: undefined },
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      reset(JSON.parse(filter));
    }
  }, [searchParams, reset]);

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline">
          {t("admin-panel-activities:filter.actions.filter")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit((data) => {
              const searchParams = new URLSearchParams(window.location.search);
              searchParams.set("filter", JSON.stringify(data));
              router.push(window.location.pathname + "?" + searchParams.toString());
            })}
            className="space-y-4"
          >
            <FormSelectInput<ActivityFilterFormData, { id: string }>
              name="type"
              testId="type"
              label={t("admin-panel-activities:filter.inputs.type.label")}
              options={Object.values(ActivityTypeEnum).map((v) => ({ id: v }))}
              keyValue="id"
              renderOption={(option) =>
                t(`admin-panel-activities:filter.inputs.type.options.${option.id}`)
              }
            />
            <Button type="submit" className="w-full">
              {t("admin-panel-activities:filter.actions.apply")}
            </Button>
          </form>
        </FormProvider>
      </PopoverContent>
    </Popover>
  );
}

export default ActivityFilter;
