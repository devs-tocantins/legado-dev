import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrai a mensagem de erro da resposta da API (formato NestJS).
 * NestJS retorna { message: string | string[], statusCode, error }.
 * Se não encontrar mensagem, retorna o fallback informado.
 */
export function getApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string" && d.message) return d.message;
  if (Array.isArray(d.message) && d.message.length > 0)
    return String(d.message[0]);
  return fallback;
}
