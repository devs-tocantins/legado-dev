"use client";

import withPageRequiredGuest from "@/services/auth/with-page-required-guest";
import { useForm, FormProvider, useFormState, useWatch } from "react-hook-form";
import {
  useAuthLoginService,
  useAuthSignUpService,
} from "@/services/api/services/auth";
import { useCheckUsernameService } from "@/services/api/services/gamification-profiles";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "@/components/link";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "react-i18next";
import SocialAuth from "@/services/social-auth/social-auth";
import { isGoogleAuthEnabled } from "@/services/social-auth/google/google-config";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/components/auth-layout";

type TPolicy = {
  id: string;
  name: string;
};

type SignUpFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  policy: TPolicy[];
};

function useValidationSchema() {
  const { t } = useTranslation("sign-up");

  return yup.object().shape({
    firstName: yup.string().required(t("inputs.firstName.validation.required")),
    lastName: yup.string().required(t("inputs.lastName.validation.required")),
    email: yup
      .string()
      .email(t("inputs.email.validation.invalid"))
      .required(t("inputs.email.validation.required")),
    password: yup
      .string()
      .min(6, t("inputs.password.validation.min"))
      .required(t("inputs.password.validation.required")),
    username: yup
      .string()
      .min(3, "Mínimo 3 caracteres")
      .max(30, "Máximo 30 caracteres")
      .matches(
        /^[a-z0-9_-]+$/,
        "Apenas letras minúsculas, números, underscore e hífen"
      )
      .required("O @username é obrigatório"),
    policy: yup
      .array()
      .min(1, t("inputs.policy.validation.required"))
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
      {isSubmitting ? "Criando conta..." : t("actions.submit")}
    </Button>
  );
}

function SignUpForm() {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLogin = useAuthLoginService();
  const fetchAuthSignUp = useAuthSignUpService();
  const checkUsernameService = useCheckUsernameService();
  const { t } = useTranslation("sign-up");
  const validationSchema = useValidationSchema();
  const [showPassword, setShowPassword] = useState(false);
  const [policyChecked, setPolicyChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<
    boolean | null | "checking"
  >(null);
  const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const methods = useForm<SignUpFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      username: "",
      policy: [],
    },
  });

  const { register, handleSubmit, setError, setValue, control } = methods;
  const { errors } = useFormState({ control });

  const watchedUsername = useWatch({ control, name: "username" });

  useEffect(() => {
    const raw = watchedUsername ?? "";
    const normalized = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (normalized.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameAvailable("checking");
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const { status, data } = await checkUsernameService(normalized);
        if (status === HTTP_CODES_ENUM.OK) {
          setUsernameAvailable(data.available);
        } else {
          setUsernameAvailable(null);
        }
      } catch {
        setUsernameAvailable(null);
      }
    }, 400);
    return () => {
      if (usernameDebounceRef.current)
        clearTimeout(usernameDebounceRef.current);
    };
  }, [watchedUsername]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePolicyChange = (checked: boolean) => {
    setPolicyChecked(checked);
    setValue(
      "policy",
      checked ? [{ id: "policy", name: t("inputs.policy.agreement") }] : [],
      { shouldValidate: true }
    );
  };

  const onSubmit = handleSubmit(async (formData) => {
    if (usernameAvailable === false) {
      setError("username", {
        type: "manual",
        message: "Este @username já está em uso",
      });
      return;
    }

    const { data: dataSignUp, status: statusSignUp } = await fetchAuthSignUp({
      ...formData,
      username: formData.username.toLowerCase(),
    });

    if (statusSignUp === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(dataSignUp.errors) as Array<keyof SignUpFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: dataSignUp.errors[key],
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
      <AuthLayout title={t("title")} subtitle={t("subtitle")}>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="firstName">
                {t("inputs.firstName.label")}
              </label>
              <input
                id="firstName"
                type="text"
                autoFocus
                data-testid="first-name"
                placeholder={t("inputs.firstName.placeholder")}
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
                {t("inputs.lastName.label")}
              </label>
              <input
                id="lastName"
                type="text"
                data-testid="last-name"
                placeholder={t("inputs.lastName.placeholder")}
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

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="username">
              @username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">
                @
              </span>
              <input
                id="username"
                type="text"
                data-testid="username"
                placeholder="seu_username"
                {...register("username")}
                onChange={(e) => {
                  const val = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_-]/g, "");
                  setValue("username", val, { shouldValidate: true });
                }}
                className={cn(
                  "w-full rounded-lg border border-input bg-background pl-7 pr-9 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                  errors.username &&
                    "border-destructive focus:ring-destructive/30",
                  usernameAvailable === true &&
                    !errors.username &&
                    "border-emerald-500 focus:ring-emerald-500/30"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameAvailable === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameAvailable === true && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                {usernameAvailable === false && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </span>
            </div>
            {errors.username && (
              <p className="text-xs text-destructive">
                {errors.username.message}
              </p>
            )}
            {!errors.username && usernameAvailable === false && (
              <p className="text-xs text-destructive">
                Este @username já está em uso
              </p>
            )}
            {!errors.username && usernameAvailable === true && (
              <p className="text-xs text-emerald-600">@username disponível!</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              {t("inputs.email.label")}
            </label>
            <input
              id="email"
              type="email"
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
            <label className="text-sm font-medium" htmlFor="password">
              {t("inputs.password.label")}
            </label>
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
                {t("inputs.policy.agreement")}{" "}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="font-medium text-primary hover:underline"
                >
                  {t("inputs.policy.label")}
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
              {t("actions.accountAlreadyExists")}
            </Link>
          </p>
        </form>

        {isGoogleAuthEnabled && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <SocialAuth />
          </>
        )}
      </AuthLayout>
    </FormProvider>
  );
}

function SignUp() {
  return <SignUpForm />;
}

export default withPageRequiredGuest(SignUp);
