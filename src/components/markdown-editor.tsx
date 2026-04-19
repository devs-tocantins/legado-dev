"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            "resize-y font-mono",
            error && "border-destructive"
          )}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
