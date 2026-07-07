"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { RoleEnum } from "@/services/api/types/role";
import {
  useGetWhatsappStatusService,
  useGetWhatsappQrService,
  useLogoutWhatsappService,
  WhatsappStatus,
} from "@/services/api/services/whatsapp-admin";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { useSnackbar } from "@/hooks/use-snackbar";

const STATUS_LABELS: Record<WhatsappStatus, string> = {
  disabled: "Integração desabilitada (WHATSAPP_ENABLED=false)",
  disconnected: "Desconectado",
  connecting: "Conectando...",
  waiting_for_scan: "Aguardando leitura do QR Code",
  connected: "Conectado",
};

function AdminWhatsappPageContent() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const getStatus = useGetWhatsappStatusService();
  const getQr = useGetWhatsappQrService();
  const logoutWhatsapp = useLogoutWhatsappService();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const { data: statusData } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: async () => {
      const { status, data } = await getStatus();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    refetchInterval: 4000,
  });

  const currentStatus = statusData?.status ?? "disconnected";
  const isConnected = currentStatus === "connected";

  const { data: qrData } = useQuery({
    queryKey: ["whatsapp-qr"],
    queryFn: async () => {
      const { status, data } = await getQr();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    refetchInterval: isConnected ? false : 4000,
    enabled: !isConnected && currentStatus !== "disabled",
  });

  const { mutate: doLogout, isPending: isLoggingOut } = useMutation({
    mutationFn: () => logoutWhatsapp(),
    onSuccess: () => {
      setConfirmingLogout(false);
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-qr"] });
      enqueueSnackbar("WhatsApp desconectado. Escaneie o novo QR Code.", {
        variant: "success",
      });
    },
    onError: () =>
      enqueueSnackbar("Erro ao desconectar.", { variant: "error" }),
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Admin
        </p>
        <h1 className="flex items-center gap-2 font-heading text-[28px] font-bold tracking-tight">
          <MessageCircle className="h-6 w-6 text-primary" />
          WhatsApp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pareie o número de WhatsApp usado pela plataforma para enviar
          notificações.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge className="bg-emerald-600 text-white gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="secondary">{STATUS_LABELS[currentStatus]}</Badge>
          )}
        </div>

        {currentStatus === "disabled" && (
          <p className="text-sm text-muted-foreground">
            Defina <code className="font-mono">WHATSAPP_ENABLED=true</code> no
            ambiente do backend e reinicie a API para habilitar o pareamento.
          </p>
        )}

        {!isConnected && currentStatus !== "disabled" && (
          <div className="flex flex-col items-center gap-3 py-4">
            {qrData?.qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrData.qr}
                alt="QR Code para parear o WhatsApp"
                className="h-56 w-56 rounded-lg border border-border"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-border">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground max-w-xs">
              Abra o WhatsApp no celular dedicado da plataforma → Aparelhos
              conectados → Conectar um aparelho, e escaneie o código acima.
            </p>
          </div>
        )}

        {isConnected && (
          <div className="pt-2">
            {!confirmingLogout ? (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => setConfirmingLogout(true)}
              >
                <LogOut className="h-4 w-4" />
                Desconectar
              </Button>
            ) : (
              <div className="flex flex-col gap-2 rounded-lg bg-secondary p-3.5">
                <p className="text-sm">
                  Isso vai desconectar o número atual e exigir um novo
                  pareamento por QR Code. Tem certeza?
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingLogout(false)}
                    disabled={isLoggingOut}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => doLogout()}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Desconectando..." : "Sim, desconectar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(AdminWhatsappPageContent, {
  roles: [RoleEnum.ADMIN],
});
