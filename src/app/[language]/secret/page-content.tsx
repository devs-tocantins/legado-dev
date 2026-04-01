"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useAuth from "@/services/auth/use-auth";
import { useRedeemSecretCodeService } from "@/services/api/services/submissions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "@/components/link";
import { Zap, CheckCircle2, XCircle, KeyRound, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useLanguage from "@/services/i18n/use-language";

type State = "idle" | "redeeming" | "success" | "error" | "already_redeemed";

function SecretPageContent() {
  const searchParams = useSearchParams();
  const language = useLanguage();
  const { user, isLoaded } = useAuth();
  const redeemSecretCode = useRedeemSecretCodeService();

  const codeFromUrl = searchParams.get("code") ?? "";
  const [code, setCode] = useState(codeFromUrl);
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [awardedXp, setAwardedXp] = useState(0);

  // Auto-redeem if code is in URL and user is authenticated
  useEffect(() => {
    if (isLoaded && user && codeFromUrl && state === "idle") {
      handleRedeem(codeFromUrl);
    }
  }, [isLoaded, user, codeFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRedeem = async (secretCode: string) => {
    if (!secretCode.trim()) return;
    setState("redeeming");
    setErrorMessage("");

    try {
      const { status, data } = await redeemSecretCode({
        secretCode: secretCode.trim().toUpperCase(),
      });

      if (status === HTTP_CODES_ENUM.OK) {
        setAwardedXp((data as { awardedXp: number }).awardedXp ?? 0);
        setState("success");
      } else if (status === HTTP_CODES_ENUM.BAD_REQUEST) {
        // Cooldown or already redeemed
        setState("already_redeemed");
        setErrorMessage(
          (data as { message?: string }).message ??
            "Você já resgatou este código recentemente."
        );
      } else if (status === HTTP_CODES_ENUM.NOT_FOUND) {
        setState("error");
        setErrorMessage("Código inválido ou atividade não encontrada.");
      } else {
        setState("error");
        setErrorMessage("Erro inesperado. Tente novamente.");
      }
    } catch {
      setState("error");
      setErrorMessage("Falha na conexão. Tente novamente.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRedeem(code);
  };

  // Not loaded yet
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not logged in — prompt to sign in, preserving code in redirect
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Código Secreto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {codeFromUrl && (
              <p className="text-sm text-muted-foreground">
                Código detectado:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {codeFromUrl}
                </span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Faça login para resgatar este código e ganhar XP.
            </p>
            <Button
              className="w-full"
              render={
                <Link
                  href={`/${language}/sign-in?returnTo=/${language}/secret${codeFromUrl ? `?code=${encodeURIComponent(codeFromUrl)}` : ""}`}
                />
              }
            >
              Entrar na plataforma
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  if (state === "success") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Código Resgatado!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Participação registrada com sucesso.
              </p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 py-4">
              <p className="text-3xl font-bold text-primary">+{awardedXp} XP</p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Zap className="h-3 w-3" />
                adicionados ao seu perfil
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                render={<Link href="/dashboard" />}
              >
                Dashboard
              </Button>
              <Button className="flex-1" render={<Link href="/submissions" />}>
                Ver histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already redeemed
  if (state === "already_redeemed") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <KeyRound className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Já resgatado</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/dashboard" />}
            >
              Ir para o Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error
  if (state === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Código Inválido</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  setState("idle");
                  setCode("");
                  setErrorMessage("");
                }}
              >
                Tentar outro código
              </Button>
              <Button
                variant="outline"
                className="w-full"
                render={<Link href="/dashboard" />}
              >
                Ir para o Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Idle / manual input
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Resgatar Código Secreto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Código do evento</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: EVENTO2024"
                autoFocus
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono uppercase tracking-widest shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Encontre o código no QR Code do evento ou material da atividade.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={state === "redeeming" || !code.trim()}
            >
              {state === "redeeming" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resgatando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Resgatar XP
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecretPageContent;
