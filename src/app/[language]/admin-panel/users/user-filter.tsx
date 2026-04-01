"use client";

import { Role, RoleEnum } from "@/services/api/types/role";
import { useTranslation } from "@/services/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { UserFilterType } from "./user-filter-types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import FormSelectInput from "@/components/form/select/form-select-shadcn";

type UserFilterFormData = UserFilterType;

function UserFilter() {
  const { t } = useTranslation("admin-panel-users");
  const router = useRouter();
  const searchParams = useSearchParams();

  const methods = useForm<UserFilterFormData>({
    defaultValues: {
      roles: [],
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
          {t("admin-panel-users:filter.actions.filter")}
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
            <FormSelectInput<UserFilterFormData, Pick<Role, "id">>
              name="roles"
              testId="roles"
              label={t("admin-panel-users:filter.inputs.role.label")}
              options={[{ id: RoleEnum.ADMIN }, { id: RoleEnum.USER }]}
              keyValue="id"
              renderOption={(option) =>
                t(`admin-panel-users:filter.inputs.role.options.${option.id}`)
              }
            />
            <Button type="submit" className="w-full">
              {t("admin-panel-users:filter.actions.apply")}
            </Button>
          </form>
        </FormProvider>
      </PopoverContent>
    </Popover>
  );
}

export default UserFilter;
