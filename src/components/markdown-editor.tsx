"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

// Imagem vira base64 embutido no próprio markdown (data URL) — sem upload,
// sem depender de storage externo. Guarda-chuva de 2MB no arquivo original
// pra não inflar o campo de texto com um base64 gigante (~2.7MB de texto).
const MAX_PASTED_IMAGE_BYTES = 2 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("markdown-body text-sm", className)}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

// ─── Markdown editor with preview toggle ─────────────────────────────────────

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: ReactNode;
  error?: string;
  maxLength?: number;
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Suporta **markdown**: `código`, *itálico*, **negrito**, listas, cabeçalhos...",
  rows = 8,
  label,
  error,
  maxLength,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const [pasteError, setPasteError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + text.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/")
    );
    if (!imageItem) return;

    e.preventDefault();
    setPasteError("");
    const file = imageItem.getAsFile();
    if (!file) return;

    if (file.size > MAX_PASTED_IMAGE_BYTES) {
      setPasteError(
        "Imagem muito grande (máx. 2 MB). Reduza o tamanho e tente colar de novo."
      );
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      insertAtCursor(`\n![imagem](${dataUrl})\n`);
    } catch {
      setPasteError("Não foi possível colar a imagem. Tente novamente.");
    }
  };

  const toggle = (
    <div className="flex rounded-md border overflow-hidden text-xs shrink-0">
      <button
        type="button"
        onClick={() => setPreview(false)}
        className={cn(
          "px-2.5 py-1 transition-colors",
          !preview
            ? "bg-primary text-primary-foreground"
            : "bg-transparent text-muted-foreground hover:bg-muted"
        )}
      >
        Editar
      </button>
      <button
        type="button"
        onClick={() => setPreview(true)}
        className={cn(
          "px-2.5 py-1 transition-colors",
          preview
            ? "bg-primary text-primary-foreground"
            : "bg-transparent text-muted-foreground hover:bg-muted"
        )}
      >
        Preview
      </button>
    </div>
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        <div className="flex items-center gap-3">
          {label ? (
            <span className="text-sm font-medium leading-none">{label}</span>
          ) : (
            <span />
          )}
          {maxLength && (
            <span
              className={cn(
                "text-xs tabular-nums",
                value.length >= maxLength
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
        {toggle}
      </div>

      {preview ? (
        <div
          className={cn(
            "min-h-[120px] w-full rounded-md border bg-muted/30 px-3 py-2",
            error && "border-destructive"
          )}
        >
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Nada para visualizar.
            </p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (pasteError) setPasteError("");
          }}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={rows}
          onInput={(e) => {
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
          style={{ fieldSizing: "content" }}
          className={cn(
            "w-full min-h-[120px] field-sizing-content rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            "font-mono",
            error && "border-destructive"
          )}
        />
      )}

      {!preview && (
        <p className="text-xs text-muted-foreground">
          Dica: cole (Ctrl+V) uma imagem copiada pra inserir direto no texto.
        </p>
      )}

      {pasteError && <p className="text-xs text-destructive">{pasteError}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
