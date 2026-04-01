"use client";

import { useTranslation } from "@/services/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { SubmissionFilterType } from "./submission-filter-types";
import { SubmissionStatusEnum } from "@/services/api/types/submission";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FormSelectInput from "@/components/form/select/form-select-shadcn";

function SubmissionFilter() {
  const { t } = useTranslation("admin-panel-submissions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const methods = useForm<SubmissionFilterType>({
    defaultValues: { status: undefined },
  });
  const { handleSubmit, reset } = methods;

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) reset(JSON.parse(filter));
  }, [searchParams, reset]);

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline">
          {t("admin-panel-submissions:filter.actions.filter")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit((data) => {
              const sp = new URLSearchParams(window.location.search);
              sp.set("filter", JSON.stringify(data));
              router.push(window.location.pathname + "?" + sp.toString());
            })}
            className="space-y-4"
          >
            <FormSelectInput<SubmissionFilterType, { id: string }>
              name="status"
              testId="status"
              label={t("admin-panel-submissions:filter.inputs.status.label")}
              options={Object.values(SubmissionStatusEnum).map((v) => ({
                id: v,
              }))}
              keyValue="id"
              renderOption={(option) =>
                t(
                  `admin-panel-submissions:filter.inputs.status.options.${option.id}`
                )
              }
            />
            <Button type="submit" className="w-full">
              {t("admin-panel-submissions:filter.actions.apply")}
            </Button>
          </form>
        </FormProvider>
      </PopoverContent>
    </Popover>
  );
}

export default SubmissionFilter;
