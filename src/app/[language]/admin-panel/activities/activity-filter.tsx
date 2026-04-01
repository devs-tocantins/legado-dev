"use client";

import { useTranslation } from "@/services/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ActivityFilterType } from "./activity-filter-types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FormCheckboxInput from "@/components/form/checkbox-boolean/form-checkbox-boolean";

type ActivityFilterFormData = {
  requiresProof?: boolean;
};

function ActivityFilter() {
  const { t } = useTranslation("admin-panel-activities");
  const router = useRouter();
  const searchParams = useSearchParams();

  const methods = useForm<ActivityFilterFormData>({
    defaultValues: { requiresProof: undefined },
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
              const cleanData: ActivityFilterType = {};
              if (data.requiresProof !== undefined)
                cleanData.requiresProof = data.requiresProof;
              searchParams.set("filter", JSON.stringify(cleanData));
              router.push(
                window.location.pathname + "?" + searchParams.toString()
              );
            })}
            className="space-y-4"
          >
            <FormCheckboxInput<ActivityFilterFormData>
              name="requiresProof"
              testId="requiresProof"
              label={t(
                "admin-panel-activities:filter.inputs.requiresProof.label"
              )}
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
