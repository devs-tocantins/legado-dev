"use client";

import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useAuthLoginService } from "@/services/api/services/auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "@/components/link";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import SocialAuth from "@/services/social-auth/social-auth";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/auth-layout";

type SignInFormData = {
  email: string;
  password: string;
};

function useValidationSchema() {
  const { t } = useTranslation("sign-in");

  return yup.object().shape({
    email: yup
      .string()
      .email(t("inputs.email.validation.invalid"))
      .required(t("inputs.email.validation.required")),
    password: yup
      .string()
      .min(6, t("inputs.password.validation.min"))
      .required(t("inputs.password.validation.required")),
  });
}

function SubmitButton() {
  const { t } = useTranslation("sign-in");
  const { isSubmitting } = useFormState();

  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      data-testid="sign-in-submit"
      className="w-full"
      size="lg"
    >
      {isSubmitting ? t("actions.submit") + "..." : t("actions.submit")}
    </Button>
  );
}

function SignInForm() {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLogin = useAuthLoginService();
  const { t } = useTranslation("sign-in");
  const validationSchema = useValidationSchema();
  const [showPassword, setShowPassword] = useState(false);

  const methods = useForm<SignInFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { email: "", password: "" },
  });

  const { register, handleSubmit, setError, control } = methods;
  const { errors } = useFormState({ control });
  const rootError = errors.root;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthLogin(formData);

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      if (data.errors?.user) {
        setError("root", {
          type: "manual",
          message: t("inputs.user.validation.server.banned"),
        });
        return;
      }
      (Object.keys(data.errors) as Array<keyof SignInFormData>).forEach(
        (key) => {
          setError(key, { type: "manual", message: data.errors[key] });
        }
      );
      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      setTokensInfo({
        token: data.token,
        refreshToken: data.refreshToken,
        tokenExpires: data.tokenExpires,
      });
      setUser(data.user);
    }
  });

  return (
    <FormProvider {...methods}>
      <AuthLayout title={t("title")} subtitle={t("subtitle")}>
        <form onSubmit={onSubmit} className="space-y-4">
          {rootError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {rootError.message}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              {t("inputs.email.label")}
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              data-testid="email"
              placeholder={t("inputs.email.placeholder")}
              {...register("email")}
              className={cn(
                "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                errors.email && "border-destructive focus:ring-destructive/30"
              )}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="password">
                {t("inputs.password.label")}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                data-testid="forgot-password"
              >
                {t("actions.forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                data-testid="password"
                placeholder={t("inputs.password.placeholder")}
                {...register("password")}
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                  errors.password &&
                    "border-destructive focus:ring-destructive/30"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <SubmitButton />

          {IS_SIGN_UP_ENABLED && (
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-primary hover:underline"
                data-testid="create-account"
              >
                {t("actions.createAccount")}
              </Link>
            </p>
          )}
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t("or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <SocialAuth />
      </AuthLayout>
    </FormProvider>
  );
}

function SignIn() {
  return <SignInForm />;
}

export default withPageRequiredGuest(SignIn);
