import {
  EventCategory,
  EventModality,
  EventStatus,
} from "@/services/api/types/event";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  [EventCategory.MEETUP]: "Meetup",
  [EventCategory.WORKSHOP]: "Workshop",
  [EventCategory.HACKATHON]: "Hackathon",
  [EventCategory.PALESTRA]: "Palestra",
  [EventCategory.CURSO]: "Curso",
  [EventCategory.OUTRO]: "Outro",
};

export const EVENT_MODALITY_LABELS: Record<EventModality, string> = {
  [EventModality.ONLINE]: "Online",
  [EventModality.PRESENCIAL]: "Presencial",
  [EventModality.HIBRIDO]: "Híbrido",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.PENDING]: "Pendente",
  [EventStatus.APPROVED]: "Aprovado",
  [EventStatus.REJECTED]: "Rejeitado",
  [EventStatus.CANCELLED]: "Cancelado",
};

export const REMINDER_OPTIONS = [
  { value: 15, label: "15 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 dia antes" },
];

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEventDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function dayNumber(iso: string): string {
  return String(new Date(iso).getDate()).padStart(2, "0");
}

export function monthWeekday(iso: string): string {
  const date = new Date(iso);
  const weekday = date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  const month = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  return `${weekday} · ${month}`;
}

export function timeRange(startIso: string, endIso?: string | null): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(startIso);
  const startLabel = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  if (!endIso) return startLabel;
  const end = new Date(endIso);
  return `${startLabel} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

export function dateKey(iso: string): string {
  return iso.slice(0, 10);
}
