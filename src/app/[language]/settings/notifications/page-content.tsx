"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useGetNotificationPreferencesService,
  useUpdateNotificationPreferencesService,
} from "@/services/api/services/notifications";
import {
  useGetMyGamificationProfileService,
  useUpdateMyGamificationProfileService,
} from "@/services/api/services/gamification-profiles";
import { NotificationPreference } from "@/services/api/types/notification";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import {
  Bell,
  Mail,
  MessageCircle,
  Trophy,
  Target,
  CalendarClock,
} from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function NotificationSettingsPageContent() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const getPrefs = useGetNotificationPreferencesService();
  const updatePrefs = useUpdateNotificationPreferencesService();
  const getMyProfile = useGetMyGamificationProfileService();
  const updateMyProfile = useUpdateMyGamificationProfileService();

  const [whatsappInput, setWhatsappInput] = useState("");

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const { status, data } = await getPrefs();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { status, data } = await getMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
  });

  const { mutate: update, isPending } = useMutation({
    mutationFn: (
      data: Partial<
        Pick<
          NotificationPreference,
          | "emailOnSubmissionApproved"
          | "emailOnMissionWon"
          | "whatsappOnSubmissionApproved"
          | "whatsappOnMissionWon"
          | "whatsappOnEventChanges"
        >
      >
    ) => updatePrefs(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      enqueueSnackbar("Preferências salvas.", { variant: "success" });
    },
    onError: () => enqueueSnackbar("Erro ao salvar.", { variant: "error" }),
  });

  const { mutate: saveWhatsappNumber, isPending: isSavingWhatsapp } =
    useMutation({
      mutationFn: async (whatsappNumber: string) => {
        if (!profile) throw new Error("Perfil não carregado.");
        const { status, data } = await updateMyProfile({
          username: profile.username,
          whatsappNumber,
        });
        if (status !== HTTP_CODES_ENUM.OK) {
          throw new Error(getApiError(data, "Erro ao salvar número."));
        }
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        enqueueSnackbar("Número de WhatsApp salvo!", { variant: "success" });
      },
      onError: (err: Error) =>
        enqueueSnackbar(err.message || "Erro ao salvar número.", {
          variant: "error",
        }),
    });

  const handleSaveWhatsapp = () => {
    const digits = whatsappInput.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) {
      enqueueSnackbar("Informe um número válido com DDD.", {
        variant: "error",
      });
      return;
    }
    const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
    saveWhatsappNumber(withCountryCode);
  };

  const maskPhone = (number: string) => {
    const local = number.startsWith("55") ? number.slice(2) : number;
    const ddd = local.slice(0, 2);
    const rest = local.slice(2);
    const visible = rest.slice(-4);
    return `+55 (${ddd}) ${"*".repeat(Math.max(0, rest.length - 4))}${visible}`;
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          Notificações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha quais eventos você quer receber por email.
        </p>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="px-5 py-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Emails
          </span>
        </div>

        {isLoading ? (
          <div className="px-5 py-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-start gap-3">
                <Trophy className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Submissão aprovada</p>
                  <p className="text-xs text-muted-foreground">
                    Receba um email quando uma atividade sua for aprovada
                  </p>
                </div>
              </div>
              <Toggle
                checked={prefs?.emailOnSubmissionApproved ?? true}
                disabled={isPending}
                onChange={(v) => update({ emailOnSubmissionApproved: v })}
              />
            </div>

            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Missão vencida</p>
                  <p className="text-xs text-muted-foreground">
                    Receba um email quando você vencer uma missão
                  </p>
                </div>
              </div>
              <Toggle
                checked={prefs?.emailOnMissionWon ?? true}
                disabled={isPending}
                onChange={(v) => update({ emailOnMissionWon: v })}
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="px-5 py-3 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            WhatsApp
          </span>
        </div>

        {isLoadingProfile ? (
          <div className="px-5 py-4 space-y-3">
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        ) : !profile?.whatsappNumber ? (
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Cadastre seu número para receber notificações por WhatsApp.
            </p>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="(63) 99999-9999"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                disabled={isSavingWhatsapp}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button onClick={handleSaveWhatsapp} disabled={isSavingWhatsapp}>
                {isSavingWhatsapp ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O número só pode ser definido uma vez. Para trocar depois, entre
              em contato com o suporte.
            </p>
          </div>
        ) : isLoading ? (
          <div className="px-5 py-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <div className="px-5 py-3">
              <p className="text-sm font-medium">
                {maskPhone(profile.whatsappNumber)}
              </p>
              <p className="text-xs text-muted-foreground">
                Número já vinculado. Fale com o suporte para alterar.
              </p>
            </div>

            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-start gap-3">
                <Trophy className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Submissão aprovada</p>
                  <p className="text-xs text-muted-foreground">
                    Receba um WhatsApp quando uma atividade sua for aprovada
                  </p>
                </div>
              </div>
              <Toggle
                checked={prefs?.whatsappOnSubmissionApproved ?? false}
                disabled={isPending}
                onChange={(v) => update({ whatsappOnSubmissionApproved: v })}
              />
            </div>

            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Missão vencida</p>
                  <p className="text-xs text-muted-foreground">
                    Receba um WhatsApp quando você vencer uma missão
                  </p>
                </div>
              </div>
              <Toggle
                checked={prefs?.whatsappOnMissionWon ?? false}
                disabled={isPending}
                onChange={(v) => update({ whatsappOnMissionWon: v })}
              />
            </div>

            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Mudanças em eventos</p>
                  <p className="text-xs text-muted-foreground">
                    Receba um WhatsApp quando um evento que você segue mudar ou
                    for cancelado
                  </p>
                </div>
              </div>
              <Toggle
                checked={prefs?.whatsappOnEventChanges ?? false}
                disabled={isPending}
                onChange={(v) => update({ whatsappOnEventChanges: v })}
              />
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        As notificações dentro da plataforma (sininho) sempre aparecem
        independente dessas configurações.
      </p>
    </div>
  );
}

export default withPageRequiredAuth(NotificationSettingsPageContent);
