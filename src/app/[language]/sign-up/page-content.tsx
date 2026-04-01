"use client";

import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import {
  useAuthLoginService,
  useAuthSignUpService,
} from "@/services/api/services/auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "@/components/link";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import SocialAuth from "@/services/social-auth/social-auth";
import { isGoogleAuthEnabled } from "@/services/social-auth/google/google-config";
import { Button } from "@/components/ui/button";
import { Zap, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TPolicy = {
  id: string;
  name: string;
};

type SignUpFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  policy: TPolicy[];
};

function useValidationSchema() {
  const { t } = useTranslation("sign-up");

  return yup.object().shape({
    firstName: yup
      .string()
      .required(t("sign-up:inputs.firstName.validation.required")),
    lastName: yup
      .string()
      .required(t("sign-up:inputs.lastName.validation.required")),
    email: yup
      .string()
      .email(t("sign-up:inputs.email.validation.invalid"))
      .required(t("sign-up:inputs.email.validation.required")),
    password: yup
      .string()
      .min(6, t("sign-up:inputs.password.validation.min"))
      .required(t("sign-up:inputs.password.validation.required")),
    policy: yup
      .array()
      .min(1, t("sign-up:inputs.policy.validation.required"))
      .required(),
  });
}

function SubmitButton() {
  const { t } = useTranslation("sign-up");
  const { isSubmitting } = useFormState();

  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      data-testid="sign-up-submit"
      className="w-full"
      size="lg"
    >
      {isSubmitting ? "Criando conta..." : t("sign-up:actions.submit")}
    </Button>
  );
}

function SignUpForm() {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLogin = useAuthLoginService();
  const fetchAuthSignUp = useAuthSignUpService();
  const { t } = useTranslation("sign-up");
  const validationSchema = useValidationSchema();
  const [showPassword, setShowPassword] = useState(false);
  const [policyChecked, setPolicyChecked] = useState(false);

  const methods = useForm<SignUpFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      policy: [],
    },
  });

  const { register, handleSubmit, setError, setValue, control } = methods;
  const { errors } = useFormState({ control });

  const handlePolicyChange = (checked: boolean) => {
    setPolicyChecked(checked);
    setValue(
      "policy",
      checked
        ? [{ id: "policy", name: t("sign-up:inputs.policy.agreement") }]
        : [],
      { shouldValidate: true }
    );
  };

  const onSubmit = handleSubmit(async (formData) => {
    const { data: dataSignUp, status: statusSignUp } =
      await fetchAuthSignUp(formData);

    if (statusSignUp === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(dataSignUp.errors) as Array<keyof SignUpFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `sign-up:inputs.${key}.validation.server.${dataSignUp.errors[key]}`
            ),
          });
        }
      );
      return;
    }

    const { data: dataSignIn, status: statusSignIn } = await fetchAuthLogin({
      email: formData.email,
      password: formData.password,
    });

    if (statusSignIn === HTTP_CODES_ENUM.OK) {
      setTokensInfo({
        token: dataSignIn.token,
        refreshToken: dataSignIn.refreshToken,
        tokenExpires: dataSignIn.tokenExpires,
      });
      setUser(dataSignIn.user);
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t("sign-up:title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Junte-se à comunidade Devs Tocantins
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="firstName">
                  {t("sign-up:inputs.firstName.label")}
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoFocus
                  data-testid="first-name"
                  placeholder="João"
                  {...register("firstName")}
                  className={cn(
                    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    errors.firstName &&
                      "border-destructive focus:ring-destructive/30"
                  )}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="lastName">
                  {t("sign-up:inputs.lastName.label")}
                </label>
                <input
                  id="lastName"
                  type="text"
                  data-testid="last-name"
                  placeholder="Silva"
                  {...register("lastName")}
                  className={cn(
                    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                    errors.lastName &&
                      "border-destructive focus:ring-destructive/30"
                  )}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                {t("sign-up:inputs.email.label")}
              </label>
              <input
                id="email"
                type="email"
                data-testid="email"
                placeholder="seu@email.com"
                {...register("email")}
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                  errors.email && "border-destructive focus:ring-destructive/30"
                )}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                {t("sign-up:inputs.password.label")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  data-testid="password"
                  placeholder="••••••••"
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

            {/* Policy */}
            <div className="space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="privacy"
                  checked={policyChecked}
                  onChange={(e) => handlePolicyChange(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
                />
                <span className="text-sm text-muted-foreground leading-snug">
                  {t("sign-up:inputs.policy.agreement")}{" "}
                  <Link
                    href="/privacy-policy"
                    target="_blank"
                    className="font-medium text-primary hover:underline"
                  >
                    {t("sign-up:inputs.policy.label")}
                  </Link>
                </span>
              </label>
              {errors.policy && (
                <p className="text-xs text-destructive">
                  {errors.policy.message}
                </p>
              )}
            </div>

            <SubmitButton />

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-primary hover:underline"
                data-testid="login"
              >
                {t("sign-up:actions.accountAlreadyExists")}
              </Link>
            </p>
          </form>

          {isGoogleAuthEnabled && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {t("sign-up:or")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <SocialAuth />
            </>
          )}
        </div>
      </div>
    </FormProvider>
  );
}

function SignUp() {
  return <SignUpForm />;
}

export default withPageRequiredGuest(SignUp);
