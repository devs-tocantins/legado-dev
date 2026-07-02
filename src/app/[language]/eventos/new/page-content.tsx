"use client";

import { useState } from "react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { CheckCircle2, ClipboardList, RotateCcw } from "lucide-react";
import { EventForm } from "../event-form";

function NewEventPageContent() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          <div className="space-y-1.5">
            <h2 className="font-heading text-xl font-bold">
              Recebemos seu evento!
            </h2>
            <p className="text-sm text-muted-foreground">
              Ele passará por revisão de um moderador e aparecerá na agenda
              pública assim que for aprovado.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Divulgar outro evento
            </Button>
            <Button render={<Link href="/eventos/mine" />} className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Ver meus eventos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-7">
      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Divulgar evento
        </p>
        <h1 className="font-heading text-[28px] font-bold tracking-tight">
          Compartilhe um evento com a comunidade
        </h1>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          Seu evento entra em análise e é publicado na agenda pública assim que
          aprovado por um moderador.
        </p>
      </div>

      <EventForm onSuccess={() => setSubmitted(true)} />
    </div>
  );
}

export default withPageRequiredAuth(NewEventPageContent);
