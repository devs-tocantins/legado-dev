"use client";

import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useAuthResetPasswordService } from "@/services/api/services/auth";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSnackbar } from "@/hooks/use-snackbar";
import { useRouter } from "next/navigation";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordChangeFormData = {
  password: string;
  passwordConfirmation: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation("password-change");
  return yup.object().shape({
    password: yup
      .string()
      .min(6, t("password-change:inputs.password.validation.min"))
      .required(t("password-change:inputs.password.validation.required")),
    passwordConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t("password-change:inputs.passwordConfirmation.validation.match")
      )
      .required(
        t("password-change:inputs.passwordConfirmation.validation.required")
      ),
  });
};

function FormActions() {
  const { t } = useTranslation("password-change");
  const { isSubmitting } = useFormState();
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      className="w-full"
      size="lg"
      data-testid="set-password"
    >
      {isSubmitting ? "Salvando..." : t("password-change:actions.submit")}
    </Button>
  );
}

function ExpiresAlert() {
  const { t } = useTranslation("password-change");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const expires = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("expires"));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      if (expires < now) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expires]);

  if (expires >= currentTime) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
      data-testid="reset-link-expired-alert"
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      {t("password-change:alerts.expired")}
    </div>
  );
}

function PasswordInput({
  label,
  error,
  testId,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  testId?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          data-testid={testId}
          {...props}
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all",
            error && "border-destructive focus:ring-destructive/30"
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Form() {
  const { enqueueSnackbar } = useSnackbar();
  const fetchAuthResetPassword = useAuthResetPasswordService();
  const { t } = useTranslation("password-change");
  const validationSchema = useValidationSchema();
  const router = useRouter();

  const methods = useForm<PasswordChangeFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  const { handleSubmit, setError, register, control } = methods;
  const { errors } = useFormState({ control });

  const onSubmit = handleSubmit(async (formData) => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get("hash");
    if (!hash) return;

    const { data, status } = await fetchAuthResetPassword({
      password: formData.password,
      hash,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof PasswordChangeFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `password-change:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }

    if (status === HTTP_CODES_ENUM.NO_CONTENT) {
      enqueueSnackbar(t("password-change:alerts.success"), {
        variant: "success",
      });
      router.replace("/sign-in");
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t("password-change:title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie uma nova senha segura para sua conta
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <ExpiresAlert />
            <PasswordInput
              label={t("password-change:inputs.password.label")}
              error={errors.password?.message}
              testId="password"
              placeholder="••••••••"
              {...register("password")}
            />
            <PasswordInput
              label={t("password-change:inputs.passwordConfirmation.label")}
              error={errors.passwordConfirmation?.message}
              testId="password-confirmation"
              placeholder="••••••••"
              {...register("passwordConfirmation")}
            />
            <FormActions />
          </form>
        </div>
      </div>
    </FormProvider>
  );
}

function PasswordChange() {
  return <Form />;
}

export default withPageRequiredGuest(PasswordChange);
