import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrai a mensagem de erro da resposta da API (formato NestJS / Fastify / custom).
 * NestJS retorna { message: string | string[], statusCode, error }.
 * Algumas APIs retornam { errors: { campo: "mensagem" } } ou { errors: string[] }.
 * Se não encontrar mensagem, retorna o fallback informado.
 */
export function getApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string" && d.message.trim()) return d.message;
  if (Array.isArray(d.message) && d.message.length > 0 && d.message[0])
    return String(d.message[0]);

  if (d.errors) {
    if (typeof d.errors === "string" && d.errors.trim()) return d.errors;
    if (Array.isArray(d.errors) && d.errors.length > 0 && d.errors[0])
      return String(d.errors[0]);
    if (typeof d.errors === "object" && d.errors !== null) {
      for (const val of Object.values(d.errors)) {
        if (typeof val === "string" && val.trim()) return val;
        if (Array.isArray(val) && val.length > 0 && val[0])
          return String(val[0]);
      }
    }
  }

  return fallback;
}

export function formatCurrency(
  value: number | string | null | undefined
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num === null || num === undefined || isNaN(num)) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(0);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatTimeAgo(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  return `há ${years} ${years === 1 ? "ano" : "anos"}`;
}
