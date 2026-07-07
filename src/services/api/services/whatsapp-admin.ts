import { useCallback } from "react";
import useFetch from "../use-fetch";
import { API_URL } from "../config";
import wrapperFetchJsonResponse from "../wrapper-fetch-json-response";
import { RequestConfigType } from "./types/request-config";

export type WhatsappStatus =
  | "disabled"
  | "disconnected"
  | "connecting"
  | "waiting_for_scan"
  | "connected";

export function useGetWhatsappStatusService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/whatsapp/admin/status`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<{ status: WhatsappStatus }>),
    [fetch]
  );
}

export function useGetWhatsappQrService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/whatsapp/admin/qrcode`, {
        method: "GET",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<{ qr: string | null }>),
    [fetch]
  );
}

export function useLogoutWhatsappService() {
  const fetch = useFetch();
  return useCallback(
    (requestConfig?: RequestConfigType) =>
      fetch(`${API_URL}/api/v1/whatsapp/admin/logout`, {
        method: "POST",
        ...requestConfig,
      }).then(wrapperFetchJsonResponse<void>),
    [fetch]
  );
}
