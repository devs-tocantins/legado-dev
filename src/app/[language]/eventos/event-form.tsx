"use client";

import { useState } from "react";
import {
  usePostEventService,
  usePatchEventService,
} from "@/services/api/services/events";
import { useFileUploadService } from "@/services/api/services/files";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  Event,
  EventCategory,
  EventModality,
} from "@/services/api/types/event";
import { FileEntity } from "@/services/api/types/file-entity";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  Loader2,
  Check,
  MapPin,
  Video,
  Shuffle,
} from "lucide-react";
import { cn, getApiError } from "@/lib/utils";
import { useSnackbar } from "@/hooks/use-snackbar";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_MODALITY_LABELS,
  timeRange,
} from "@/lib/event-labels";

const MODALITY_ICONS: Record<
  EventModality,
  React.ComponentType<{ className?: string }>
> = {
  [EventModality.ONLINE]: Video,
  [EventModality.PRESENCIAL]: MapPin,
  [EventModality.HIBRIDO]: Shuffle,
};

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export type EventFormValues = {
  title: string;
  description: string;
  category: EventCategory;
  modality: EventModality;
  startAt: string;
  endAt: string;
  location: string;
  locationMapUrl: string;
  onlineUrl: string;
  externalUrl: string;
  coverImage: FileEntity | null;
};

function buildInitialValues(event?: Event): EventFormValues {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    category: event?.category ?? EventCategory.MEETUP,
    modality: event?.modality ?? EventModality.PRESENCIAL,
    startAt: toDatetimeLocal(event?.startAt),
    endAt: toDatetimeLocal(event?.endAt),
    location: event?.location ?? "",
    locationMapUrl: event?.locationMapUrl ?? "",
    onlineUrl: event?.onlineUrl ?? "",
    externalUrl: event?.externalUrl ?? "",
    coverImage: event?.coverImage ?? null,
  };
}

function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(options).map(([optValue, label]) => (
        <button
          key={optValue}
          type="button"
          onClick={() => onChange(optValue as T)}
          className={cn(
            "rounded-[9px] border px-3.5 py-2 text-[13px] font-medium transition-colors",
            value === optValue
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {label as string}
        </button>
      ))}
    </div>
  );
}

export function EventForm({
  event,
  onSuccess,
}: {
  event?: Event;
  onSuccess: (event: Event) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const postEvent = usePostEventService();
  const patchEvent = usePatchEventService();
  const uploadFile = useFileUploadService();

  const [values, setValues] = useState<EventFormValues>(
    buildInitialValues(event)
  );
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!event;

  const handleChange =
    (field: keyof EventFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { status, data } = await uploadFile(file);
      if (status === HTTP_CODES_ENUM.CREATED) {
        setValues((prev) => ({ ...prev, coverImage: data.file }));
      } else {
        enqueueSnackbar("Erro ao enviar a imagem de capa.", {
          variant: "error",
        });
      }
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!values.title.trim() || !values.description.trim() || !values.startAt) {
      setError("Preencha título, descrição e data de início.");
      return;
    }
    if (values.modality !== EventModality.ONLINE && !values.location.trim()) {
      setError("Informe o local para eventos presenciais/híbridos.");
      return;
    }
    if (
      values.modality !== EventModality.PRESENCIAL &&
      !values.onlineUrl.trim()
    ) {
      setError("Informe o link online para eventos online/híbridos.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        modality: values.modality,
        startAt: new Date(values.startAt).toISOString(),
        endAt: values.endAt ? new Date(values.endAt).toISOString() : undefined,
        location: values.location.trim() || undefined,
        locationMapUrl: values.locationMapUrl.trim() || undefined,
        onlineUrl: values.onlineUrl.trim() || undefined,
        externalUrl: values.externalUrl.trim() || undefined,
        coverImageId: values.coverImage?.id,
      };

      const { status, data } = isEditing
        ? await patchEvent({ id: event!.id, data: payload })
        : await postEvent(payload);

      if (status === HTTP_CODES_ENUM.CREATED || status === HTTP_CODES_ENUM.OK) {
        onSuccess(data);
      } else {
        setError(getApiError(data, "Erro ao salvar o evento."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const PreviewModalityIcon = MODALITY_ICONS[values.modality];
  const previewStart = values.startAt ? new Date(values.startAt) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold">
            Título do evento <span className="text-destructive">*</span>
          </label>
          <input
            value={values.title}
            onChange={handleChange("title")}
            maxLength={150}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ex: Meetup de TypeScript em Palmas"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold">
            Descrição <span className="text-destructive">*</span>
          </label>
          <textarea
            value={values.description}
            onChange={handleChange("description")}
            rows={5}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="Do que se trata o evento, para quem é, o que esperar..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Categoria</label>
          <ChipSelect
            options={EVENT_CATEGORY_LABELS}
            value={values.category}
            onChange={(category) =>
              setValues((prev) => ({ ...prev, category }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold">Modalidade</label>
          <ChipSelect
            options={EVENT_MODALITY_LABELS}
            value={values.modality}
            onChange={(modality) =>
              setValues((prev) => ({ ...prev, modality }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Início <span className="text-destructive">*</span>
            </label>
            <input
              type="datetime-local"
              value={values.startAt}
              onChange={handleChange("startAt")}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Término (opcional)
            </label>
            <input
              type="datetime-local"
              value={values.endAt}
              onChange={handleChange("endAt")}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            />
          </div>
        </div>

        {values.modality !== EventModality.ONLINE && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Local <span className="text-destructive">*</span>
            </label>
            <input
              value={values.location}
              onChange={handleChange("location")}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              placeholder="Endereço ou nome do espaço"
            />
          </div>
        )}

        {values.modality !== EventModality.ONLINE && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Link do Google Maps (opcional)
            </label>
            <input
              value={values.locationMapUrl}
              onChange={handleChange("locationMapUrl")}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              placeholder="https://maps.app.goo.gl/..."
            />
          </div>
        )}

        {values.modality !== EventModality.PRESENCIAL && (
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">
              Link online <span className="text-destructive">*</span>
            </label>
            <input
              value={values.onlineUrl}
              onChange={handleChange("onlineUrl")}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
              placeholder="https://meet.google.com/..."
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Link externo (opcional)
          </label>
          <input
            value={values.externalUrl}
            onChange={handleChange("externalUrl")}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            placeholder="Página oficial ou formulário de inscrição"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Capa (opcional)
          </label>
          {values.coverImage ? (
            <div className="flex items-center gap-2 rounded-lg border border-input bg-secondary px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.coverImage.path}
                alt=""
                className="h-10 w-10 rounded object-cover"
              />
              <span className="text-sm flex-1 truncate">
                Imagem selecionada
              </span>
              <button
                type="button"
                onClick={() =>
                  setValues((prev) => ({ ...prev, coverImage: null }))
                }
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-border bg-secondary px-3 py-6 text-center transition-colors hover:border-primary/50">
              {uploadingCover ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                Arraste uma imagem ou clique para enviar · 1200×630px
                recomendado
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleCoverChange}
                disabled={uploadingCover}
              />
            </label>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={submitting || uploadingCover}
          size="lg"
          className="w-full gap-2"
        >
          {submitting ? (
            "Salvando..."
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isEditing ? "Salvar alterações" : "Enviar para análise"}
            </>
          )}
        </Button>
      </form>

      <div className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prévia do card
          </p>
          <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
            <div
              className="relative h-28"
              style={
                values.coverImage
                  ? undefined
                  : {
                      backgroundImage:
                        "repeating-linear-gradient(135deg, var(--secondary), var(--secondary) 10px, var(--background) 10px, var(--background) 20px)",
                    }
              }
            >
              {values.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={values.coverImage.path}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span className="absolute left-2.5 top-2.5 rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold shadow-sm">
                {EVENT_CATEGORY_LABELS[values.category]}
              </span>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              <h3 className="font-heading text-[15px] font-semibold leading-snug">
                {values.title || "Título do seu evento"}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <PreviewModalityIcon className="h-3.5 w-3.5" />
                {EVENT_MODALITY_LABELS[values.modality]}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {previewStart
                  ? `${previewStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${timeRange(values.startAt)}`
                  : "Data a definir"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
