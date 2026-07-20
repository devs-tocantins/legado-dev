"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateTrackSuggestionService } from "@/services/api/services/track-suggestions";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useSnackbar } from "@/hooks/use-snackbar";
import { getApiError } from "@/lib/utils";

type TrackSuggestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = sugestão de melhoria para esta trilha. Ausente = sugestão de trilha nova. */
  trackId?: string;
  trackTitle?: string;
};

export function TrackSuggestionDialog({
  open,
  onOpenChange,
  trackId,
  trackTitle,
}: TrackSuggestionDialogProps) {
  const createSuggestion = useCreateTrackSuggestionService();
  const { enqueueSnackbar } = useSnackbar();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isImprovement = !!trackId;

  const reset = () => {
    setTitle("");
    setMessage("");
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    if (!isImprovement && !title.trim()) return;

    setSubmitting(true);
    try {
      const { status, data } = await createSuggestion({
        trackId,
        title: isImprovement ? undefined : title.trim(),
        message: message.trim(),
      });
      if (status === HTTP_CODES_ENUM.CREATED) {
        enqueueSnackbar("Sugestão enviada! A moderação vai dar uma olhada.", {
          variant: "success",
        });
        reset();
        onOpenChange(false);
      } else {
        enqueueSnackbar(getApiError(data, "Erro ao enviar sugestão."), {
          variant: "error",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isImprovement
              ? `Sugerir melhoria para "${trackTitle}"`
              : "Sugerir uma nova trilha"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-1">
          <p className="text-sm text-muted-foreground">
            {isImprovement
              ? "Conte o que você acha que essa trilha poderia ter, corrigir ou explicar melhor. Sua sugestão vai para a moderação, que decide o que muda."
              : "Descreva a ideia da trilha — tema, público, o que a pessoa deveria aprender. A moderação avalia e, se fizer sentido, um admin cria a trilha."}
          </p>
          {!isImprovement && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome da trilha</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Frontend inicial"
                maxLength={150}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {isImprovement ? "Sua sugestão" : "Descreva a ideia"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={
                isImprovement
                  ? "Ex.: acho que faltava um marco explicando autenticação antes da prova final..."
                  : "Ex.: uma trilha só de lógica de programação, com exercícios independentes de linguagem..."
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              submitting || !message.trim() || (!isImprovement && !title.trim())
            }
          >
            {submitting ? "Enviando..." : "Enviar sugestão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
