"use client";

import { useForm, FormProvider, useFormState } from "react-hook-form";
import {
  useAuthPatchMeService,
  useAuthDeleteMeService,
} from "@/services/api/services/auth";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

// --- Form: Delete Account ---
function FormDeleteAccount() {
  const deleteMe = useAuthDeleteMeService();
  const { logOut } = useAuthActions();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "EXCLUIR") return;
    setDeleting(true);
    try {
      const result = await deleteMe();
      if (
        result.status === HTTP_CODES_ENUM.NO_CONTENT ||
        result.status === HTTP_CODES_ENUM.OK
      ) {
        setOpen(false);
        logOut();
        window.location.href = "/";
      } else {
        enqueueSnackbar("Erro ao tentar excluir a conta.", {
          variant: "error",
        });
      }
    } catch {
      enqueueSnackbar("Erro de rede ao excluir a conta.", { variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/30 bg-destructive/5 mt-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Zona de Risco
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ao excluir sua conta, você perderá permanentemente acesso ao seu
          perfil e todas as suas submissões serão anonimizadas. Seu saldo de XP
          e tokens será zerado.
        </p>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Excluir minha conta
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação <strong>não pode ser desfeita</strong>. Sua conta será
                excluída, seus dados pessoais serão removidos e você
                desaparecerá do ranking.
                <br />
                <br />
                Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-2">
              <TextInput
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="font-mono uppercase"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleting}
                onClick={() => setConfirmText("")}
              >
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== "EXCLUIR" || deleting}
              >
                {deleting ? "Excluindo..." : "Sim, excluir minha conta"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
import {
  useGetMyGamificationProfileService,
  useUpdateMyGamificationProfileService,
} from "@/services/api/services/gamification-profiles";
import { useFileUploadService } from "@/services/api/services/files";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AvatarEditor } from "@/components/avatar";
import { svgToPngFile } from "@/components/avatar/utils/avatar-utils";

// --- Form: Profile Picture (foto ou avatar num único card sem abas) ---
function FormProfilePicture() {
  const { user } = useAuth();
  const { setUser } = useAuthActions();
  const fetchAuthPatchMe = useAuthPatchMeService();
  const fileUploadService = useFileUploadService();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const updateMyProfile = useUpdateMyGamificationProfileService();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const [saving, setSaving] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<{
    svg: string;
    config: string;
  } | null>(null);

  const previewUrl = user?.photo?.path ?? null;

  const invalidateProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    if (profile?.username) {
      await queryClient.invalidateQueries({
        queryKey: ["public-profile", profile.username],
      });
    }
  };

  const uploadErrorMessage = (data: unknown) => {
    const serverError = (data as any)?.errors?.file;
    if (serverError === "cantUploadFileType") {
      return "Formato de arquivo não suportado. Envie apenas JPG ou PNG.";
    }
    return serverError || "Erro ao fazer upload da imagem.";
  };

  const savePhotoFile = async (file: File) => {
    const uploadResult = await fileUploadService(file);
    if (uploadResult.status !== HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(uploadErrorMessage(uploadResult.data), {
        variant: "error",
      });
      return false;
    }

    const photoEntity = uploadResult.data.file;
    const patchResult = await fetchAuthPatchMe({ photo: photoEntity });
    if (patchResult.status !== HTTP_CODES_ENUM.OK) {
      enqueueSnackbar("Erro ao salvar foto de perfil no perfil.", {
        variant: "error",
      });
      return false;
    }

    setUser(patchResult.data);
    return true;
  };

  const handleRemovePhoto = async () => {
    setSaving(true);
    try {
      const patchResult = await fetchAuthPatchMe({ photo: null });
      if (patchResult.status === HTTP_CODES_ENUM.OK) {
        setUser(patchResult.data);
        enqueueSnackbar("Foto removida.", { variant: "success" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    const file = _e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      enqueueSnackbar("Por favor, selecione uma imagem válida.", {
        variant: "error",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar("A imagem deve ter no máximo 5MB.", { variant: "error" });
      return;
    }

    setCropImageSrc(URL.createObjectURL(file));
  };

  const closeCropDialog = () => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    const input = document.getElementById(
      "photo-upload-input"
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    closeCropDialog();

    const file = new File([blob], "profile-photo.jpg", {
      type: "image/jpeg",
    });

    setSaving(true);
    try {
      const ok = await savePhotoFile(file);
      if (ok) {
        enqueueSnackbar("Foto de perfil atualizada!", { variant: "success" });
      }
    } catch {
      enqueueSnackbar("Erro de rede ao salvar foto.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!pendingAvatar) return;
    setSaving(true);
    try {
      const pngFile = await svgToPngFile(pendingAvatar.svg);
      const ok = await savePhotoFile(pngFile);
      if (ok) {
        if (profile) {
          await updateMyProfile({
            username: profile.username,
            avatarConfig: pendingAvatar.config,
          });
          await invalidateProfile();
        }
        enqueueSnackbar("Avatar salvo!", { variant: "success" });
        setAvatarDialogOpen(false);
      }
    } catch {
      enqueueSnackbar("Erro ao salvar avatar.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Foto de Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Envie uma foto ou monte um avatar. Diferente do resto, isto é aplicado
          na hora — sem precisar salvar.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="shrink-0">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="h-16 w-16 rounded-full border-2 border-primary/30 object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center text-muted-foreground text-[10px] text-center leading-tight px-1 font-medium">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="default"
              disabled={saving}
              onClick={() =>
                document.getElementById("photo-upload-input")?.click()
              }
            >
              {saving ? "Salvando..." : "Enviar foto"}
            </Button>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setAvatarDialogOpen(true)}
            >
              {profile?.avatarConfig ? "Editar avatar" : "Criar avatar"}
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleRemovePhoto}
                disabled={saving}
              >
                Remover
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Aplicado imediatamente ao confirmar no modal.
        </p>
      </CardContent>

      <ImageCropDialog
        open={!!cropImageSrc}
        imageSrc={cropImageSrc}
        onCancel={closeCropDialog}
        onConfirm={handleCropConfirm}
      />

      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="flex h-[min(85svh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b px-5 py-3.5">
            <DialogTitle>Monte seu avatar</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 px-5 py-4">
            <AvatarEditor
              initialConfig={profile?.avatarConfig ?? undefined}
              onChange={setPendingAvatar}
              className="h-full"
            />
          </div>
          <DialogFooter className="shrink-0 border-t px-5 py-3.5">
            <Button
              variant="outline"
              onClick={() => setAvatarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAvatar}
              disabled={saving || !pendingAvatar}
            >
              {saving ? "Salvando..." : "Salvar avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthActions from "@/services/auth/use-auth-actions";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useCallback, useEffect, useState } from "react";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { UserProviderEnum } from "@/services/api/types/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import { cn } from "@/lib/utils";
import { Mail, CheckCircle2, Loader2, Trophy } from "lucide-react";
import { useAuthForgotPasswordService } from "@/services/api/services/auth";
import { BANNER_PRESETS } from "@/app/[language]/u/[username]/page-content";
import { getLevel, LEVELS } from "@/lib/gamification";

// --- Types ---
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
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const getRemainingCurrent = () => {
      const last = Number(localStorage.getItem(key) ?? 0);
      return Math.max(
        0,
        Math.floor((last + COOLDOWN_SECONDS * 1000 - Date.now()) / 1000)
      );
    };

    setRemaining(getRemainingCurrent());
    const id = setInterval(() => {
      const r = getRemainingCurrent();
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [key]);
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

// --- Form: Identidade (nome + banner + username) — modelo rascunho/salvo ---
type IdentityDraft = { name: string; banner: string; username: string };

type FormActions = {
  saving: boolean;
  save: () => Promise<void>;
  discard: () => void;
};

function UnsavedBadge() {
  return (
    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
      não salvo
    </span>
  );
}

function SaveStatusBar({
  dirty,
  saving,
  onDiscard,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur transition-colors",
        dirty
          ? "border-amber-400/50 bg-amber-50/95 dark:bg-amber-950/40"
          : "border-border bg-card/95"
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            dirty ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
        <span className="font-medium">
          {dirty ? "Você tem alterações não salvas" : "Tudo salvo"}
        </span>
      </div>
      {dirty && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            disabled={saving}
          >
            Descartar
          </Button>
          <Button type="button" onClick={onSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FormIdentity({
  onDraftChange,
}: {
  onDraftChange?: (
    draft: IdentityDraft,
    dirty: boolean,
    actions?: FormActions
  ) => void;
}) {
  const { user } = useAuth();
  const { setUser } = useAuthActions();
  const fetchAuthPatchMe = useAuthPatchMeService();
  const fetchMyProfile = useGetMyGamificationProfileService();
  const updateMyProfile = useUpdateMyGamificationProfileService();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const [saved, setSaved] = useState<IdentityDraft | null>(null);
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [nameError, setNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (saved || !user || !profile) return;
    const initial: IdentityDraft = {
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      banner: profile.bannerPreset || "raiz-verde",
      username: profile.username,
    };
    setSaved(initial);
    setDraft(initial);
  }, [saved, user, profile]);

  const nameChanged = !!saved && !!draft && draft.name !== saved.name;
  const bannerChanged = !!saved && !!draft && draft.banner !== saved.banner;
  const usernameChanged =
    !!saved && !!draft && draft.username !== saved.username;
  const dirty = nameChanged || bannerChanged || usernameChanged;

  useLeavePage(dirty);

  const discard = () => {
    setDraft(saved);
    setNameError("");
    setUsernameError("");
  };

  const save = async () => {
    if (!saved || !draft) return;
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      setNameError("Nome é obrigatório.");
      return;
    }
    const trimmedUsername = draft.username.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,30}$/.test(trimmedUsername)) {
      setUsernameError(
        "3–30 caracteres: letras minúsculas, números, underscore e hífen."
      );
      return;
    }

    setSaving(true);
    try {
      if (nameChanged) {
        const [firstName, ...rest] = trimmedName.split(/\s+/);
        const lastName = rest.join(" ");
        const patchResult = await fetchAuthPatchMe({ firstName, lastName });
        if (patchResult.status !== HTTP_CODES_ENUM.OK) {
          enqueueSnackbar("Erro ao salvar nome.", { variant: "error" });
          return;
        }
        setUser(patchResult.data);
      }

      if (bannerChanged || usernameChanged) {
        const { status } = await updateMyProfile({
          username: trimmedUsername,
          bannerPreset: draft.banner,
        });
        if (status === HTTP_CODES_ENUM.CONFLICT) {
          setUsernameError("Este username já está em uso.");
          return;
        }
        if (status !== HTTP_CODES_ENUM.OK) {
          enqueueSnackbar("Erro ao salvar alterações.", { variant: "error" });
          return;
        }
      }

      const previousUsername = saved.username;
      const persisted: IdentityDraft = {
        ...draft,
        name: trimmedName,
        username: trimmedUsername,
      };
      setSaved(persisted);
      setDraft(persisted);
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      await queryClient.invalidateQueries({
        queryKey: ["public-profile", trimmedUsername],
      });
      if (previousUsername !== trimmedUsername) {
        await queryClient.invalidateQueries({
          queryKey: ["public-profile", previousUsername],
        });
      }
      enqueueSnackbar("Alterações salvas!", { variant: "success" });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (draft) onDraftChange?.(draft, dirty, { saving, save, discard });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, dirty, saving]);

  if (!saved || !draft) return null;

  const setField = (patch: Partial<IdentityDraft>) => {
    setNameError("");
    setUsernameError("");
    setDraft((d) => (d ? { ...d, ...patch } : d));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Nome
            {nameChanged && <UnsavedBadge />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Nome completo" error={nameError}>
            <TextInput
              value={draft.name}
              onChange={(e) => setField({ name: e.target.value })}
              placeholder="Seu nome"
              error={!!nameError}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Banner do Perfil Público
            {bannerChanged && <UnsavedBadge />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha o banner que aparece no topo do seu perfil público. A prévia
            ao lado atualiza na hora — nada muda de verdade até você salvar.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(BANNER_PRESETS).map(([key, { url, label }]) => (
              <button
                key={key}
                type="button"
                onClick={() => setField({ banner: key })}
                className={cn(
                  "relative h-14 rounded-lg overflow-hidden border-2 transition-all",
                  draft.banner === key
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border hover:border-muted-foreground"
                )}
                title={label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-white drop-shadow">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Username da Comunidade
            {usernameChanged && <UnsavedBadge />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="@username" error={usernameError}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                @
              </span>
              <TextInput
                value={draft.username}
                onChange={(e) =>
                  setField({ username: e.target.value.toLowerCase() })
                }
                placeholder="seu_username"
                className="pl-7"
                error={!!usernameError}
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Aparece no ranking e no seu perfil público (
              <a
                href={`/u/${saved.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                /u/{saved.username}
              </a>
              )
            </p>
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Prévia ao vivo do cabeçalho do perfil público ---
function LivePreviewCard({
  firstName,
  lastName,
  username,
  bannerKey,
  photoUrl,
  totalXp,
  dirty,
}: {
  firstName: string;
  lastName: string;
  username: string;
  bannerKey: string;
  photoUrl?: string | null;
  totalXp: number;
  dirty?: boolean;
}) {
  const banner = BANNER_PRESETS[bannerKey] ?? BANNER_PRESETS["raiz-verde"];
  const level = getLevel(totalXp);
  const levelNumber = LEVELS.indexOf(level) + 1;
  const fullName = `${firstName} ${lastName}`.trim() || "Seu nome";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  return (
    <div>
      <p className="mb-2.5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            dirty ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
        Prévia do perfil público
        {dirty && (
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            prévia · não salvo
          </span>
        )}
      </p>
      <div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_6px_0_var(--border)]">
        <div className="relative aspect-[4/1] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 font-mono text-[10px] text-white/80">
            seu banner
          </span>
        </div>
        <div className="relative px-6 pb-6">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="-mt-10 h-20 w-20 rounded-[20px] border-4 border-card object-cover"
            />
          ) : (
            <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-[20px] border-4 border-card bg-primary text-2xl font-bold text-primary-foreground">
              {initials}
            </div>
          )}
          <p className="mt-3 text-xl font-bold tracking-tight">{fullName}</p>
          <p className="font-mono text-sm text-muted-foreground">
            @{username || "seu_username"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              N{levelNumber} · {level.name}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" />
              {totalXp} XP
            </span>
          </div>
        </div>
      </div>
    </div>
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
  const { user } = useAuth();
  const fetchMyProfile = useGetMyGamificationProfileService();

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      return status === HTTP_CODES_ENUM.OK ? data : null;
    },
  });

  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [formActions, setFormActions] = useState<FormActions | null>(null);

  const handleDraftChange = useCallback(
    (nextDraft: IdentityDraft, dirty: boolean, actions?: FormActions) => {
      setDraft(nextDraft);
      setDraftDirty(dirty);
      if (actions) {
        setFormActions(actions);
      }
    },
    []
  );

  const [previewFirstName, ...previewLastNameParts] = (draft?.name ?? "").split(
    /\s+/
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Editar Perfil</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <FormProfilePicture />
          <FormIdentity onDraftChange={handleDraftChange} />
        </div>
        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          <LivePreviewCard
            firstName={draft ? previewFirstName || "" : (user?.firstName ?? "")}
            lastName={
              draft ? previewLastNameParts.join(" ") : (user?.lastName ?? "")
            }
            username={draft?.username || (profile?.username ?? "")}
            bannerKey={draft?.banner || "raiz-verde"}
            photoUrl={user?.photo?.path}
            totalXp={profile?.totalXp ?? 0}
            dirty={draftDirty}
          />
          <SaveStatusBar
            dirty={draftDirty}
            saving={formActions?.saving ?? false}
            onDiscard={formActions?.discard ?? (() => {})}
            onSave={formActions?.save ?? (() => {})}
          />
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <ChangeEmailWrapper />
        <ChangePasswordWrapper />
        <FormDeleteAccount />
      </div>
    </div>
  );
}

export default withPageRequiredAuth(EditProfile);
