"use client";

import { useState } from "react";
import {
  usePatchProjectIdeaService,
  usePostProjectIdeaService,
} from "@/services/api/services/projects";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { ProjectIdea } from "@/services/api/types/project";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/utils";
import { FIELD_CLASS } from "./project-components";

function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function IdeaForm({
  idea,
  onSuccess,
}: {
  idea?: ProjectIdea;
  onSuccess: (idea: ProjectIdea) => void;
}) {
  const postIdea = usePostProjectIdeaService();
  const patchIdea = usePatchProjectIdeaService();

  const [title, setTitle] = useState(idea?.title ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [tags, setTags] = useState(idea?.tags.join(", ") ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (title.trim().length < 5) {
      setError("O título precisa ter pelo menos 5 caracteres.");
      return;
    }
    if (description.trim().length < 20) {
      setError("Descreva a ideia com pelo menos 20 caracteres.");
      return;
    }
    const parsedTags = parseTags(tags);
    if (parsedTags.length > 8) {
      setError("Use no máximo 8 tecnologias/temas.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        tags: parsedTags,
      };
      const { status, data } = idea
        ? await patchIdea({ id: idea.id, data: payload })
        : await postIdea(payload);

      if (status === HTTP_CODES_ENUM.CREATED || status === HTTP_CODES_ENUM.OK) {
        onSuccess(data);
      } else {
        setError(getApiError(data, "Erro ao salvar a ideia."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold">
          Título <span className="text-destructive">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          className={FIELD_CLASS}
          placeholder="Ex: Plataforma de doação de alimentos"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold">
          Descrição <span className="text-destructive">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          maxLength={5000}
          className={`${FIELD_CLASS} resize-y`}
          placeholder="Qual problema o projeto resolve? Quem vai usar? O que você imagina para o MVP?"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Tecnologias e temas (opcional, separados por vírgula)
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={FIELD_CLASS}
          placeholder="nestjs, react, mobile"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting
          ? "Salvando..."
          : idea
            ? "Salvar alterações"
            : "Enviar para análise"}
      </Button>
    </form>
  );
}
