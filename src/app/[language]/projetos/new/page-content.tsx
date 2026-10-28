"use client";

import { useState } from "react";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { CheckCircle2, ClipboardList, RotateCcw } from "lucide-react";
import { IdeaForm } from "../idea-form";

function NewProjectIdeaPageContent() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center justify-center space-y-5 py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          <div className="space-y-1.5">
            <h2 className="font-heading text-xl font-bold">
              Recebemos sua ideia!
            </h2>
            <p className="text-sm text-muted-foreground">
              Ela passará por revisão de um moderador. Assim que for aprovada, a
              comunidade poderá demonstrar interesse e você poderá montar o
              time.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Propor outra ideia
            </Button>
            <Button render={<Link href="/projetos/mine" />} className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Ver meus projetos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 px-4 py-8">
      <div>
        <p className="mb-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-primary">
          Propor ideia
        </p>
        <h1 className="font-heading text-[28px] font-bold tracking-tight">
          Que projeto a comunidade deveria construir?
        </h1>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          Depois de aprovada, outras pessoas poderão dizer em qual cargo
          gostariam de atuar — e você escolhe quem entra no time.
        </p>
      </div>

      <IdeaForm onSuccess={() => setSubmitted(true)} />
    </div>
  );
}

export default withPageRequiredAuth(NewProjectIdeaPageContent);
