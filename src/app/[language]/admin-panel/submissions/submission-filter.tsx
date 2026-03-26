"use client";

import { useTranslation } from "@/services/i18n/client";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Popover from "@mui/material/Popover";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { SubmissionFilterType } from "./submission-filter-types";
import FormSelectInput from "@/components/form/select/form-select";
import { SubmissionStatusEnum } from "@/services/api/types/submission";

type SubmissionFilterFormData = SubmissionFilterType;

function SubmissionFilter() {
  const { t } = useTranslation("admin-panel-submissions");
  const router = useRouter();
  const searchParams = useSearchParams();

  const methods = useForm<SubmissionFilterFormData>({
    defaultValues: {
      status: undefined,
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
  const id = open ? "submission-filter-popover" : undefined;

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
                <FormSelectInput<SubmissionFilterFormData, { id: string }>
                  name="status"
                  testId="status"
                  label={t(
                    "admin-panel-submissions:filter.inputs.status.label"
                  )}
                  options={Object.values(SubmissionStatusEnum).map((value) => ({
                    id: value,
                  }))}
                  keyValue="id"
                  renderOption={(option) =>
                    t(
                      `admin-panel-submissions:filter.inputs.status.options.${option.id}`
                    )
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="contained" type="submit">
                  {t("admin-panel-submissions:filter.actions.apply")}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Container>
      </Popover>
      <Button aria-describedby={id} variant="contained" onClick={handleClick}>
        {t("admin-panel-submissions:filter.actions.filter")}
      </Button>
    </FormProvider>
  );
}

export default SubmissionFilter;
