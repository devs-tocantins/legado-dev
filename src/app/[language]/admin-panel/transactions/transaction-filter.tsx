"use client";

import { useTranslation } from "@/services/i18n/client";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Popover from "@mui/material/Popover";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { TransactionFilterType } from "./transaction-filter-types";
import FormSelectInput from "@/components/form/select/form-select";
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

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "transaction-filter-popover" : undefined;

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter) {
      handleClose();
      const filterParsed = JSON.parse(filter);
      reset(filterParsed);
    }
  }, [searchParams, reset]);

  return (
    <FormProvider {...methods}>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Container
          sx={{
            minWidth: 300,
          }}
        >
          <form
            onSubmit={handleSubmit((data) => {
              const searchParams = new URLSearchParams(window.location.search);
              searchParams.set("filter", JSON.stringify(data));
              router.push(
                window.location.pathname + "?" + searchParams.toString()
              );
            })}
          >
            <Grid container spacing={2} mb={3} mt={3}>
              <Grid size={{ xs: 12 }}>
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
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="contained" type="submit">
                  {t("admin-panel-transactions:filter.actions.apply")}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Container>
      </Popover>
      <Button aria-describedby={id} variant="contained" onClick={handleClick}>
        {t("admin-panel-transactions:filter.actions.filter")}
      </Button>
    </FormProvider>
  );
}

export default TransactionFilter;
