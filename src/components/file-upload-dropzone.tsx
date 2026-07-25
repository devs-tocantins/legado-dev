"use client";

import { useState, ReactNode, DragEvent, ChangeEvent } from "react";
import { Upload, Loader2, X, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type FileUploadDropzoneProps = {
  file?: File | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  uploading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  hintText?: string;
  error?: string;
  label?: ReactNode;
  className?: string;
};

export function FileUploadDropzone({
  file,
  fileUrl,
  fileName,
  fileSize,
  onFileSelect,
  onFileRemove,
  uploading = false,
  accept = "image/jpeg,image/png,image/gif",
  hintText = "Arraste um arquivo ou clique para enviar",
  error,
  label,
  className,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
      e.target.value = "";
    }
  };

  const displayName =
    file?.name ?? fileName ?? (fileUrl ? "Arquivo selecionado" : null);
  const displaySize = file?.size ?? fileSize;
  const isImage = file
    ? file.type.startsWith("image/")
    : fileUrl
      ? /\.(jpg|jpeg|png|gif|webp|svg)/i.test(fileUrl) ||
        fileUrl.startsWith("data:image/") ||
        fileUrl.includes("/uploads/")
      : false;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="text-sm font-medium flex items-center gap-1.5">
          {label}
        </div>
      )}

      {displayName || fileUrl ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-input bg-secondary px-3 py-2 text-sm">
          {uploading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : isImage && (fileUrl || file) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file ? URL.createObjectURL(file) : fileUrl!}
              alt=""
              className="h-9 w-9 rounded object-cover shrink-0"
            />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-emerald-500" />
          )}

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {displayName}
            </p>
            {displaySize ? (
              <p className="text-xs text-muted-foreground">
                {(displaySize / 1024 / 1024).toFixed(1)} MB
              </p>
            ) : null}
          </div>

          {!uploading && onFileRemove && (
            <button
              type="button"
              onClick={onFileRemove}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed px-3 py-5 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5 text-primary"
              : error
                ? "border-destructive bg-destructive/5"
                : "border-input bg-secondary/50 hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload
              className={cn(
                "h-5 w-5",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}
          <span
            className={cn(
              "text-xs",
              isDragging ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            {hintText}
          </span>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleChange}
            disabled={uploading}
          />
        </label>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
