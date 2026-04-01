"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useAuthPatchMeService } from "@/services/api/services/auth";
import {
  useGetMyGamificationProfileService,
  useUpdateMyGamificationProfileService,
} from "@/services/api/services/gamification-profiles";
import { useQuery } from "@tanstack/react-query";
import useAuthActions from "@/services/auth/use-auth-actions";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect, useState } from "react";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { UserProviderEnum } from "@/services/api/types/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

// --- Types ---
type BasicInfoFormData = {
  firstName: string;
  lastName: string;
  photo?: FileEntity;
};

type ChangeEmailFormData = {
  email: string;
  emailConfirmation: string;
};

type ChangePasswordFormData = {
  oldPassword: string;
  password: string;
  passwordConfirmation: string;
};

// --- Field component ---
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function TextInput({
  error,
  type = "text",
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      type={type}
      {...props}
      className={cn(
        "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all",
        error && "border-destructive focus:ring-destructive/30",
        className
      )}
    />
  );
}

// --- Form: Basic Info ---
const useBasicInfoSchema = () => {
  const { t } = useTranslation("profile");
  return yup.object().shape({
    firstName: yup
      .string()
      .required(t("profile:inputs.firstName.validation.required")),
    lastName: yup
      .string()
      .required(t("profile:inputs.lastName.validation.required")),
  });
};

function BasicInfoActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-profile">
      {t("profile:actions.submit")}
    </Button>
  );
}

function FormBasicInfo() {
  const { setUser } = useAuthActions();
  const { user } = useAuth();
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation("profile");
  const validationSchema = useBasicInfoSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<BasicInfoFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { firstName: "", lastName: "", photo: undefined },
  });

  const { handleSubmit, setError, reset, register, control } = methods;
  const { errors } = useFormState({ control });

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe(formData);
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof BasicInfoFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `profile:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      setUser(data);
      enqueueSnackbar(t("profile:alerts.profile.success"), {
        variant: "success",
      });
    }
  });

  useEffect(() => {
    reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      photo: user?.photo,
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("profile:title1")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormAvatarInput<BasicInfoFormData> name="photo" testId="photo" />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t("profile:inputs.firstName.label")}
                error={errors.firstName?.message}
              >
                <TextInput
                  data-testid="first-name"
                  error={!!errors.firstName}
                  {...register("firstName")}
                />
              </Field>
              <Field
                label={t("profile:inputs.lastName.label")}
                error={errors.lastName?.message}
              >
                <TextInput
                  data-testid="last-name"
                  error={!!errors.lastName}
                  {...register("lastName")}
                />
              </Field>
            </div>
            <div className="flex gap-2 pt-1">
              <BasicInfoActions />
              <Button
                type="button"
                variant="outline"
                render={<Link href="/profile" />}
                data-testid="cancel-edit-profile"
              >
                {t("profile:actions.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// --- Form: Change Email ---
const useChangeEmailSchema = () => {
  const { t } = useTranslation("profile");
  const { user } = useAuth();
  return yup.object().shape({
    email: yup
      .string()
      .notOneOf(
        [user?.email],
        t("profile:inputs.email.validation.currentEmail")
      )
      .email(t("profile:inputs.email.validation.email"))
      .required(t("profile:inputs.email.validation.required")),
    emailConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("email")],
        t("profile:inputs.emailConfirmation.validation.match")
      )
      .required(t("profile:inputs.emailConfirmation.validation.required")),
  });
};

function ChangeEmailActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-email">
      {t("profile:actions.submit")}
    </Button>
  );
}

function FormChangeEmail() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation("profile");
  const { user } = useAuth();
  const validationSchema = useChangeEmailSchema();

  const methods = useForm<ChangeEmailFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { email: "", emailConfirmation: "" },
  });

  const { handleSubmit, reset, setError, register, control } = methods;
  const { errors } = useFormState({ control });

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({ email: formData.email });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof ChangeEmailFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `profile:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset();
      enqueueSnackbar(t("profile:alerts.email.success"), {
        variant: "success",
        autoHideDuration: 15000,
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("profile:title2")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Email atual:{" "}
              <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <Field
              label={t("profile:inputs.email.label")}
              error={errors.email?.message}
            >
              <TextInput
                type="email"
                data-testid="email"
                error={!!errors.email}
                {...register("email")}
              />
            </Field>
            <Field
              label={t("profile:inputs.emailConfirmation.label")}
              error={errors.emailConfirmation?.message}
            >
              <TextInput
                type="email"
                data-testid="email-confirmation"
                error={!!errors.emailConfirmation}
                {...register("emailConfirmation")}
              />
            </Field>
            <div className="flex gap-2 pt-1">
              <ChangeEmailActions />
              <Button
                type="button"
                variant="outline"
                render={<Link href="/profile" />}
                data-testid="cancel-edit-email"
              >
                {t("profile:actions.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// --- Form: Change Password ---
const useChangePasswordSchema = () => {
  const { t } = useTranslation("profile");
  return yup.object().shape({
    oldPassword: yup
      .string()
      .min(6, t("profile:inputs.password.validation.min"))
      .required(t("profile:inputs.password.validation.required")),
    password: yup
      .string()
      .min(6, t("profile:inputs.password.validation.min"))
      .required(t("profile:inputs.password.validation.required")),
    passwordConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t("profile:inputs.passwordConfirmation.validation.match")
      )
      .required(t("profile:inputs.passwordConfirmation.validation.required")),
  });
};

function ChangePasswordActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-password">
      {t("profile:actions.submit")}
    </Button>
  );
}

function PasswordField({
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
    <Field label={label} error={error}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          data-testid={testId}
          {...props}
          className={cn(
            "w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all",
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
    </Field>
  );
}

function FormChangePassword() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation("profile");
  const validationSchema = useChangePasswordSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<ChangePasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: { oldPassword: "", password: "", passwordConfirmation: "" },
  });

  const { handleSubmit, setError, reset, register, control } = methods;
  const { errors } = useFormState({ control });

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({
      password: formData.password,
      oldPassword: formData.oldPassword,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof ChangePasswordFormData>).forEach(
        (key) => {
          setError(key, {
            type: "manual",
            message: t(
              `profile:inputs.${key}.validation.server.${data.errors[key]}`
            ),
          });
        }
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset();
      enqueueSnackbar(t("profile:alerts.password.success"), {
        variant: "success",
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("profile:title3")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <PasswordField
              label={t("profile:inputs.oldPassword.label")}
              error={errors.oldPassword?.message}
              testId="old-password"
              {...register("oldPassword")}
            />
            <PasswordField
              label={t("profile:inputs.password.label")}
              error={errors.password?.message}
              testId="new-password"
              {...register("password")}
            />
            <PasswordField
              label={t("profile:inputs.passwordConfirmation.label")}
              error={errors.passwordConfirmation?.message}
              testId="password-confirmation"
              {...register("passwordConfirmation")}
            />
            <div className="flex gap-2 pt-1">
              <ChangePasswordActions />
              <Button
                type="button"
                variant="outline"
                render={<Link href="/profile" />}
                data-testid="cancel-edit-password"
              >
                {t("profile:actions.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// --- Form: Username ---
function FormUsername() {
  const fetchMyProfile = useGetMyGamificationProfileService();
  const updateMyProfile = useUpdateMyGamificationProfileService();
  const { enqueueSnackbar } = useSnackbar();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.username) setUsername(profile.username);
  }, [profile?.username]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) {
      setError("3–30 caracteres: letras minúsculas, números e underscore.");
      return;
    }
    setSaving(true);
    try {
      const { status, data } = await updateMyProfile({ username: trimmed });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Username atualizado com sucesso!", {
          variant: "success",
        });
        setUsername((data as { username: string }).username);
      } else if (status === HTTP_CODES_ENUM.CONFLICT) {
        setError("Este username já está em uso.");
      } else {
        setError("Erro ao atualizar username.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !profile) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Username da Comunidade</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="@username" error={error}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  @
                </span>
                <TextInput
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    setError("");
                  }}
                  placeholder="seu_username"
                  className={cn(
                    "pl-7",
                    error && "border-destructive focus:ring-destructive/30"
                  )}
                  error={!!error}
                  maxLength={30}
                />
              </div>
              <Button
                type="submit"
                disabled={saving || username === profile.username}
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Aparece no ranking e no seu perfil público (
              <a
                href={`/u/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                /u/{profile.username}
              </a>
              )
            </p>
          </Field>
        </form>
      </CardContent>
    </Card>
  );
}

// --- Wrappers for email-only providers ---
function ChangeEmailWrapper() {
  const { user } = useAuth();
  return user?.provider === UserProviderEnum.EMAIL ? <FormChangeEmail /> : null;
}

function ChangePasswordWrapper() {
  const { user } = useAuth();
  return user?.provider === UserProviderEnum.EMAIL ? (
    <FormChangePassword />
  ) : null;
}

function EditProfile() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Editar Perfil</h1>
      <FormBasicInfo />
      <FormUsername />
      <ChangeEmailWrapper />
      <ChangePasswordWrapper />
    </div>
  );
}

export default withPageRequiredAuth(EditProfile);
