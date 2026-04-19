"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useAuthPatchMeService } from "@/services/api/services/auth";
import {
  useGetMyGamificationProfileService,
  useUpdateMyGamificationProfileService,
} from "@/services/api/services/gamification-profiles";
import { getGitHubAvatarUrl } from "@/lib/github-avatar";
import { useQuery } from "@tanstack/react-query";
import useAuthActions from "@/services/auth/use-auth-actions";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect, useState } from "react";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import { FileEntity } from "@/services/api/types/file-entity";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { UserProviderEnum } from "@/services/api/types/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import { cn } from "@/lib/utils";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthForgotPasswordService } from "@/services/api/services/auth";
import { BANNER_PRESETS } from "@/app/[language]/u/[username]/page-content";

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

function ChangeEmailActions({ cooldown }: { cooldown: number }) {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);
  return (
    <Button
      type="submit"
      disabled={isSubmitting || cooldown > 0}
      data-testid="save-email"
    >
      {cooldown > 0 ? `Aguarde ${cooldown}s` : t("profile:actions.submit")}
    </Button>
  );
}

function FormChangeEmail() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation("profile");
  const { user } = useAuth();
  const validationSchema = useChangeEmailSchema();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { remaining, start } = useCooldown("email-change-last-sent");

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
      setPendingEmail(formData.email);
      start();
      reset();
    }
  });

  return (
    <FormProvider {...methods}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("profile:title2")}</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingEmail ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-emerald-600">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Confirmação enviada!</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Enviamos um link de confirmação para{" "}
                    <span className="font-mono font-medium text-foreground">
                      {pendingEmail}
                    </span>
                    . O e-mail só será alterado após você clicar no link.
                    {remaining > 0 && (
                      <span className="ml-1 text-muted-foreground">
                        (reenvio disponível em {remaining}s)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Seu e-mail atual{" "}
                <span className="font-mono font-medium text-foreground">
                  {user?.email}
                </span>{" "}
                continua ativo até a confirmação.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                disabled={remaining > 0}
                onClick={() => setPendingEmail(null)}
              >
                {remaining > 0
                  ? `Aguarde ${remaining}s para alterar novamente`
                  : "Alterar para outro e-mail"}
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Email atual:{" "}
                <span className="font-medium text-foreground">
                  {user?.email}
                </span>
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
                <ChangeEmailActions cooldown={remaining} />
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
          )}
        </CardContent>
      </Card>
    </FormProvider>
  );
}

const COOLDOWN_SECONDS = 60;

function useCooldown(key: string) {
  const getRemaining = () => {
    const last = Number(localStorage.getItem(key) ?? 0);
    return Math.max(
      0,
      COOLDOWN_SECONDS - Math.floor((Date.now() - last) / 1000)
    );
  };

  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setRemaining(getRemaining());
    const id = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const start = () => {
    localStorage.setItem(key, String(Date.now()));
    setRemaining(COOLDOWN_SECONDS);
  };

  return { remaining, start };
}

// --- Form: Change Password via Email ---
function FormChangePasswordViaEmail() {
  const { user } = useAuth();
  const forgotPassword = useAuthForgotPasswordService();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { remaining, start } = useCooldown("pwd-reset-last-sent");

  const handleSend = async () => {
    if (!user?.email || remaining > 0) return;
    setLoading(true);
    try {
      await forgotPassword({ email: user.email });
      setSent(true);
      start();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Alterar Senha</CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex items-start gap-3 text-sm text-emerald-600">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Link enviado!</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Verifique o e-mail{" "}
                <span className="font-mono font-medium">{user?.email}</span>{" "}
                para criar uma nova senha.
                {remaining > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    (novo link disponível em {remaining}s)
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vamos enviar um link para{" "}
              <span className="font-mono font-medium text-foreground">
                {user?.email}
              </span>
              . Você poderá criar uma nova senha sem precisar lembrar da atual.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleSend}
              disabled={loading || remaining > 0}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {remaining > 0
                ? `Aguarde ${remaining}s para reenviar`
                : "Enviar link para alterar senha"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Form: Banner ---
function FormBanner() {
  const fetchMyProfile = useGetMyGamificationProfileService();
  const updateMyProfile = useUpdateMyGamificationProfileService();
  const { enqueueSnackbar } = useSnackbar();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile-banner"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const [selected, setSelected] = useState("default");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.bannerPreset) setSelected(profile.bannerPreset);
  }, [profile?.bannerPreset]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { status } = await updateMyProfile({
        username: profile.username,
        bannerPreset: selected,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Banner atualizado!", { variant: "success" });
      } else {
        enqueueSnackbar("Erro ao salvar.", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !profile) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Banner do Perfil Público</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Escolha o banner que aparece no topo do seu perfil público.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(BANNER_PRESETS).map(([key, { className, label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "relative h-14 rounded-lg overflow-hidden border-2 transition-all",
                className,
                selected === key
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-border hover:border-muted-foreground"
              )}
              title={label}
            >
              {key === "default" && (
                <svg
                  className="absolute inset-0 h-full w-full text-foreground/10"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <pattern
                      id={`dots-${key}`}
                      x="0"
                      y="0"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="1" cy="1" r="0.8" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#dots-${key})`} />
                </svg>
              )}
              <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-white drop-shadow">
                {label}
              </span>
            </button>
          ))}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || selected === (profile.bannerPreset ?? "default")}
        >
          {saving ? "Salvando..." : "Salvar banner"}
        </Button>
      </CardContent>
    </Card>
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
    if (!/^[a-z0-9_-]{3,30}$/.test(trimmed)) {
      setError(
        "3–30 caracteres: letras minúsculas, números, underscore e hífen."
      );
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

// --- Form: GitHub Username ---
function FormGitHub() {
  const fetchMyProfile = useGetMyGamificationProfileService();
  const updateMyProfile = useUpdateMyGamificationProfileService();
  const { enqueueSnackbar } = useSnackbar();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile-github"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const [githubUsername, setGithubUsername] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setGithubUsername(profile?.githubUsername ?? "");
  }, [profile?.githubUsername]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { status } = await updateMyProfile({
        username: profile.username,
        githubUsername: githubUsername.trim() || null,
      });
      if (status === HTTP_CODES_ENUM.OK) {
        enqueueSnackbar("Foto de perfil atualizada!", { variant: "success" });
      } else {
        enqueueSnackbar("Erro ao salvar.", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !profile) return null;

  const previewUrl = githubUsername.trim()
    ? getGitHubAvatarUrl(githubUsername.trim())
    : null;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Foto de Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A foto de perfil na plataforma vem do seu GitHub.{" "}
            <strong className="text-foreground">
              Coloque seu username do GitHub abaixo
            </strong>{" "}
            e ela aparecerá automaticamente no ranking e no seu perfil público.
          </p>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-16 w-16 rounded-full border-2 border-primary/30 object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center text-muted-foreground text-xs text-center leading-tight px-1">
                  sem foto
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium">Username do GitHub</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                    github.com/
                  </span>
                  <TextInput
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value.trim())}
                    placeholder="seu-usuario"
                    className="pl-[6.5rem]"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex: se seu perfil é github.com/leo-nardo, coloque{" "}
                <code className="bg-muted px-1 rounded">leo-nardo</code>
              </p>
            </div>
          </div>
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
    <FormChangePasswordViaEmail />
  ) : null;
}

function EditProfile() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Editar Perfil</h1>
      <FormBasicInfo />
      <FormGitHub />
      <FormBanner />
      <FormUsername />
      <ChangeEmailWrapper />
      <ChangePasswordWrapper />
    </div>
  );
}

export default withPageRequiredAuth(EditProfile);
